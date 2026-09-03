import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  config,
  systemEvents,
  heartbeats,
  logFilesContent,
  getPortfolioStats,
  getWatchlist,
  getSignals,
  getMlStatus,
  getAvailableIndexes,
  getSelectedIndex,
  setSelectedIndex,
  getActiveIndexStore,
  getStockHistory,
  runSimulationCycle,
  retrainModel,
  resetPortfolio,
  trainHistoricalModel,
  getPaperBotState,
  updatePaperBotConfig,
  resetPaperBot,
  stepPaperBot,
  runQuantMlPipelineForIndex,
  getLatestQuantPipelineResult,
  getSavedQuantModelFiles
} from "./src/server/traderStore.js";

import { growwClient } from "./src/server/growwClient.js";
import { investmentStore } from "./src/server/investmentStore.js";
import { microDeliveryAlgoStore } from "./src/server/microDeliveryAlgoStore.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Groww Client with active config credentials
  if (config.credentials) {
    growwClient.updateCredentials(
      config.credentials.groww_api_token || "",
      config.credentials.groww_api_secret || "",
      config.credentials.groww_totp_key || ""
    );
  }

  app.use(express.json());

  // ==================== API ROUTES ====================

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "My Money Maker - Algorithmic Trader" });
  });

  // Available Indexes & Switch active index
  app.get("/api/indexes", (_req, res) => {
    res.json({
      indexes: getAvailableIndexes(),
      selectedIndex: getSelectedIndex(),
    });
  });

  app.post("/api/trader/select-index", (req, res) => {
    const { index } = req.body;
    if (!index || typeof index !== "string") {
      return res.status(400).json({ error: "Index ID is required" });
    }
    const stats = setSelectedIndex(index);
    const activeStore = getActiveIndexStore();
    res.json({
      success: true,
      stats,
      watchlist: activeStore.watchlist,
      signals: activeStore.signals,
      mlStatus: getMlStatus(),
    });
  });

  // Portfolio Overview for current active index
  app.get("/api/portfolio", (_req, res) => {
    const stats = getPortfolioStats();
    const activeStore = getActiveIndexStore();
    res.json({
      stats,
      positions: activeStore.positions,
      closedTrades: activeStore.closedTrades,
      equityCurve: activeStore.equityCurve,
    });
  });

  // Run Simulation / Market Cycle
  app.post("/api/trader/cycle", async (_req, res) => {
    try {
      const stats = await runSimulationCycle();
      const activeStore = getActiveIndexStore();
      res.json({
        success: true,
        stats,
        latestSignal: activeStore.signals[0] || null,
        latestHeartbeat: heartbeats[0] || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Cycle error" });
    }
  });

  // Sandbox Script Executor (Allows user to run custom JS/Node code with injected Groww keys)
  app.post("/api/sandbox/execute", async (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code snippet string is required" });
    }

    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
      error: (...args: any[]) => logs.push("[ERROR] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
      warn: (...args: any[]) => logs.push("[WARN] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
      info: (...args: any[]) => logs.push("[INFO] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" ")),
    };

    const token = config.credentials.groww_api_token || process.env.GROWW_API_TOKEN || "grw_live_demo_key_998811";
    const secret = config.credentials.groww_api_secret || process.env.GROWW_API_SECRET || "sec_groww_772211";
    const totpKey = config.credentials.groww_totp_key || process.env.GROWW_TOTP_KEY || "JBSWY3DPEHPK3PXP";

    try {
      const asyncFn = new Function(
        "GROWW_API_TOKEN",
        "GROWW_API_SECRET",
        "GROWW_TOTP_KEY",
        "growwClient",
        "console",
        "fetch",
        `return (async () => {
          ${code}
        })();`
      );

      const result = await asyncFn(token, secret, totpKey, growwClient, customConsole, globalThis.fetch);

      res.json({
        success: true,
        logs,
        result: result !== undefined ? (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)) : null,
        error: null,
      });
    } catch (err: any) {
      res.json({
        success: false,
        logs,
        result: null,
        error: err.message || String(err),
      });
    }
  });

  // Trigger Model Retraining specifically for active index
  app.post("/api/trader/train-model", (_req, res) => {
    const newRun = retrainModel();
    res.json({
      success: true,
      run: newRun,
      message: `ML Model retrained successfully for active index [${getActiveIndexStore().name}]`,
    });
  });

  // Fetch Groww / Yahoo Real Historical OHLCV Candles
  app.get("/api/groww/historical", async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || "RELIANCE";
      const timeframe = (req.query.timeframe as any) || "3m";
      const interval = (req.query.interval as any) || "1d";

      const candles = await growwClient.getHistoricalOHLCV(symbol, timeframe, interval);
      res.json({ success: true, symbol, timeframe, interval, total: candles.length, candles });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Historical candles error" });
    }
  });

  // Train ML Model on Real Historical OHLCV Data & Run Backtest
  app.post("/api/ml/train-historical", async (req, res) => {
    try {
      const options = req.body;
      const result = await trainHistoricalModel(options);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Historical training error" });
    }
  });

  // Isolated Paper Bot API Endpoints
  app.get("/api/paper-bot/state", (_req, res) => {
    res.json({ success: true, botState: getPaperBotState() });
  });

  app.post("/api/paper-bot/config", (req, res) => {
    const { budget, enabled } = req.body;
    const botState = updatePaperBotConfig(Number(budget || 25000), enabled !== false);
    res.json({ success: true, botState });
  });

  app.post("/api/paper-bot/reset", (req, res) => {
    const budget = req.body.budget ? Number(req.body.budget) : undefined;
    const botState = resetPaperBot(budget);
    res.json({ success: true, botState });
  });

  app.post("/api/paper-bot/step", (_req, res) => {
    const botState = stepPaperBot();
    res.json({ success: true, botState });
  });

  // Reset Portfolio (Supports hard reset & custom starting capital)
  app.post("/api/trader/reset", (req, res) => {
    const customCapital = req.body.capital ? Number(req.body.capital) : undefined;
    const hardReset = req.body.hardReset === true;
    const stats = resetPortfolio(customCapital, hardReset);
    res.json({
      success: true,
      stats,
      message: hardReset ? "Hard reset complete. Trading history wiped." : "Portfolio reset to initial capital",
    });
  });

  // Watchlist Endpoints
  app.get("/api/watchlist", (_req, res) => {
    res.json(getWatchlist());
  });

  app.post("/api/watchlist", (req, res) => {
    const { symbol, category, priority, tags, notes } = req.body;
    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }
    const cleanSym = symbol.trim().toUpperCase();
    const watchlist = getWatchlist();
    const existing = watchlist.find((w) => w.symbol === cleanSym);
    if (existing) {
      return res.status(400).json({ error: "Stock already in active index watchlist" });
    }

    const newItem = {
      symbol: cleanSym,
      category: category || "General",
      priority: Number(priority) || 5,
      enabled: true,
      tags: tags || "custom",
      notes: notes || "",
      exchange: "NSE",
      ltp: 1000 + Math.round(Math.random() * 2000),
      open: 1000,
      high: 1050,
      low: 990,
      close: 1000,
      change: 0,
      changePct: 0,
      volume: 500000,
    };
    watchlist.push(newItem);
    res.json({ success: true, item: newItem });
  });

  app.patch("/api/watchlist/:symbol", (req, res) => {
    const cleanSym = req.params.symbol.toUpperCase();
    const watchlist = getWatchlist();
    const item = watchlist.find((w) => w.symbol === cleanSym);
    if (!item) {
      return res.status(404).json({ error: "Stock not found" });
    }
    if (req.body.enabled !== undefined) item.enabled = Boolean(req.body.enabled);
    if (req.body.priority !== undefined) item.priority = Number(req.body.priority);
    if (req.body.category !== undefined) item.category = String(req.body.category);
    if (req.body.notes !== undefined) item.notes = String(req.body.notes);

    res.json({ success: true, item });
  });

  app.delete("/api/watchlist/:symbol", (req, res) => {
    const cleanSym = req.params.symbol.toUpperCase();
    const watchlist = getWatchlist();
    const idx = watchlist.findIndex((w) => w.symbol === cleanSym);
    if (idx === -1) {
      return res.status(404).json({ error: "Stock not found" });
    }
    watchlist.splice(idx, 1);
    res.json({ success: true, message: `Removed ${cleanSym} from active index watchlist` });
  });

  // Trading Signals for active index
  app.get("/api/signals", (_req, res) => {
    res.json(getSignals());
  });

  // ML Status for active index
  app.get("/api/ml/status", (_req, res) => {
    res.json(getMlStatus());
  });

  // Quant ML Pipeline Endpoints
  app.post("/api/quant/run-pipeline", async (req, res) => {
    try {
      const result = await runQuantMlPipelineForIndex(req.body || {});
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to execute Quant ML Pipeline" });
    }
  });

  app.get("/api/quant/latest", (_req, res) => {
    const latest = getLatestQuantPipelineResult();
    res.json({ latest });
  });

  app.get("/api/quant/model-files", (_req, res) => {
    const files = getSavedQuantModelFiles();
    res.json({ files });
  });

  // System Logs & DB Events
  app.get("/api/logs", (req, res) => {
    const file = (req.query.file as string) || "trading.log";
    const content = logFilesContent[file] || logFilesContent["trading.log"] || [];
    res.json({
      file,
      availableFiles: Object.keys(logFilesContent),
      lines: content,
      systemEvents,
    });
  });

  // Configuration
  app.get("/api/config", (_req, res) => {
    const watchlist = getWatchlist();
    const store = getActiveIndexStore();
    res.json({
      config,
      currentWeek: store.currentWeek,
      activeSymbolsCount: watchlist.filter((w) => w.enabled).length,
      totalWatchlistCount: watchlist.length,
      heartbeats,
    });
  });

  app.post("/api/config", (req, res) => {
    if (req.body.mode && (req.body.mode === "PAPER" || req.body.mode === "LIVE")) {
      config.trading.mode = req.body.mode;
    }
    if (req.body.initial_capital) {
      config.trading.initial_capital = Number(req.body.initial_capital);
    }
    if (req.body.max_position_pct) {
      config.trading.max_position_pct = Number(req.body.max_position_pct);
    }
    if (req.body.max_trade_amount) {
      config.trading.max_trade_amount = Number(req.body.max_trade_amount);
    }
    if (req.body.stop_loss_pct) {
      config.trading.stop_loss_pct = Number(req.body.stop_loss_pct);
    }
    if (req.body.take_profit_pct) {
      config.trading.take_profit_pct = Number(req.body.take_profit_pct);
    }
    if (req.body.max_concurrent_positions) {
      config.trading.max_concurrent_positions = Number(req.body.max_concurrent_positions);
    }
    if (req.body.poll_interval_seconds) {
      config.trading.poll_interval_seconds = Number(req.body.poll_interval_seconds);
    }
    if (req.body.paper_training_weeks) {
      config.trading.paper_training_weeks = Number(req.body.paper_training_weeks);
    }

    // Groww API Credentials
    if (req.body.groww_api_token !== undefined) {
      config.credentials.groww_api_token = req.body.groww_api_token;
    }
    if (req.body.groww_api_secret !== undefined) {
      config.credentials.groww_api_secret = req.body.groww_api_secret;
    }
    if (req.body.groww_totp_key !== undefined) {
      config.credentials.groww_totp_key = req.body.groww_totp_key;
    }

    growwClient.updateCredentials(
      config.credentials.groww_api_token || "",
      config.credentials.groww_api_secret || "",
      config.credentials.groww_totp_key || ""
    );

    systemEvents.unshift({
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      component: "config",
      message: `Configuration updated: mode=${config.trading.mode}, capital=₹${config.trading.initial_capital}, max_trade=₹${config.trading.max_trade_amount}`,
    });

    res.json({ success: true, config });
  });

  // Download Raspberry Pi systemd service file
  app.get("/api/systemd/download", (_req, res) => {
    const serviceContent = `[Unit]
Description=Groww Algorithmic Trader & ML Daemon (My Money Maker)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/groww-trader
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5s
WatchdogSec=60s
KillMode=process
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_MODE=WAL
EnvironmentFile=/home/pi/groww-trader/.env

[Install]
WantedBy=multi-user.target
`;
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", 'attachment; filename="groww-trader.service"');
    res.send(serviceContent);
  });

  // Stock History Chart Data
  app.get("/api/stocks/:symbol/history", (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const history = getStockHistory(symbol);
    res.json(history);
  });

  // Download Reports (CSV)
  app.get("/api/reports/download", (req, res) => {
    const type = (req.query.type as string) || "trades";
    const store = getActiveIndexStore();
    let csv = "";
    if (type === "trades") {
      csv = "id,timestamp,symbol,side,qty,price,total,mode,pnl,pnlPct,reason\n";
      store.closedTrades.forEach((t) => {
        csv += `${t.id},${t.timestamp},${t.symbol},${t.side},${t.qty},${t.price},${t.total},${t.mode},${t.pnl || 0},${t.pnlPct || 0},"${t.reason}"\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=closed_trades_${store.id}.csv`);
      return res.send(csv);
    } else {
      csv = "id,symbol,qty,avgPrice,currentPrice,pnl,pnlPct,mode,entryTime\n";
      store.positions.forEach((p) => {
        csv += `${p.id},${p.symbol},${p.qty},${p.avgPrice},${p.currentPrice},${p.pnl},${p.pnlPct},${p.mode},${p.entryTime}\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=active_positions_${store.id}.csv`);
      return res.send(csv);
    }
  });

  // ==================== PERSONAL INVESTMENTS & SIP API ====================

  // Get investment portfolio data (stocks, sips, accounting history, summary)
  app.get("/api/investments", (_req, res) => {
    res.json(investmentStore.getPortfolioData());
  });

  // Record accounting snapshot for Market Open or Market Close (EOD)
  app.post("/api/investments/snapshot", (req, res) => {
    const { sessionType, notes } = req.body;
    if (sessionType !== "MARKET_OPEN" && sessionType !== "MARKET_CLOSE") {
      return res.status(400).json({ error: "sessionType must be 'MARKET_OPEN' or 'MARKET_CLOSE'" });
    }
    const snapshot = investmentStore.recordAccountingSnapshot(sessionType, notes);
    res.json({ success: true, snapshot, portfolio: investmentStore.getPortfolioData() });
  });

  // Add stock investment
  app.post("/api/investments/add-stock", (req, res) => {
    const { symbol, name, quantity, buyPrice, currentPrice, sector } = req.body;
    if (!symbol || !name || !quantity || !buyPrice) {
      return res.status(400).json({ error: "Missing required fields for stock investment" });
    }
    const newStock = investmentStore.addStock({
      symbol,
      name,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
      currentPrice: Number(currentPrice || buyPrice),
      sector: sector || "Equity"
    });
    res.json({ success: true, stock: newStock, portfolio: investmentStore.getPortfolioData() });
  });

  // Delete stock investment
  app.delete("/api/investments/stock/:id", (req, res) => {
    const success = investmentStore.deleteStock(req.params.id);
    res.json({ success, portfolio: investmentStore.getPortfolioData() });
  });

  // Add SIP investment
  app.post("/api/investments/add-sip", (req, res) => {
    const { fundName, category, frequency, installmentAmount, totalInstallments, units, avgNav, currentNav } = req.body;
    if (!fundName || !installmentAmount) {
      return res.status(400).json({ error: "Missing required fields for SIP investment" });
    }
    const newSip = investmentStore.addSip({
      fundName,
      category: category || "Flexi Cap",
      frequency: frequency || "Monthly",
      installmentAmount: Number(installmentAmount),
      totalInstallments: Number(totalInstallments || 1),
      units: Number(units || (installmentAmount / (currentNav || 100))),
      avgNav: Number(avgNav || currentNav || 100),
      currentNav: Number(currentNav || 100)
    });
    res.json({ success: true, sip: newSip, portfolio: investmentStore.getPortfolioData() });
  });

  // Delete SIP investment
  app.delete("/api/investments/sip/:id", (req, res) => {
    const success = investmentStore.deleteSip(req.params.id);
    res.json({ success, portfolio: investmentStore.getPortfolioData() });
  });

  // Tick market prices for user investments
  app.post("/api/investments/tick", async (_req, res) => {
    await investmentStore.tickMarketPrices();
    res.json(investmentStore.getPortfolioData());
  });

  // Check Groww connection status
  app.get("/api/investments/groww-status", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({
      success: true,
      credentials: growwClient.getCredentialsStatus()
    });
  });

  // Update Groww credentials directly
  app.post("/api/investments/groww-credentials", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { token, secret, totpKey } = req.body || {};
    if (token !== undefined) config.credentials.groww_api_token = token;
    if (secret !== undefined) config.credentials.groww_api_secret = secret;
    if (totpKey !== undefined) config.credentials.groww_totp_key = totpKey;

    growwClient.updateCredentials(
      config.credentials.groww_api_token || "",
      config.credentials.groww_api_secret || "",
      config.credentials.groww_totp_key || ""
    );

    res.json({
      success: true,
      message: "Groww credentials saved successfully.",
      credentials: growwClient.getCredentialsStatus()
    });
  });

  // Sync holdings & SIPs directly from Groww API
  app.post("/api/investments/sync-groww", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { token, secret, totpKey } = req.body || {};
      if (token) {
        config.credentials.groww_api_token = token;
        if (secret !== undefined) config.credentials.groww_api_secret = secret;
        if (totpKey !== undefined) config.credentials.groww_totp_key = totpKey;
        growwClient.updateCredentials(
          token,
          secret !== undefined ? secret : config.credentials.groww_api_secret || "",
          totpKey !== undefined ? totpKey : config.credentials.groww_totp_key || ""
        );
      }

      const syncResult = await investmentStore.syncWithGroww();
      res.json({
        ...syncResult,
        portfolio: investmentStore.getPortfolioData()
      });
    } catch (err: any) {
      console.error("Groww sync error:", err);
      res.json({
        success: false,
        message: err.message || "Failed to sync with Groww API.",
        stockCount: 0,
        sipCount: 0,
        portfolio: investmentStore.getPortfolioData()
      });
    }
  });

  // Import Groww Holdings CSV file
  app.post("/api/investments/import-groww-csv", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { csvText } = req.body || {};
      if (!csvText || typeof csvText !== "string") {
        return res.json({
          success: false,
          message: "CSV content is required.",
          portfolio: investmentStore.getPortfolioData()
        });
      }
      const importResult = investmentStore.importGrowwCsv(csvText);
      res.json({
        ...importResult,
        portfolio: investmentStore.getPortfolioData()
      });
    } catch (err: any) {
      console.error("Groww CSV import error:", err);
      res.json({
        success: false,
        message: err.message || "Failed to parse CSV file.",
        portfolio: investmentStore.getPortfolioData()
      });
    }
  });

  // Reset portfolio to zero (clear all holdings and accounting history)
  app.post("/api/investments/reset", (_req, res) => {
    investmentStore.clearPortfolio();
    res.json({
      success: true,
      message: "Portfolio reset to 0. All holdings cleared.",
      portfolio: investmentStore.getPortfolioData()
    });
  });

  // Export investment accounting ledger CSV
  app.get("/api/investments/export-csv", (_req, res) => {
    const data = investmentStore.getPortfolioData();
    let csv = "ID,Date,Time,SessionType,Label,StocksInvested,SipInvested,TotalInvested,CurrentNetWorth,DayChange,DayChangePct,TotalPnl,TotalPnlPct,AuditNotes\n";
    data.accountingHistory.forEach((snap) => {
      csv += `"${snap.id}","${snap.date}","${snap.time}","${snap.sessionType}","${snap.label}",${snap.stocksInvested},${snap.sipInvested},${snap.totalInvested},${snap.totalCurrentValue},${snap.dayChangeAmount},${snap.dayChangePct},${snap.totalPnl},${snap.totalPnlPct},"${(snap.notes || "").replace(/"/g, '""')}"\n`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="portfolio_accounting_ledger.csv"');
    res.send(csv);
  });

  // ==================== 10-CUSTOMER MICRO-DELIVERY ALGO API ====================

  // Get current algo state
  app.get("/api/micro-algo/state", (_req, res) => {
    res.json(microDeliveryAlgoStore.getState());
  });

  // Execute Morning Market Open Cycle (random stock delivery buy for all 10 customers)
  app.post("/api/micro-algo/morning-open", (_req, res) => {
    const result = microDeliveryAlgoStore.executeMorningMarketOpenCycle();
    res.json({
      success: true,
      result,
      state: microDeliveryAlgoStore.getState()
    });
  });

  // Tick / Intraday price movement & automated > 5% profit exit evaluation
  app.post("/api/micro-algo/tick", (req, res) => {
    const volatilityFactor = Number(req.body.volatility) || 1.0;
    const tickResult = microDeliveryAlgoStore.tickMarketPrices(volatilityFactor);
    res.json({
      success: true,
      tickResult,
      state: microDeliveryAlgoStore.getState()
    });
  });

  // Advance to next day morning & run morning open buy cycle
  app.post("/api/micro-algo/advance-day", (_req, res) => {
    const advanceResult = microDeliveryAlgoStore.advanceToNextDayMorning();
    res.json({
      success: true,
      advanceResult,
      state: microDeliveryAlgoStore.getState()
    });
  });

  // Reset algorithm to clean initial state (< 100 Rs each, total < 1000 Rs)
  app.post("/api/micro-algo/reset", (_req, res) => {
    const state = microDeliveryAlgoStore.resetAlgo();
    res.json({ success: true, state });
  });

  // ==================== VITE MIDDLEWARE ====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[My Money Maker] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
