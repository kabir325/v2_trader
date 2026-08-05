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
  resetPortfolio
} from "./src/server/traderStore.js";

import { growwClient } from "./src/server/growwClient.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
