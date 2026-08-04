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
  lastCycleAt?: string;
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
  };
  ml: {
    forward_return_minutes: number;
    min_confidence: number;
    retrain_on_sunday: boolean;
  };
}
