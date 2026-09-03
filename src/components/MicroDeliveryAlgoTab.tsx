import React, { useState, useEffect } from "react";
import {
  Users,
  Play,
  RefreshCw,
  FastForward,
  RotateCcw,
  TrendingUp,
  Target,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Briefcase,
  AlertCircle,
  Search,
  Zap,
  ArrowUpRight
} from "lucide-react";
import {
  MicroDeliveryAlgoState,
  MicroCustomer,
  MicroCustomerHolding,
  MicroCustomerTrade,
  MicroDeliveryStock
} from "../types";

export const MicroDeliveryAlgoTab: React.FC = () => {
  const [algoState, setAlgoState] = useState<MicroDeliveryAlgoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [activeSubView, setActiveSubView] = useState<"customers" | "positions" | "trades" | "universe">("customers");
  const [stockSearch, setStockSearch] = useState("");
  const [surgeMode, setSurgeMode] = useState(false);

  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/micro-algo/state");
      if (!res.ok) throw new Error("Failed to load micro delivery algo state");
      const data = await res.json();
      setAlgoState(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch algo state");
    } finally {
      setLoading(false);
    }
  };

  // 1. Run Morning Market Open Cycle
  const handleRunMorningOpen = async () => {
    try {
      setExecuting(true);
      const res = await fetch("/api/micro-algo/morning-open", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAlgoState(data.state);
        setActionLog(`🌅 Morning Market Open Executed: ${data.result.buysExecuted} random delivery buy orders placed for active customers!`);
        setTimeout(() => setActionLog(null), 6000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute morning market open");
    } finally {
      setExecuting(false);
    }
  };

  // 2. Tick Market Prices & Check 5% Profit Exit Rule
  const handleTickPrices = async () => {
    try {
      setExecuting(true);
      const res = await fetch("/api/micro-algo/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volatility: surgeMode ? 2.5 : 1.0 })
      });
      const data = await res.json();
      if (data.success) {
        setAlgoState(data.state);
        if (data.tickResult.sellsTriggered > 0) {
          setActionLog(`🎯 Target Reached (> 5% profit)! Automatically executed ${data.tickResult.sellsTriggered} delivery SELL order(s) to lock in profit!`);
        } else {
          setActionLog(`⚡ Market ticked. Evaluated positions for > 5% profit exit.`);
        }
        setTimeout(() => setActionLog(null), 5000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  // 3. Advance to Next Day Morning
  const handleAdvanceDay = async () => {
    try {
      setExecuting(true);
      const res = await fetch("/api/micro-algo/advance-day", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAlgoState(data.state);
        setActionLog(`⏭️ Advanced to Day ${data.advanceResult.dayCount} Morning! Executed ${data.advanceResult.buysExecuted} new random delivery buys.`);
        setTimeout(() => setActionLog(null), 6000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  // 4. Reset Algorithm
  const handleReset = async () => {
    if (!confirm("Reset algorithm back to fresh 10 customers with initial < ₹100 capital?")) return;
    try {
      setExecuting(true);
      const res = await fetch("/api/micro-algo/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAlgoState(data.state);
        setActionLog("🔄 Algorithm reset to initial 10-customer state (Total capital: ₹946 < ₹1000).");
        setTimeout(() => setActionLog(null), 4000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  if (loading && !algoState) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Initializing 10-Customer Micro-Delivery Algorithm...</p>
      </div>
    );
  }

  const customers = algoState?.customers || [];
  const recentTrades = algoState?.recentTrades || [];
  const stockUniverse = algoState?.stockUniverse || [];

  // Filter stocks by search
  const filteredStocks = stockUniverse.filter(
    (s) => s.symbol.toLowerCase().includes(stockSearch.toLowerCase()) || s.name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  // Flatten all active holdings across customers
  const allActiveHoldings: Array<{ customerName: string; holding: MicroCustomerHolding; color: string }> = [];
  customers.forEach((c) => {
    c.activeHoldings.forEach((h) => {
      allActiveHoldings.push({ customerName: c.name, holding: h, color: c.avatarColor });
    });
  });

  return (
    <div className="space-y-6">
      {/* Action log banner */}
      {actionLog && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-xl text-indigo-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium">{actionLog}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Hero Header & Rule Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              10-Customer Micro-Delivery Algorithm (&lt; ₹100/cust, Total &lt; ₹1000)
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Automated Micro-Delivery Algo Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manages <strong>10 customer wallets</strong> with each having <strong>&lt; ₹100</strong> (totaling ₹{algoState?.totalAlgoCapital || 946} &lt; ₹1000). Every morning at market open, it selects random stocks from a <strong>60+ stock universe</strong> and buys in <strong>Delivery (CNC)</strong>. If profit exceeds <strong className="text-emerald-400 font-bold">&gt; 5.0%</strong> at any point, it automatically sells to lock in profit!
            </p>
          </div>

          {/* Sizing & Exit Rules Pill Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Target className="w-4 h-4 text-indigo-400" />
              <span>Sizing & Exit Rules:</span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 font-mono">
              <div>• Sizing: <span className="text-white">If stock is ₹20 → buys 5 stocks (= ₹100 worth)</span></div>
              <div>• Buy Mode: <span className="text-white">Delivery (CNC, 100% Cash)</span></div>
              <div>• Sell Exit: <span className="text-emerald-400 font-bold">Target &gt; 5.0% Profit (Automated Sell)</span></div>
            </div>
          </div>
        </div>

        {/* Algorithm Control Action Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunMorningOpen}
              disabled={executing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Pick random stocks for each customer with cash and buy in delivery"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Morning Market Open</span>
            </button>

            <button
              onClick={handleTickPrices}
              disabled={executing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Simulate price movements and automatically sell any holding that reaches >5% profit"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-200" />
              <span>Tick Prices & Check 5% Exit</span>
            </button>

            <button
              onClick={handleAdvanceDay}
              disabled={executing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Advance to next trading day morning and trigger next morning buy cycle"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Advance to Next Day Morning</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={surgeMode}
                onChange={(e) => setSurgeMode(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px]">Volatility Surge (Faster 5% Hits)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Day <strong className="text-white">{algoState?.dayCount}</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">{algoState?.currentDate}</span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Reset algo to fresh initial capital"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Algo Capital (< 1000 Rs) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Initial Capital (10 Cust.)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{(algoState?.totalAlgoCapital || 946).toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 font-semibold">
            ✓ Strictly &lt; ₹1,000 Total (All &lt; ₹100 each)
          </p>
        </div>

        {/* Current Total Net Worth */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Net Worth</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{(algoState?.totalCurrentValue || 0).toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Cash + Active Delivery Holdings
          </p>
        </div>

        {/* Realized Profit (from > 5% sells) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Realized 5% Profits</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            +₹{(algoState?.totalRealizedProfit || 0).toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-300 font-semibold">
            Locked in from {recentTrades.length} successful exit(s)
          </p>
        </div>

        {/* Active Delivery Positions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Delivery Positions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {algoState?.totalActivePositions || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Across {customers.length} customers • Target &gt; +5%
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView("customers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === "customers"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            👥 10 Customers Wallets ({customers.length})
          </button>

          <button
            onClick={() => setActiveSubView("positions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === "positions"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            📦 Active Delivery Positions ({allActiveHoldings.length})
          </button>

          <button
            onClick={() => setActiveSubView("trades")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === "trades"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            🎯 5% Profit Exit Audit Log ({recentTrades.length})
          </button>

          <button
            onClick={() => setActiveSubView("universe")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubView === "universe"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            🌐 Big Stock Universe ({stockUniverse.length} Stocks)
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: 10 CUSTOMERS BENTO GRID */}
      {activeSubView === "customers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              10 Individual Customers Portfolios (Each Initial Capital &lt; ₹100)
            </h3>
            <span className="text-xs text-slate-400">
              Random delivery stock buy every morning • Sells at &gt; 5% profit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {customers.map((cust) => {
              const roiPct = cust.initialCapital > 0
                ? Math.round(((cust.totalNetWorth - cust.initialCapital) / cust.initialCapital) * 10000) / 100
                : 0;

              return (
                <div
                  key={cust.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 relative hover:border-slate-700 transition-all shadow-sm"
                >
                  {/* Top Customer Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: cust.avatarColor }}
                      >
                        {cust.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs leading-tight">{cust.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Init: ₹{cust.initialCapital}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      roiPct >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {roiPct >= 0 ? "+" : ""}{roiPct}%
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-1.5 text-[11px] font-mono border-t border-slate-800/80 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Net Worth:</span>
                      <span className="font-bold text-white">₹{cust.totalNetWorth.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Liquid Cash:</span>
                      <span className="text-indigo-300">₹{cust.cashBalance.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Invested (CNC):</span>
                      <span className="text-teal-300">₹{cust.investedValue.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Realized Gain:</span>
                      <span className="text-emerald-400 font-semibold">+₹{cust.realizedProfit.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Active Holdings Badge / Summary */}
                  <div className="border-t border-slate-800/80 pt-2 text-[10px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400">Holdings:</span>
                      <span className="text-white font-semibold">{cust.activeHoldings.length} stock(s)</span>
                    </div>

                    {cust.activeHoldings.length > 0 ? (
                      <div className="space-y-1">
                        {cust.activeHoldings.map((h) => (
                          <div
                            key={h.id}
                            className={`p-1.5 rounded text-[10px] flex items-center justify-between font-mono ${
                              h.pnlPct >= 5.0
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                                : "bg-slate-950 border border-slate-800/80 text-slate-300"
                            }`}
                          >
                            <span className="font-bold">{h.symbol} ({h.quantity})</span>
                            <span className={h.pnlPct >= 0 ? "text-emerald-400 font-bold" : "text-rose-400"}>
                              {h.pnlPct >= 0 ? "+" : ""}{h.pnlPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">
                        Ready for next morning buy cycle
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ACTIVE DELIVERY POSITIONS */}
      {activeSubView === "positions" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Active Delivery (CNC) Holdings Across All Customers ({allActiveHoldings.length})
              </h3>
              <p className="text-xs text-slate-400">
                Purchased at market open. Target exit rule: Automatically sells when profit &gt; +5.0%
              </p>
            </div>

            <button
              onClick={handleTickPrices}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tick Prices & Check Exits</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Stock Symbol</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Buy Price</th>
                  <th className="py-3 px-3">Current LTP</th>
                  <th className="py-3 px-3">Target Price (+5%)</th>
                  <th className="py-3 px-3">Invested ₹</th>
                  <th className="py-3 px-3">Current ₹</th>
                  <th className="py-3 px-3">P&L (%)</th>
                  <th className="py-3 px-3">Exit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {allActiveHoldings.length > 0 ? (
                  allActiveHoldings.map(({ customerName, holding, color }) => (
                    <tr key={holding.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 whitespace-nowrap font-sans flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                        <span className="font-semibold text-white">{customerName}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-white">{holding.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{holding.stockName}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">{holding.quantity}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{holding.buyPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{holding.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-emerald-400 font-semibold">₹{holding.targetPrice5Pct.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{holding.investedAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{holding.currentValue.toFixed(2)}</td>
                      <td className={`py-3 px-3 whitespace-nowrap font-bold ${holding.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {holding.pnlPct >= 0 ? "+" : ""}{holding.pnlPct}%
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-sans">
                        {holding.pnlPct >= 5.0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                            🎯 TARGET REACHED (&gt;5%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                            Holding (Needs {(5.0 - holding.pnlPct).toFixed(1)}% more)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                      No active delivery positions. Click "Run Morning Market Open" to purchase stocks for active customers!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: 5% PROFIT TRADES AUDIT LOG */}
      {activeSubView === "trades" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Realized 5% Profit Exit Trade Log ({recentTrades.length})
              </h3>
              <p className="text-xs text-slate-400">
                Every trade executed automatically when profit exceeded 5% of invested delivery amount
              </p>
            </div>
            <div className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
              Total Profit: +₹{(algoState?.totalRealizedProfit || 0).toFixed(2)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Buy Price</th>
                  <th className="py-3 px-3">Exit Price</th>
                  <th className="py-3 px-3">Invested ₹</th>
                  <th className="py-3 px-3">Realized ₹</th>
                  <th className="py-3 px-3">Profit (₹)</th>
                  <th className="py-3 px-3">Profit (%)</th>
                  <th className="py-3 px-3">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {recentTrades.length > 0 ? (
                  recentTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 whitespace-nowrap font-sans font-bold text-white">
                        {trade.customerName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-white">{trade.symbol}</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">{trade.quantity}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{trade.buyPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-emerald-400 font-bold">₹{trade.sellPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">₹{trade.investedAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{trade.realizedAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 whitespace-nowrap text-emerald-400 font-bold">
                        +₹{trade.profitAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          +{trade.profitPct}%
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-sans text-slate-400">
                        {trade.exitReason}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                      No realized profit exits yet. Run morning open and click "Tick Prices" to simulate market price movements!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: BIG STOCK UNIVERSE EXPLORER */}
      {activeSubView === "universe" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                Big Stock Universe ({stockUniverse.length} Real Indian Stocks under ₹100)
              </h3>
              <p className="text-xs text-slate-400">
                Random selection pool for morning market open delivery buy orders
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search stock by symbol or name..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-white text-xs font-mono">{stock.symbol}</span>
                    <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{stock.name}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {stock.sector}
                  </span>
                </div>

                <div className="flex items-end justify-between border-t border-slate-800/60 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">LTP</span>
                    <span className="text-sm font-bold text-white font-mono">₹{stock.currentPrice.toFixed(2)}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Day Change</span>
                    <span className={`text-xs font-mono font-semibold ${stock.dayChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {stock.dayChangePct >= 0 ? "+" : ""}{stock.dayChangePct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
