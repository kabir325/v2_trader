import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Percent,
  Layers,
  Search,
  Activity
} from "lucide-react";
import { PortfolioStats, EquityPoint, WatchlistItem, StockPoint } from "../types";
import { InfoTooltip } from "./InfoTooltip";

interface OverviewTabProps {
  stats: PortfolioStats | null;
  equityCurve: EquityPoint[];
  watchlist: WatchlistItem[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  equityCurve,
  watchlist,
}) => {
  const [selectedStock, setSelectedStock] = useState<string>("RELIANCE");
  const [stockHistory, setStockHistory] = useState<StockPoint[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedStock) return;
    setChartLoading(true);
    fetch(`/api/stocks/${selectedStock}/history`)
      .then((res) => res.json())
      .then((data) => {
        setStockHistory(data);
        setChartLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setChartLoading(false);
      });
  }, [selectedStock]);

  const totalPnl = stats?.totalPnl || 0;
  const isPositive = totalPnl >= 0;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center">
              TOTAL PORTFOLIO VALUE
              <InfoTooltip
                title="Total Portfolio Value"
                text="The total current net worth of your account. It equals your uninvested Cash Balance plus the current live market value of all your active stock holdings."
              />
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{stats?.totalValue.toLocaleString("en-IN") || "1,00,000"}
            </span>
            <span
              className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {stats?.totalPnlPct || 0}%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Initial Capital: ₹{stats?.initialCapital.toLocaleString("en-IN") || "1,00,000"}
          </div>
        </div>

        {/* Total P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center">
              TOTAL P&L (NET PROFIT / LOSS)
              <InfoTooltip
                title="Total Profit & Loss"
                text="Total net money made or lost since starting trading. It is the sum of profits locked in from closed trades (Realized) and live paper profit/loss on active positions (Unrealized)."
              />
            </span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold tracking-tight ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? "+" : ""}₹{totalPnl.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-400">
              Win Rate: <strong className="text-white">{stats?.winRate || 0}%</strong>
            </span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span className="flex items-center">
              Unrealized: ₹{stats?.unrealizedPnl || 0}
              <InfoTooltip
                title="Unrealized P&L"
                text="Live 'paper' profit/loss on open stock holdings. It fluctuates with market prices and becomes Realized only when you sell."
              />
            </span>
            <span className="flex items-center">
              Realized: ₹{stats?.realizedPnl || 0}
              <InfoTooltip
                title="Realized P&L"
                text="Actual net profit or loss permanently locked in after closing/selling stock positions."
              />
            </span>
          </div>
        </div>

        {/* Cash vs Invested */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center">
              CASH & INVESTED CAPITAL
              <InfoTooltip
                title="Cash & Invested Breakdown"
                text="Cash is available uninvested money ready to buy new stocks. Invested is the capital currently locked in active stock purchases."
              />
            </span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{stats?.cashBalance.toLocaleString("en-IN") || "74,820"}
            </span>
            <span className="text-xs text-indigo-400 font-medium flex items-center">
              Invested: ₹{stats?.investedValue.toLocaleString("en-IN") || "24,000"}
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  ((stats?.investedValue || 0) / (stats?.totalValue || 1)) * 100
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Closed Trades / Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center">
              TRADING EXECUTION PERFORMANCE
              <InfoTooltip
                title="Trading Performance"
                text="Tracks total executed orders and Win Rate (% of trades that generated a positive profit vs loss)."
              />
            </span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalTrades || 0} Trades
            </span>
            <span className="text-xs text-amber-400 font-semibold">
              {stats?.winRate}% Win Rate
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Mode: <strong className="text-slate-300">{stats?.mode}</strong> | Closed Positions: {stats?.closedTradesCount || 0}
          </div>
        </div>
      </div>

      {/* 3-Week Reinforcement Learning Progress Tracker Card */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              3-Week Self-Learning Reinforcement Learning (RL) Engine
              <InfoTooltip
                title="3-Week Trial & Error RL Training"
                text="For the first 3 weeks, the RL bot trades autonomously on paper/simulation to learn market patterns and receive profit/loss feedback rewards. At Week 4, it automatically transitions to live trading with full execution power."
              />
            </h3>
            <p className="text-xs text-slate-400">
              The algorithm trades daily, learns from profit/loss reward feedback, decays exploration rate, and converges on high-confidence Q-policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              (stats?.currentWeek || 1) >= 4
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                : "bg-teal-500/20 border-teal-500/40 text-teal-300"
            }`}>
              {(stats?.currentWeek || 1) >= 4 ? "⚡ PHASE 2: LIVE CAPITAL EXECUTION" : `🧠 PHASE 1: PAPER RL TRAINING (WEEK ${stats?.currentWeek || 1}/3)`}
            </span>
          </div>
        </div>

        {/* 3-Week Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Training Roadmap Timeline</span>
            <span className="text-teal-400 font-bold">Week {stats?.currentWeek || 2} of 3 Complete</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className={`p-2.5 rounded-lg border text-xs text-center ${
              (stats?.currentWeek || 2) >= 1 ? "bg-teal-950/60 border-teal-500/50 text-teal-300" : "bg-slate-950 border-slate-800 text-slate-600"
            }`}>
              <span className="font-bold block">Week 1</span>
              <span className="text-[10px] text-slate-400">High Exploration (80%)</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-xs text-center ${
              (stats?.currentWeek || 2) >= 2 ? "bg-teal-950/60 border-teal-500/50 text-teal-300" : "bg-slate-950 border-slate-800 text-slate-600"
            }`}>
              <span className="font-bold block">Week 3</span>
              <span className="text-[10px] text-slate-400">Policy Refining (45%)</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-xs text-center ${
              (stats?.currentWeek || 2) >= 3 ? "bg-teal-950/60 border-teal-500/50 text-teal-300" : "bg-slate-950 border-slate-800 text-slate-600"
            }`}>
              <span className="font-bold block">Week 3</span>
              <span className="text-[10px] text-slate-400">Convergence (20%)</span>
            </div>
            <div className={`p-2.5 rounded-lg border text-xs text-center ${
              (stats?.currentWeek || 2) >= 4 ? "bg-rose-950/60 border-rose-500/50 text-rose-300" : "bg-slate-950 border-slate-800 text-slate-500"
            }`}>
              <span className="font-bold block">Week 4+</span>
              <span className="text-[10px] text-slate-400">Real Money Live Trading</span>
            </div>
          </div>
        </div>

        {/* RL Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Training Episodes</span>
            <span className="text-white font-bold text-sm font-mono">{stats?.rlStats?.episodes || 142} steps</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Exploration Rate</span>
            <span className="text-amber-400 font-bold text-sm font-mono">{((stats?.rlStats?.explorationRate || 0.45) * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Cumulative Reward</span>
            <span className="text-emerald-400 font-bold text-sm font-mono">+{(stats?.rlStats?.totalRewards || 24.8).toFixed(1)} pts</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Policy Convergence</span>
            <span className="text-teal-300 font-bold text-sm font-mono">{stats?.rlStats?.qPolicyConvergence || 84.5}%</span>
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Portfolio Growth & Equity Curve
            </h3>
            <p className="text-xs text-slate-400">
              Daily simulated portfolio valuation tracking against initial ₹1,00,000 capital
            </p>
          </div>
          <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            Live Simulated Valuation
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Portfolio Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#equityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock Technical Analysis & Price Chart Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              NSE Stock Price & SMA Indicator Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Inspect historical candle close and 20-period Moving Average for tracked stocks
            </p>
          </div>

          {/* Stock Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Symbol:</span>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 font-medium"
            >
              {watchlist.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} ({s.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {chartLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            Loading chart data...
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ltp"
                  name="Price (LTP)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#38bdf8" }}
                />
                <Line
                  type="monotone"
                  dataKey="sma"
                  name="20-SMA"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
