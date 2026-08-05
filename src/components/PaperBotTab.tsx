import React, { useState, useEffect } from "react";
import { PaperBotState } from "../types";
import {
  Bot,
  Play,
  RotateCcw,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Award,
  AlertCircle
} from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface PaperBotTabProps {
  marketStatusText?: string;
  marketOpen?: boolean;
}

export const PaperBotTab: React.FC<PaperBotTabProps> = ({
  marketStatusText,
  marketOpen = false,
}) => {
  const [botState, setBotState] = useState<PaperBotState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [budgetInput, setBudgetInput] = useState<number>(25000);
  const [botEnabled, setBotEnabled] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchBotState = async () => {
    try {
      const res = await fetch("/api/paper-bot/state");
      const data = await res.json();
      if (data.success) {
        setBotState(data.botState);
        setBudgetInput(data.botState.assignedBudget);
        setBotEnabled(data.botState.enabled);
      }
    } catch (err) {
      console.error("Failed to fetch paper bot state", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotState();
    const timer = setInterval(fetchBotState, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateConfig = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/paper-bot/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: budgetInput, enabled: botEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setBotState(data.botState);
        setStatusMsg("Paper Bot budget & status updated!");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update config", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetBot = async () => {
    if (!window.confirm("Are you sure you want to reset the Paper Bot sandbox history and balance?")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/paper-bot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: budgetInput }),
      });
      const data = await res.json();
      if (data.success) {
        setBotState(data.botState);
        setStatusMsg("Paper Bot Sandbox reset to fresh initial budget!");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to reset bot", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualStep = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/paper-bot/step", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBotState(data.botState);
        setStatusMsg("Bot simulation cycle executed!");
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to step bot", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !botState) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
        <Bot className="w-8 h-8 text-indigo-400 animate-bounce" />
        <span>Loading Isolated Model Paper Bot State...</span>
      </div>
    );
  }

  const { dayEndSummary } = botState;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border border-teal-500/30 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Automated Paper Bot Experiment Sandbox
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Isolated — Zero Main Dashboard Impact
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Assigned dedicated budget experiment. Executes automated ML trades when market is live.
              View live positions and end-of-day ROI reports separately.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                marketOpen
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${marketOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {marketStatusText || "Market Closed (09:15-15:30 IST)"}
            </span>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Bot Settings & Budget Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Bot Budget & Controls
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                botState.enabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
              }`}
            >
              {botState.enabled ? "BOT ACTIVE" : "BOT PAUSED"}
            </span>
          </div>

          {/* Active Model Name */}
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Active Trained Model</span>
            <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{botState.modelName}</span>
            </div>
          </div>

          {/* Budget Setting */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Assigned Bot Budget (₹)</span>
              <InfoTooltip title="Isolated Capital" text="Capital strictly reserved for this model paper bot. Will not affect your main trading portfolio balance." />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleUpdateConfig}
                disabled={actionLoading}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shrink-0 transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
            <div className="flex gap-1.5 pt-1">
              {[10000, 25000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setBudgetInput(amt);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    budgetInput === amt
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  ₹{(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 block">Auto-Trading on Market Open</span>
              <span className="text-[10px] text-slate-500">Automatically execute signals during market hours</span>
            </div>
            <input
              type="checkbox"
              checked={botEnabled}
              onChange={(e) => {
                setBotEnabled(e.target.checked);
              }}
              className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleManualStep}
              disabled={actionLoading}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Run Single Bot Simulation Cycle
            </button>

            <button
              onClick={handleResetBot}
              disabled={actionLoading}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Reset Bot Sandbox Balance
            </button>
          </div>
        </div>

        {/* Right Column: End-of-Day Performance Report & Live Sandbox Trades */}
        <div className="lg:col-span-2 space-y-4">
          {/* End-of-Day Performance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Total Portfolio Value</span>
              <div className="text-lg font-bold text-white font-mono">
                ₹{botState.totalPortfolioValue.toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500 block">Budget: ₹{botState.assignedBudget.toLocaleString("en-IN")}</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Net Bot P&L</span>
              <div className={`text-lg font-bold font-mono flex items-center ${botState.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {botState.totalPnl >= 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                {botState.totalPnl >= 0 ? "+" : ""}₹{botState.totalPnl.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 block">ROI: {botState.pnlPct}%</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Day Trade Win Rate</span>
              <div className="text-lg font-bold text-teal-300 font-mono">
                {dayEndSummary.winRate}%
              </div>
              <span className="text-[10px] text-slate-500 block">{dayEndSummary.totalTrades} Executed Trades</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[11px] font-medium text-slate-400">Best Performing Trade</span>
              <div className="text-lg font-bold text-amber-300 font-mono">
                {dayEndSummary.bestTradeSymbol}
              </div>
              <span className="text-[10px] text-emerald-400 font-bold block">
                {dayEndSummary.bestTradePnlPct > 0 ? `+${dayEndSummary.bestTradePnlPct}%` : "No trades yet"}
              </span>
            </div>
          </div>

          {/* Live Open Bot Positions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Live Bot Open Positions ({botState.positions.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Invested Capital: ₹{botState.investedValue.toLocaleString("en-IN")}
              </span>
            </div>

            {botState.positions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/50 rounded-lg border border-slate-800/80">
                No active bot positions currently open. Bot will enter trades automatically when signals trigger.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Entry Price</th>
                      <th className="p-2">Current Price</th>
                      <th className="p-2">Stop Loss / Target</th>
                      <th className="p-2 text-right">Live P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {botState.positions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-slate-800/50">
                        <td className="p-2 font-bold text-white">{pos.symbol}</td>
                        <td className="p-2 font-mono">{pos.qty}</td>
                        <td className="p-2 font-mono">₹{pos.entryPrice}</td>
                        <td className="p-2 font-mono">₹{pos.currentPrice}</td>
                        <td className="p-2 font-mono text-[10px] text-slate-400">
                          ₹{pos.stopLoss} / ₹{pos.takeProfit}
                        </td>
                        <td className={`p-2 text-right font-mono font-bold ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {pos.pnl >= 0 ? "+" : ""}₹{pos.pnl.toFixed(2)} ({pos.pnlPct}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* End-of-Day Executed Trade History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                End-of-Day Executed Trades Log ({botState.trades.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Date: {dayEndSummary.date}
              </span>
            </div>

            {botState.trades.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/50 rounded-lg border border-slate-800/80">
                No completed paper trades executed yet today.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">Time</th>
                      <th className="p-2">Symbol</th>
                      <th className="p-2">Side</th>
                      <th className="p-2">Entry / Exit</th>
                      <th className="p-2">Rationale</th>
                      <th className="p-2 text-right">Realized P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {botState.trades.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-800/50">
                        <td className="p-2 text-slate-400 text-[11px]">{tr.timestamp}</td>
                        <td className="p-2 font-bold text-white">{tr.symbol}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tr.side === "BUY" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                            {tr.side}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[11px]">
                          ₹{tr.entryPrice} → ₹{tr.exitPrice}
                        </td>
                        <td className="p-2 text-slate-400 text-[11px] truncate max-w-xs">{tr.reason}</td>
                        <td className={`p-2 text-right font-mono font-bold ${tr.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {tr.pnl >= 0 ? "+" : ""}₹{tr.pnl.toFixed(2)} ({tr.pnlPct}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
