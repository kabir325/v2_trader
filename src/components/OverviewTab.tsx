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
            <span>TOTAL PORTFOLIO VALUE</span>
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
            <span>TOTAL P&L (UNREALIZED + REALIZED)</span>
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
            <span>Unrealized: ₹{stats?.unrealizedPnl || 0}</span>
            <span>Realized: ₹{stats?.realizedPnl || 0}</span>
          </div>
        </div>

        {/* Cash vs Invested */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>CASH & INVESTED CAPITAL</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{stats?.cashBalance.toLocaleString("en-IN") || "74,820"}
            </span>
            <span className="text-xs text-indigo-400 font-medium">
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
            <span>TRADING EXECUTION PERFORMANCE</span>
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
