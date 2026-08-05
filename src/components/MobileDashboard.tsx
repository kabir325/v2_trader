import React, { useState } from "react";
import {
  PortfolioStats,
  Position,
  TradingSignal,
  WatchlistItem,
  SystemConfig,
  ModelRun
} from "../types";
import {
  TrendingUp,
  RefreshCw,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Shield,
  Monitor,
  Activity,
  Cpu,
  Power
} from "lucide-react";

interface MobileDashboardProps {
  stats: PortfolioStats | null;
  positions: Position[];
  signals: TradingSignal[];
  watchlist: WatchlistItem[];
  mlStatus: any;
  config: SystemConfig | null;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  onRunCycle: () => void;
  onRetrainModel: () => void;
  selectedIndex: string;
  onSelectIndex: (indexId: string) => void;
  loading: boolean;
  onNavigateDesktop: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  stats,
  positions,
  signals,
  watchlist,
  mlStatus,
  config,
  autoCycle,
  onToggleAutoCycle,
  onRunCycle,
  onRetrainModel,
  selectedIndex,
  onSelectIndex,
  loading,
  onNavigateDesktop,
}) => {
  const indexList = [
    { id: "nifty_50", name: "NIFTY 50" },
    { id: "nifty_bank", name: "BANK NIFTY" },
    { id: "sensex", name: "SENSEX" },
    { id: "bse_100", name: "BSE 100" },
    { id: "nifty_it", name: "NIFTY IT" },
    { id: "nifty_fin", name: "FIN SERVICE" },
  ];

  const totalVal = stats?.totalEquity || 10000;
  const totalPnl = stats?.totalPnl || 176.00;
  const totalPnlPct = stats?.totalPnlPct || 1.76;
  const isPositive = totalPnl >= 0;

  const mode = config?.trading.mode || "PAPER";
  const indexName = indexList.find((i) => i.id === selectedIndex)?.name || "NIFTY 50";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-4 space-y-4 max-w-md mx-auto font-sans pb-12">
      {/* Mobile Top Header Bar */}
      <header className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-1.5 rounded-xl text-slate-950 font-black">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight">My Money Maker</h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Mobile
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">NSE Algorithmic Trader</p>
          </div>
        </div>

        <button
          onClick={onNavigateDesktop}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all"
        >
          <Monitor className="w-3.5 h-3.5 text-teal-400" />
          Full Web UI
        </button>
      </header>

      {/* Index Selector Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-sm">
        <div className="text-[10px] font-semibold text-slate-400 px-1 mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-indigo-400" />
          Select Target Index:
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {indexList.map((idx) => {
            const isSelected = selectedIndex === idx.id;
            return (
              <button
                key={idx.id}
                onClick={() => onSelectIndex(idx.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {idx.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Portfolio Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Active Index Portfolio
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mode === "LIVE"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {mode} TRADING
          </span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Total Equity Value</span>
          <div className="text-2xl font-black text-white tracking-tight mt-0.5">
            ₹{totalVal.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-bold flex items-center ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {isPositive ? "+" : ""}₹{totalPnl.toFixed(2)} ({totalPnlPct}%)
            </span>
            <span className="text-[10px] text-slate-500">P&L vs ₹10,000 Base</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Cash Balance</span>
            <span className="text-xs font-bold text-slate-200">
              ₹{(stats?.cashBalance || 8850).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-medium block">Max / Order</span>
            <span className="text-xs font-bold text-slate-200">
              ₹{(config?.trading.max_trade_amount || 1000).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-2.5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Mobile Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRunCycle}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-950/50 transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Run Trade Cycle
          </button>

          <button
            onClick={onRetrainModel}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Retrain Model
          </button>
        </div>

        {/* Auto-Poll Toggle Switch */}
        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Auto-Poll Groww Feed</span>
              <span className="text-[10px] text-slate-400 block">Auto-evaluates every 60s</span>
            </div>
          </div>

          <button
            onClick={onToggleAutoCycle}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              autoCycle ? "bg-teal-500 justify-end" : "bg-slate-700 justify-start"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
          </button>
        </div>
      </div>

      {/* Active Positions Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Active Open Positions ({positions.length})
          </h3>
          <span className="text-[10px] font-bold text-slate-400">{indexName}</span>
        </div>

        {positions.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No active positions for {indexName}. Tap "Run Trade Cycle" above to evaluate.
          </div>
        ) : (
          <div className="space-y-2">
            {positions.map((pos) => {
              const posPnlIsPos = pos.pnl >= 0;
              return (
                <div
                  key={pos.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{pos.symbol}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                        Qty {pos.qty}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Entry: ₹{pos.avgPrice.toFixed(2)} | LTP: ₹{pos.currentPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold flex items-center justify-end ${
                        posPnlIsPos ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {posPnlIsPos ? "+" : ""}₹{pos.pnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({pos.pnlPct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent ML Signals Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-2.5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          Latest Trained Model Signals
        </h3>

        {signals.length === 0 ? (
          <div className="py-4 text-center text-slate-500 text-xs">No signals generated yet.</div>
        ) : (
          <div className="space-y-2">
            {signals.slice(0, 3).map((sig) => (
              <div
                key={sig.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{sig.symbol}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                        sig.signal === "BUY"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : sig.signal === "SELL"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {sig.signal}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                    {sig.reason}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200">
                    {(sig.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Confidence</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-500 pt-2">
        My Money Maker Mobile Dashboard • Groww API Paper Trading
      </div>
    </div>
  );
};
