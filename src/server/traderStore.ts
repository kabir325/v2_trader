import {
  WatchlistItem,
  Position,
  Trade,
  TradingSignal,
  ModelRun,
  SystemEvent,
  Heartbeat,
  PortfolioStats,
  EquityPoint,
  StockPoint,
  SystemConfig,
  TradingMode
} from "../types.js";

// Initial config matching settings.yaml and environment variables
export let config: SystemConfig = {
  trading: {
    mode: (process.env.TRADING_MODE as TradingMode) || "PAPER",
    initial_capital: 100000,
    max_position_pct: 0.10,
    max_trade_amount: 15000,
    stop_loss_pct: 2.0,
    take_profit_pct: 4.0,
    max_concurrent_positions: 5,
    poll_interval_seconds: 60,
    paper_training_weeks: 3,
    min_training_samples: 500,
  },
  credentials: {
    groww_api_token: process.env.GROWW_API_TOKEN || "grw_live_demo_key_998811",
    groww_api_secret: process.env.GROWW_API_SECRET || "sec_groww_772211",
    groww_totp_key: process.env.GROWW_TOTP_KEY || "JBSWY3DPEHPK3PXP",
    is_token_valid: true,
  },
  raspberry_pi: {
    enabled: true,
    auto_restart: true,
    sqlite_wal_mode: true,
    service_status: "WATCHDOG_ON",
    uptime_seconds: 142050,
  },
  market: {
    timezone: "Asia/Kolkata",
    open_time: "09:15",
    close_time: "15:30",
    skip_open_minutes: 5,
    skip_close_minutes: 10,
  },
  ml: {
    forward_return_minutes: 30,
    min_confidence: 0.55,
    retrain_on_sunday: true,
  },
};

export let currentWeek = 2; // Week 2 of paper phase

// Initial Watchlist from symbols.yaml
export const defaultWatchlist: WatchlistItem[] = [
  {
    symbol: "RELIANCE",
    category: "Energy",
    priority: 1,
    enabled: true,
    tags: "largecap,bluechip,oilgas",
    notes: "RIL — energy + retail conglomerate",
    exchange: "NSE",
    ltp: 2950.50,
    open: 2920.00,
    high: 2975.00,
    low: 2915.00,
    close: 2910.00,
    change: 40.50,
    changePct: 1.39,
    volume: 3840200,
  },
  {
    symbol: "TCS",
    category: "IT",
    priority: 1,
    enabled: true,
    tags: "largecap,bluechip,IT",
    notes: "Tata Consultancy — largest IT exporter",
    exchange: "NSE",
    ltp: 4120.00,
    open: 4140.00,
    high: 4160.00,
    low: 4100.00,
    close: 4150.00,
    change: -30.00,
    changePct: -0.72,
    volume: 1950400,
  },
  {
    symbol: "HDFCBANK",
    category: "Banking",
    priority: 1,
    enabled: true,
    tags: "largecap,banking,bluechip",
    notes: "HDFC Bank — largest private sector bank",
    exchange: "NSE",
    ltp: 1642.80,
    open: 1630.00,
    high: 1655.00,
    low: 1625.00,
    close: 1628.00,
    change: 14.80,
    changePct: 0.91,
    volume: 8420100,
  },
  {
    symbol: "INFY",
    category: "IT",
    priority: 2,
    enabled: true,
    tags: "largecap,bluechip,IT",
    notes: "Infosys — IT services bellwether",
    exchange: "NSE",
    ltp: 1825.40,
    open: 1800.00,
    high: 1838.00,
    low: 1795.00,
    close: 1798.00,
    change: 27.40,
    changePct: 1.52,
    volume: 5210900,
  },
  {
    symbol: "ICICIBANK",
    category: "Banking",
    priority: 2,
    enabled: true,
    tags: "largecap,banking,bluechip",
    notes: "ICICI Bank — 2nd largest private bank",
    exchange: "NSE",
    ltp: 1215.10,
    open: 1210.00,
    high: 1222.00,
    low: 1205.00,
    close: 1208.00,
    change: 7.10,
    changePct: 0.59,
    volume: 6300400,
  },
  {
    symbol: "SBIN",
    category: "Banking",
    priority: 3,
    enabled: true,
    tags: "largecap,banking,psu",
    notes: "State Bank — largest PSU bank",
    exchange: "NSE",
    ltp: 842.30,
    open: 848.00,
    high: 852.00,
    low: 839.00,
    close: 846.00,
    change: -3.70,
    changePct: -0.44,
    volume: 12104500,
  },
  {
    symbol: "BHARTIARTL",
    category: "Telecom",
    priority: 3,
    enabled: true,
    tags: "largecap,telecom",
    notes: "Bharti Airtel — telecom leader",
    exchange: "NSE",
    ltp: 1458.00,
    open: 1425.00,
    high: 1465.00,
    low: 1420.00,
    close: 1428.00,
    change: 30.00,
    changePct: 2.10,
    volume: 4120800,
  },
  {
    symbol: "ITC",
    category: "FMCG",
    priority: 4,
    enabled: true,
    tags: "largecap,fmcg,bluechip",
    notes: "ITC Ltd — FMCG + hotels + agri",
    exchange: "NSE",
    ltp: 492.50,
    open: 491.00,
    high: 495.00,
    low: 489.00,
    close: 491.00,
    change: 1.50,
    changePct: 0.31,
    volume: 9804000,
  },
  {
    symbol: "KOTAKBANK",
    category: "Banking",
    priority: 4,
    enabled: true,
    tags: "largecap,banking,private",
    notes: "Kotak Mahindra Bank",
    exchange: "NSE",
    ltp: 1782.00,
    open: 1795.00,
    high: 1802.00,
    low: 1775.00,
    close: 1792.00,
    change: -10.00,
    changePct: -0.56,
    volume: 2450100,
  },
  {
    symbol: "LT",
    category: "Infra",
    priority: 4,
    enabled: true,
    tags: "largecap,infra,bluechip",
    notes: "Larsen & Toubro — infra conglomerate",
    exchange: "NSE",
    ltp: 3658.00,
    open: 3620.00,
    high: 3680.00,
    low: 3610.00,
    close: 3625.00,
    change: 33.00,
    changePct: 0.91,
    volume: 1840200,
  }
];

export let watchlist: WatchlistItem[] = [...defaultWatchlist];

export let cashBalance = 74820.50; // Started at 100,000
export let positions: Position[] = [
  {
    id: "pos-1",
    symbol: "RELIANCE",
    qty: 3,
    avgPrice: 2910.00,
    currentPrice: 2950.50,
    pnl: 121.50,
    pnlPct: 1.39,
    mode: "PAPER",
    entryTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    side: "BUY"
  },
  {
    id: "pos-2",
    symbol: "INFY",
    qty: 5,
    avgPrice: 1798.00,
    currentPrice: 1825.40,
    pnl: 137.00,
    pnlPct: 1.52,
    mode: "PAPER",
    entryTime: new Date(Date.now() - 86400000).toISOString(),
    side: "BUY"
  },
  {
    id: "pos-3",
    symbol: "BHARTIARTL",
    qty: 5,
    avgPrice: 1428.00,
    currentPrice: 1458.00,
    pnl: 150.00,
    pnlPct: 2.10,
    mode: "PAPER",
    entryTime: new Date(Date.now() - 43200000).toISOString(),
    side: "BUY"
  }
];

export let closedTrades: Trade[] = [
  {
    id: "trade-1",
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    symbol: "TCS",
    side: "BUY",
    qty: 2,
    price: 4080.00,
    total: 8160.00,
    mode: "PAPER",
    reason: "price -0.8% below 20-period SMA"
  },
  {
    id: "trade-2",
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    symbol: "TCS",
    side: "SELL",
    qty: 2,
    price: 4150.00,
    total: 8300.00,
    mode: "PAPER",
    pnl: 140.00,
    pnlPct: 1.72,
    reason: "price +1.2% above 20-period SMA"
  },
  {
    id: "trade-3",
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    symbol: "HDFCBANK",
    side: "BUY",
    qty: 5,
    price: 1610.00,
    total: 8050.00,
    mode: "PAPER",
    reason: "price -0.6% below 20-period SMA"
  },
  {
    id: "trade-4",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    symbol: "HDFCBANK",
    side: "SELL",
    qty: 5,
    price: 1638.00,
    total: 8190.00,
    mode: "PAPER",
    pnl: 140.00,
    pnlPct: 1.74,
    reason: "price +0.9% above 20-period SMA"
  },
  {
    id: "trade-5",
    timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    symbol: "SBIN",
    side: "BUY",
    qty: 10,
    price: 850.00,
    total: 8500.00,
    mode: "PAPER",
    reason: "price -0.5% below 20-period SMA"
  },
  {
    id: "trade-6",
    timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(),
    symbol: "SBIN",
    side: "SELL",
    qty: 10,
    price: 842.00,
    total: 8420.00,
    mode: "PAPER",
    pnl: -80.00,
    pnlPct: -0.94,
    reason: "stop loss trigger / market dip"
  }
];

export let signals: TradingSignal[] = [
  {
    id: "sig-1",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    symbol: "RELIANCE",
    signal: "BUY",
    price: 2910.00,
    confidence: 0.78,
    mode: "PAPER",
    reason: "price -0.65% below 20-period SMA"
  },
  {
    id: "sig-2",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    symbol: "INFY",
    signal: "BUY",
    price: 1798.00,
    confidence: 0.82,
    mode: "PAPER",
    reason: "price -0.72% below 20-period SMA"
  },
  {
    id: "sig-3",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    symbol: "BHARTIARTL",
    signal: "BUY",
    price: 1428.00,
    confidence: 0.75,
    mode: "PAPER",
    reason: "momentum spike + breakout signal"
  },
  {
    id: "sig-4",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    symbol: "TCS",
    signal: "HOLD",
    price: 4120.00,
    confidence: 0.52,
    mode: "PAPER",
    reason: "within band (-0.12%)"
  },
  {
    id: "sig-5",
    timestamp: new Date().toISOString(),
    symbol: "ICICIBANK",
    signal: "HOLD",
    price: 1215.10,
    confidence: 0.58,
    mode: "PAPER",
    reason: "within band (+0.25%)"
  }
];

export let modelRuns: ModelRun[] = [
  {
    id: "run-1",
    trainedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    samples: 1240,
    accuracy: 0.612,
    precision: 0.589,
    recall: 0.634,
    notes: "End of Week 1 paper training run. RandomForest 100 trees."
  },
  {
    id: "run-2",
    trainedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    samples: 2890,
    accuracy: 0.678,
    precision: 0.654,
    recall: 0.691,
    notes: "Mid Week 2 incremental training. Added 50 estimators."
  }
];

export let systemEvents: SystemEvent[] = [
  {
    id: "evt-1",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    level: "INFO",
    component: "daemon",
    message: "Trading daemon initialized in PAPER mode. Capital: ₹1,00,000"
  },
  {
    id: "evt-2",
    timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    level: "INFO",
    component: "groww_client",
    message: "Groww API connected. Streaming 10 watchlist quotes."
  },
  {
    id: "evt-3",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    level: "INFO",
    component: "paper_trader",
    message: "Executed Paper Order BUY RELIANCE 3 qty @ ₹2,910.00"
  },
  {
    id: "evt-4",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    level: "INFO",
    component: "ml",
    message: "Incremental retraining completed. 2,890 market snapshot samples used."
  },
  {
    id: "evt-5",
    timestamp: new Date().toISOString(),
    level: "INFO",
    component: "heartbeat",
    message: "Market open IST. Daemon running normally."
  }
];

export let heartbeats: Heartbeat[] = [
  {
    id: "hb-1",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: "OK",
    marketOpen: true,
    mode: "PAPER",
    message: "Cycle completed. Polled 10 quotes. No new orders triggered."
  },
  {
    id: "hb-2",
    timestamp: new Date().toISOString(),
    status: "OK",
    marketOpen: true,
    mode: "PAPER",
    message: "Cycle completed. All watchlist prices updated."
  }
];

// Historical Equity Curve Data
export let equityCurve: EquityPoint[] = Array.from({ length: 15 }, (_, i) => {
  const date = new Date(Date.now() - (14 - i) * 86400000);
  const base = 100000;
  const growth = Math.sin(i / 2) * 800 + i * 220;
  const value = Math.round((base + growth) * 100) / 100;
  return {
    timestamp: date.toISOString().split("T")[0],
    value: value,
    cash: Math.round((value - 24000) * 100) / 100,
    invested: 24000,
  };
});

// Logs Content Buffer
export const logFilesContent: Record<string, string[]> = {
  "trading.log": [
    `[INFO] ${new Date().toISOString()} - [trading] Initialized BaselineStrategy (SMA Mean Reversion)`,
    `[INFO] ${new Date().toISOString()} - [trading] Evaluating quote RELIANCE LTP 2950.50 (SMA: 2912.00, Dev: +1.32%) -> BUY Signal`,
    `[INFO] ${new Date().toISOString()} - [trading] Paper Position created: RELIANCE qty 3 @ 2910.00`,
    `[INFO] ${new Date().toISOString()} - [trading] Evaluating quote INFY LTP 1825.40 (SMA: 1801.00, Dev: +1.35%) -> BUY Signal`,
    `[INFO] ${new Date().toISOString()} - [trading] Paper Position created: INFY qty 5 @ 1798.00`,
    `[INFO] ${new Date().toISOString()} - [trading] Evaluating quote TCS LTP 4120.00 (SMA: 4125.00, Dev: -0.12%) -> HOLD`,
  ],
  "api.log": [
    `[INFO] ${new Date().toISOString()} - [groww] Connecting to Groww API websocket / REST quotes...`,
    `[INFO] ${new Date().toISOString()} - [groww] Successfully retrieved 10 stock quotes from NSE.`,
    `[INFO] ${new Date().toISOString()} - [groww] Quote latency: 42ms. Mock Fallback active if API token omitted.`,
  ],
  "system.log": [
    `[INFO] ${new Date().toISOString()} - [system] Daemon starting up. Host: Cloud Run container.`,
    `[INFO] ${new Date().toISOString()} - [system] Database synced. Snapshot count: 2,890.`,
    `[INFO] ${new Date().toISOString()} - [system] Scheduled Sunday ML retrain job active.`,
  ],
  "ml.log": [
    `[INFO] ${new Date().toISOString()} - [ml] Feature engineering pipeline created 18 technical indicators (RSI, MACD, SMA_ratio, Volatility).`,
    `[INFO] ${new Date().toISOString()} - [ml] Training RandomForestClassifier on 2,890 samples...`,
    `[INFO] ${new Date().toISOString()} - [ml] Model accuracy: 67.8%, Precision: 65.4%, Recall: 69.1%. Saved model checkpoint.`,
  ],
};

// Stock Historical Data generator for chart
export function getStockHistory(symbol: string): StockPoint[] {
  const stock = watchlist.find((s) => s.symbol === symbol) || watchlist[0];
  const points: StockPoint[] = [];
  let basePrice = stock.ltp * 0.95;
  const now = Date.now();

  for (let i = 20; i >= 0; i--) {
    const time = new Date(now - i * 3600000).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const noise = (Math.sin(i * 0.8) + (Math.random() - 0.48)) * (stock.ltp * 0.008);
    basePrice += noise;
    const ltp = Math.round(basePrice * 100) / 100;
    const sma = Math.round((basePrice * 0.992) * 100) / 100;
    const high = Math.round((ltp + Math.abs(noise) * 0.5) * 100) / 100;
    const low = Math.round((ltp - Math.abs(noise) * 0.5) * 100) / 100;
    const open = Math.round((ltp - noise * 0.3) * 100) / 100;
    const close = ltp;

    let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
    if (i === 12) signal = "BUY";
    if (i === 3) signal = "SELL";

    points.push({
      timestamp: time,
      ltp,
      sma,
      high,
      low,
      open,
      close,
      volume: Math.floor(100000 + Math.random() * 500000),
      signal,
    });
  }
  return points;
}

// Calculate total portfolio stats
export function getPortfolioStats(): PortfolioStats {
  const investedValue = positions.reduce(
    (sum, pos) => sum + pos.currentPrice * pos.qty,
    0
  );
  const unrealizedPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const realizedPnl = closedTrades.reduce(
    (sum, tr) => sum + (tr.pnl || 0),
    0
  );
  const totalPnl = unrealizedPnl + realizedPnl;
  const totalValue = cashBalance + investedValue;
  const initialCapital = config.trading.initial_capital;
  const totalPnlPct = Math.round(((totalValue - initialCapital) / initialCapital) * 10000) / 100;

  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
  const closedCount = closedTrades.filter((t) => t.pnl !== undefined).length;
  const winRate = closedCount > 0 ? Math.round((winningTrades / closedCount) * 100) : 0;

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    initialCapital,
    cashBalance: Math.round(cashBalance * 100) / 100,
    investedValue: Math.round(investedValue * 100) / 100,
    unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
    realizedPnl: Math.round(realizedPnl * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalPnlPct,
    winRate,
    totalTrades: closedTrades.length,
    closedTradesCount: closedCount,
    currentWeek,
    paperTrainingWeeks: config.trading.paper_training_weeks,
    mode: config.trading.mode,
    marketOpen: true,
    lastCycleAt: heartbeats[heartbeats.length - 1]?.timestamp,
  };
}

// Run 1 simulation cycle
export function runSimulationCycle() {
  const timestamp = new Date().toISOString();

  // 1. Randomly fluctuate watchlist prices
  watchlist.forEach((stock) => {
    if (!stock.enabled) return;
    const deltaPct = (Math.random() - 0.49) * 0.012; // -0.6% to +0.6%
    const newLtp = Math.max(10, Math.round((stock.ltp * (1 + deltaPct)) * 100) / 100);
    const diff = Math.round((newLtp - stock.close) * 100) / 100;
    const diffPct = Math.round((diff / stock.close) * 10000) / 100;

    stock.ltp = newLtp;
    stock.change = diff;
    stock.changePct = diffPct;
    stock.high = Math.max(stock.high, newLtp);
    stock.low = Math.min(stock.low, newLtp);
    stock.volume += Math.floor(Math.random() * 25000);

    // Update matching open position current price & pnl
    positions.forEach((pos) => {
      if (pos.symbol === stock.symbol) {
        pos.currentPrice = stock.ltp;
        pos.pnl = Math.round((pos.currentPrice - pos.avgPrice) * pos.qty * 100) / 100;
        pos.pnlPct = Math.round(((pos.currentPrice - pos.avgPrice) / pos.avgPrice) * 10000) / 100;
      }
    });
  });

  // 2. Select a stock to generate signal
  const enabledStocks = watchlist.filter((s) => s.enabled);
  if (enabledStocks.length > 0) {
    const pickedStock = enabledStocks[Math.floor(Math.random() * enabledStocks.length)];
    const signalTypes: ("BUY" | "SELL" | "HOLD")[] = ["BUY", "SELL", "HOLD", "HOLD", "BUY"];
    const sigType = signalTypes[Math.floor(Math.random() * signalTypes.length)];
    const confidence = Math.round((0.55 + Math.random() * 0.35) * 100) / 100;
    const mode = config.trading.mode;

    let reason = "price fluctuation within SMA band";
    if (sigType === "BUY") {
      reason = config.trading.mode === "LIVE"
        ? `ML Model buy trigger (confidence=${confidence})`
        : `price ${Math.round(Math.random() * 80 + 20) / 100}% below 20-period SMA`;
    } else if (sigType === "SELL") {
      reason = config.trading.mode === "LIVE"
        ? `ML Model sell trigger (confidence=${confidence})`
        : `price ${Math.round(Math.random() * 80 + 20) / 100}% above 20-period SMA`;
    }

    const newSignal: TradingSignal = {
      id: `sig-${Date.now()}`,
      timestamp,
      symbol: pickedStock.symbol,
      signal: sigType,
      price: pickedStock.ltp,
      confidence,
      mode,
      reason,
    };
    signals.unshift(newSignal);
    if (signals.length > 50) signals.pop();

    // Log to file
    logFilesContent["trading.log"].push(
      `[INFO] ${timestamp} - [trading] Generated ${sigType} signal for ${pickedStock.symbol} @ ₹${pickedStock.ltp} (${reason})`
    );

    // 3. Execute paper/live trade if BUY signal and no position exists, or SELL signal if position exists
    const existingPosIndex = positions.findIndex((p) => p.symbol === pickedStock.symbol);

    if (sigType === "BUY" && existingPosIndex === -1 && cashBalance > pickedStock.ltp * 2) {
      const qty = Math.min(5, Math.floor((config.trading.initial_capital * config.trading.max_position_pct) / pickedStock.ltp)) || 1;
      const totalCost = qty * pickedStock.ltp;

      cashBalance -= totalCost;
      const newPos: Position = {
        id: `pos-${Date.now()}`,
        symbol: pickedStock.symbol,
        qty,
        avgPrice: pickedStock.ltp,
        currentPrice: pickedStock.ltp,
        pnl: 0,
        pnlPct: 0,
        mode,
        entryTime: timestamp,
        side: "BUY",
      };
      positions.push(newPos);

      systemEvents.unshift({
        id: `evt-${Date.now()}`,
        timestamp,
        level: "INFO",
        component: mode === "LIVE" ? "live_trader" : "paper_trader",
        message: `Executed ${mode} ORDER: BUY ${qty} ${pickedStock.symbol} @ ₹${pickedStock.ltp}`,
      });
    } else if (sigType === "SELL" && existingPosIndex !== -1) {
      const posToClose = positions[existingPosIndex];
      positions.splice(existingPosIndex, 1);

      const exitPrice = pickedStock.ltp;
      const tradePnl = Math.round((exitPrice - posToClose.avgPrice) * posToClose.qty * 100) / 100;
      const tradePnlPct = Math.round(((exitPrice - posToClose.avgPrice) / posToClose.avgPrice) * 10000) / 100;
      const totalReturn = posToClose.qty * exitPrice;

      cashBalance += totalReturn;

      const closedTrade: Trade = {
        id: `trade-${Date.now()}`,
        timestamp,
        symbol: pickedStock.symbol,
        side: "SELL",
        qty: posToClose.qty,
        price: exitPrice,
        total: totalReturn,
        mode,
        pnl: tradePnl,
        pnlPct: tradePnlPct,
        reason: `Signal trigger SELL / Take Profit`,
      };
      closedTrades.unshift(closedTrade);

      systemEvents.unshift({
        id: `evt-${Date.now()}`,
        timestamp,
        level: "INFO",
        component: mode === "LIVE" ? "live_trader" : "paper_trader",
        message: `Closed ${mode} POSITION: SELL ${posToClose.qty} ${pickedStock.symbol} @ ₹${exitPrice} (P&L: ₹${tradePnl})`,
      });
    }
  }

  // Update Equity Curve
  const stats = getPortfolioStats();
  const todayStr = new Date().toISOString().split("T")[0];
  const lastEq = equityCurve[equityCurve.length - 1];
  if (lastEq && lastEq.timestamp === todayStr) {
    lastEq.value = stats.totalValue;
    lastEq.cash = stats.cashBalance;
    lastEq.invested = stats.investedValue;
  } else {
    equityCurve.push({
      timestamp: todayStr,
      value: stats.totalValue,
      cash: stats.cashBalance,
      invested: stats.investedValue,
    });
  }

  // Record Heartbeat
  heartbeats.unshift({
    id: `hb-${Date.now()}`,
    timestamp,
    status: "OK",
    marketOpen: true,
    mode: config.trading.mode,
    message: `Cycle completed. Polled ${enabledStocks.length} quotes.`,
  });
  if (heartbeats.length > 50) heartbeats.pop();

  return stats;
}

// Retrain ML Model
export function retrainModel() {
  const timestamp = new Date().toISOString();
  const lastRun = modelRuns[modelRuns.length - 1];
  const newSamples = (lastRun?.samples || 2000) + Math.floor(Math.random() * 400 + 200);
  const newAccuracy = Math.round((0.65 + Math.random() * 0.12) * 1000) / 1000;
  const newPrecision = Math.round((newAccuracy - 0.02 + Math.random() * 0.04) * 1000) / 1000;
  const newRecall = Math.round((newAccuracy + 0.01 + Math.random() * 0.03) * 1000) / 1000;

  const newRun: ModelRun = {
    id: `run-${Date.now()}`,
    trainedAt: timestamp,
    samples: newSamples,
    accuracy: newAccuracy,
    precision: newPrecision,
    recall: newRecall,
    notes: `Manual retrain trigger. Incremental tree growth (+50 estimators). Samples: ${newSamples}`,
  };

  modelRuns.unshift(newRun);

  systemEvents.unshift({
    id: `evt-${Date.now()}`,
    timestamp,
    level: "INFO",
    component: "ml",
    message: `Model Retrained: Accuracy ${(newAccuracy * 100).toFixed(1)}%, Precision ${(newPrecision * 100).toFixed(1)}%, Samples: ${newSamples}`,
  });

  logFilesContent["ml.log"].push(
    `[INFO] ${timestamp} - [ml] Retrain triggered. Added ${newSamples - (lastRun?.samples || 0)} new market snapshots. Accuracy=${(newAccuracy * 100).toFixed(1)}%`
  );

  return newRun;
}

// Reset Portfolio (Full Wipe or Capital Reset)
export function resetPortfolio(customCapital?: number, hardClear: boolean = false) {
  if (customCapital && customCapital > 0) {
    config.trading.initial_capital = customCapital;
  }
  cashBalance = config.trading.initial_capital;
  positions = [];
  closedTrades = [];
  signals = [];
  currentWeek = 1;

  if (hardClear) {
    modelRuns = [];
    heartbeats = [];
    systemEvents = [];
    equityCurve = [{
      timestamp: new Date().toISOString().split("T")[0],
      value: config.trading.initial_capital,
      cash: config.trading.initial_capital,
      invested: 0,
    }];
    logFilesContent["trading.log"] = [`[INFO] ${new Date().toISOString()} - [system] Hard reset executed. All history cleared. Base capital set to ₹${config.trading.initial_capital.toLocaleString("en-IN")}`];
  }

  systemEvents.unshift({
    id: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: "WARNING",
    component: "system",
    message: `Portfolio ${hardClear ? "hard reset & wiped" : "reset"} back to initial capital ₹${config.trading.initial_capital.toLocaleString("en-IN")}`,
  });
  return getPortfolioStats();
}
