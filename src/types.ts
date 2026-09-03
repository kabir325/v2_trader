export type TradingMode = "PAPER" | "LIVE";

export interface WatchlistItem {
  symbol: string;
  category: string;
  priority: number;
  enabled: boolean;
  tags: string;
  notes?: string;
  exchange: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePct: number;
  volume: number;
}

export interface Position {
  id: string;
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  mode: TradingMode;
  entryTime: string;
  side: "BUY" | "SELL";
}

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  total: number;
  mode: TradingMode;
  pnl?: number;
  pnlPct?: number;
  reason: string;
}

export interface TradingSignal {
  id: string;
  timestamp: string;
  symbol: string;
  signal: "BUY" | "SELL" | "HOLD";
  price: number;
  confidence: number;
  mode: TradingMode;
  reason: string;
}

export interface ModelRun {
  id: string;
  trainedAt: string;
  samples: number;
  accuracy: number;
  precision: number;
  recall: number;
  notes: string;
  modelFile?: string;
  algorithm?: string;
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  component: string;
  message: string;
}

export interface Heartbeat {
  id: string;
  timestamp: string;
  status: string;
  marketOpen: boolean;
  mode: TradingMode;
  message: string;
}

export interface RLStats {
  currentWeek: number;
  phase: "PAPER_RL_TRAINING" | "LIVE_RL_EXECUTION";
  episodes: number;
  explorationRate: number;
  avgReward: number;
  totalRewards: number;
  qPolicyConvergence: number;
  recentEpisodes: {
    episode: number;
    action: "BUY" | "SELL" | "HOLD";
    symbol: string;
    reward: number;
    pnlPct: number;
    qValue: number;
    timestamp: string;
  }[];
}

export interface IndexInfo {
  id: string;
  name: string;
  category: string;
  stockCount: number;
  description: string;
}

export interface PortfolioStats {
  totalValue: number;
  initialCapital: number;
  cashBalance: number;
  investedValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  totalPnlPct: number;
  winRate: number;
  totalTrades: number;
  closedTradesCount: number;
  currentWeek: number;
  paperTrainingWeeks: number;
  mode: TradingMode;
  marketOpen: boolean;
  marketStatusText?: string;
  lastCycleAt?: string;
  rlStats?: RLStats;
  selectedIndex?: string;
  selectedIndexName?: string;
  availableIndexes?: IndexInfo[];
}

export interface EquityPoint {
  timestamp: string;
  value: number;
  cash: number;
  invested: number;
}

export interface StockPoint {
  timestamp: string;
  ltp: number;
  sma: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  signal?: "BUY" | "SELL" | "HOLD";
}

export interface SystemConfig {
  trading: {
    mode: TradingMode;
    initial_capital: number;
    max_position_pct: number;
    max_trade_amount: number;
    stop_loss_pct: number;
    take_profit_pct: number;
    max_concurrent_positions: number;
    poll_interval_seconds: number;
    paper_training_weeks: number;
    min_training_samples: number;
  };
  credentials: {
    groww_api_token: string;
    groww_api_secret: string;
    groww_totp_key: string;
    is_token_valid: boolean;
  };
  raspberry_pi: {
    enabled: boolean;
    auto_restart: boolean;
    sqlite_wal_mode: boolean;
    service_status: "ACTIVE" | "IDLE" | "WATCHDOG_ON";
    uptime_seconds: number;
  };
  market: {
    timezone: string;
    open_time: string;
    close_time: string;
    skip_open_minutes: number;
    skip_close_minutes: number;
    allow_market_closed_simulation?: boolean;
  };
  ml: {
    forward_return_minutes: number;
    min_confidence: number;
    retrain_on_sunday: boolean;
  };
}

export interface HistoricalCandleData {
  timestamp: string;
  time?: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  ema20?: number;
  ema50?: number;
  signal?: "BUY" | "SELL" | "HOLD";
}

export interface HistoricalTrainOptions {
  symbol: string;
  timeframe: "1m" | "3m" | "6m" | "1y";
  interval: "1d" | "15m" | "5m";
  epochs: number;
  trainRatio: number; // e.g. 0.8
  learningRate: number; // e.g. 0.01
  features: {
    useRsi: boolean;
    useMacd: boolean;
    useEmaCross: boolean;
    useVolumeSpike: boolean;
    useBollinger: boolean;
  };
  targetHorizonBars: number; // e.g. 5 bars
}

export interface HistoricalTrainResult {
  symbol: string;
  indexName: string;
  totalCandles: number;
  trainSamples: number;
  testSamples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lossHistory: { epoch: number; trainLoss: number; valLoss: number }[];
  featureImportance: { name: string; importance: number }[];
  backtest: {
    totalTrades: number;
    winRate: number;
    totalReturnPct: number;
    buyHoldReturnPct: number;
    maxDrawdownPct: number;
    profitFactor: number;
    tradesList: {
      entryDate: string;
      exitDate: string;
      side: "BUY" | "SELL";
      entryPrice: number;
      exitPrice: number;
      pnlPct: number;
      reason: string;
    }[];
  };
  candlesWithSignals: HistoricalCandleData[];
  trainedAt: string;
  modelFile?: string;
}

export interface PaperBotPosition {
  id: string;
  symbol: string;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: string;
  pnl: number;
  pnlPct: number;
  stopLoss: number;
  takeProfit: number;
}

export interface PaperBotTrade {
  id: string;
  timestamp: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPct: number;
  reason: string;
}

export interface PaperBotState {
  enabled: boolean;
  modelName: string;
  assignedBudget: number;
  cashBalance: number;
  investedValue: number;
  totalPortfolioValue: number;
  totalPnl: number;
  pnlPct: number;
  positions: PaperBotPosition[];
  trades: PaperBotTrade[];
  dayEndSummary: {
    date: string;
    totalTrades: number;
    winRate: number;
    grossProfit: number;
    grossLoss: number;
    netPnl: number;
    roiPct: number;
    bestTradeSymbol: string;
    bestTradePnlPct: number;
  };
}

// ================= USER INVESTMENT & SIP TRACKING TYPES =================

export interface StockInvestment {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  dayChangePct: number;
  sector: string;
  purchaseDate: string;
}

export interface SipInvestment {
  id: string;
  fundName: string;
  category: "Equity" | "Debt" | "Hybrid" | "Index Fund" | "Large Cap" | "Flexi Cap";
  frequency: "Daily" | "Weekly" | "Monthly";
  installmentAmount: number;
  totalInstallments: number;
  investedAmount: number;
  units: number;
  avgNav: number;
  currentNav: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  dayChangePct: number;
  nextSipDate: string;
  startDate: string;
  status: "ACTIVE" | "PAUSED";
}

export interface AccountingSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  sessionType: "MARKET_OPEN" | "MARKET_CLOSE"; // 09:15 AM vs 03:30 PM
  label: string; // e.g. "Morning Open (09:15 AM)" or "End of Day (03:30 PM)"
  totalInvested: number;
  stocksInvested: number;
  sipInvested: number;
  totalCurrentValue: number;
  stocksCurrentValue: number;
  sipCurrentValue: number;
  totalPnl: number;
  totalPnlPct: number;
  dayChangeAmount: number;
  dayChangePct: number;
  notes?: string;
}

export interface InvestmentPortfolioData {
  stocks: StockInvestment[];
  sips: SipInvestment[];
  accountingHistory: AccountingSnapshot[];
  summary: {
    totalInvested: number;
    totalCurrentValue: number;
    totalPnl: number;
    totalPnlPct: number;
    dayChangeAmount: number;
    dayChangePct: number;
    stocksInvested: number;
    stocksValue: number;
    sipInvested: number;
    sipValue: number;
    lastAccountingSession: "MARKET_OPEN" | "MARKET_CLOSE" | "NONE";
    lastAccountingTimestamp: string;
  };
}

// ================= 10-CUSTOMER MICRO-DELIVERY ALGO TYPES =================

export interface MicroDeliveryStock {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  dayChangePct: number;
  sector: string;
}

export interface MicroCustomerHolding {
  id: string;
  symbol: string;
  stockName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  pnlAmount: number;
  pnlPct: number;
  targetPrice5Pct: number;
  buyDate: string;
  buyTime: string;
  isEligibleFor5PctExit: boolean;
}

export interface MicroCustomerTrade {
  id: string;
  customerId: string;
  customerName: string;
  symbol: string;
  stockName: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  investedAmount: number;
  realizedAmount: number;
  profitAmount: number;
  profitPct: number;
  buyTimestamp: string;
  sellTimestamp: string;
  exitReason: string;
}

export interface MicroCustomer {
  id: string;
  name: string;
  avatarColor: string;
  initialCapital: number; // strictly < 100 Rs
  cashBalance: number;    // available liquid cash to buy next morning
  investedValue: number;  // current value of active delivery holdings
  totalNetWorth: number;  // cashBalance + investedValue
  realizedProfit: number; // accumulated profit from >5% sells
  totalTrades: number;
  winningTrades: number;
  activeHoldings: MicroCustomerHolding[];
}

export interface MicroDeliveryAlgoState {
  dayCount: number;
  currentDate: string;
  marketPhase: "PRE_OPEN" | "MARKET_OPEN" | "INTRADAY" | "MARKET_CLOSE";
  targetProfitPct: number; // strictly 5%
  maxCustomerBudget: number; // < 100 Rs
  customers: MicroCustomer[];
  recentTrades: MicroCustomerTrade[];
  stockUniverse: MicroDeliveryStock[];
  totalAlgoCapital: number; // sum of initial capitals (< 1000 Rs)
  totalCurrentValue: number;
  totalRealizedProfit: number;
  totalActivePositions: number;
  autoTickEnabled: boolean;
  lastRunTimestamp: string;
}
