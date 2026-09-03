import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Briefcase,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import {
  InvestmentPortfolioData,
  StockInvestment,
  SipInvestment,
  AccountingSnapshot
} from "../types";

export const InvestmentDashboard: React.FC = () => {
  const [portfolio, setPortfolio] = useState<InvestmentPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "stocks" | "sip" | "accounting">("overview");

  // Modal / Form States
  const [showStockModal, setShowStockModal] = useState(false);
  const [showSipModal, setShowSipModal] = useState(false);

  // New Stock Form
  const [newStockSymbol, setNewStockSymbol] = useState("");
  const [newStockName, setNewStockName] = useState("");
  const [newStockQty, setNewStockQty] = useState("");
  const [newStockBuyPrice, setNewStockBuyPrice] = useState("");
  const [newStockCurrentPrice, setNewStockCurrentPrice] = useState("");
  const [newStockSector, setNewStockSector] = useState("Information Technology");

  // New SIP Form
  const [newSipFundName, setNewSipFundName] = useState("");
  const [newSipCategory, setNewSipCategory] = useState<"Flexi Cap" | "Large Cap" | "Index Fund" | "Equity">("Flexi Cap");
  const [newSipFrequency, setNewSipFrequency] = useState<"Monthly" | "Weekly">("Monthly");
  const [newSipAmount, setNewSipAmount] = useState("");
  const [newSipInstallments, setNewSipInstallments] = useState("");
  const [newSipNav, setNewSipNav] = useState("");

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/investments");
      if (!res.ok) throw new Error("Failed to load investment portfolio data");
      const data = await res.json();
      setPortfolio(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  };

  const recordAccounting = async (sessionType: "MARKET_OPEN" | "MARKET_CLOSE") => {
    try {
      const res = await fetch("/api/investments/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          notes: sessionType === "MARKET_OPEN"
            ? "Market opening accounting logged at 09:15 AM."
            : "Market close / End-of-Day accounting logged at 03:30 PM."
        })
      });
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setActionSuccess(
          sessionType === "MARKET_OPEN"
            ? "Market Opening Accounting recorded and stored successfully!"
            : "End of Day (03:30 PM) Accounting recorded and stored successfully!"
        );
        setTimeout(() => setActionSuccess(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to record accounting snapshot");
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockSymbol || !newStockName || !newStockQty || !newStockBuyPrice) return;
    try {
      const res = await fetch("/api/investments/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: newStockSymbol,
          name: newStockName,
          quantity: Number(newStockQty),
          buyPrice: Number(newStockBuyPrice),
          currentPrice: Number(newStockCurrentPrice || newStockBuyPrice),
          sector: newStockSector
        })
      });
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setShowStockModal(false);
        setNewStockSymbol("");
        setNewStockName("");
        setNewStockQty("");
        setNewStockBuyPrice("");
        setNewStockCurrentPrice("");
        setActionSuccess(`Added stock ${newStockSymbol.toUpperCase()} to portfolio!`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
    }
  };

  const handleDeleteStock = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your portfolio?`)) return;
    try {
      const res = await fetch(`/api/investments/stock/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setActionSuccess(`Removed ${name} from portfolio`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete stock");
    }
  };

  const handleAddSip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSipFundName || !newSipAmount) return;
    try {
      const installments = Number(newSipInstallments || 1);
      const nav = Number(newSipNav || 100);
      const totalAmount = Number(newSipAmount) * installments;
      const units = totalAmount / nav;

      const res = await fetch("/api/investments/add-sip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName: newSipFundName,
          category: newSipCategory,
          frequency: newSipFrequency,
          installmentAmount: Number(newSipAmount),
          totalInstallments: installments,
          units,
          avgNav: nav,
          currentNav: nav
        })
      });
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setShowSipModal(false);
        setNewSipFundName("");
        setNewSipAmount("");
        setNewSipInstallments("");
        setNewSipNav("");
        setActionSuccess(`Added SIP ${newSipFundName} to portfolio!`);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to add SIP");
    }
  };

  const handleDeleteSip = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove SIP: ${name}?`)) return;
    try {
      const res = await fetch(`/api/investments/sip/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPortfolio(data.portfolio);
        setActionSuccess(`Removed ${name} from SIP investments`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete SIP");
    }
  };

  const handleTickPrices = async () => {
    try {
      const res = await fetch("/api/investments/tick", { method: "POST" });
      const data = await res.json();
      setPortfolio(data);
      setActionSuccess("Market prices updated!");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Loading Investment Portfolio & Accounting Records...</p>
      </div>
    );
  }

  const summary = portfolio?.summary || {
    totalInvested: 0,
    totalCurrentValue: 0,
    totalPnl: 0,
    totalPnlPct: 0,
    dayChangeAmount: 0,
    dayChangePct: 0,
    stocksInvested: 0,
    stocksValue: 0,
    sipInvested: 0,
    sipValue: 0,
    lastAccountingSession: "NONE",
    lastAccountingTimestamp: "None"
  };

  const allocationData = [
    { name: "Direct Stocks", value: summary.stocksValue, color: "#4f46e5" },
    { name: "Mutual Fund SIPs", value: summary.sipValue, color: "#06b6d4" }
  ];

  // Chart data for historical accounting snapshots
  const chartData = (portfolio?.accountingHistory || []).map((snap) => ({
    label: `${snap.date.slice(5)} ${snap.sessionType === "MARKET_OPEN" ? "Open" : "EOD"}`,
    invested: snap.totalInvested,
    value: snap.totalCurrentValue,
    pnl: snap.totalPnl
  }));

  return (
    <div className="space-y-6">
      {/* Alert / Notification banners */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Top Header: Personal Investments & Market Accounting */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              Personal Portfolio Tracker & Accounting Engine
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              My Stocks & SIP Investment Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Daily portfolio tracking with automated accounting snapshots at <strong className="text-indigo-300">Market Opening (09:15 AM)</strong> and <strong className="text-teal-300">End of Day (03:30 PM)</strong>.
            </p>
          </div>

          {/* Quick Accounting Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => recordAccounting("MARKET_OPEN")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              title="Record baseline portfolio accounting when market opens at 9:15 AM"
            >
              <Clock className="w-4 h-4 text-indigo-200" />
              <span>Record Market Open (09:15 AM)</span>
            </button>

            <button
              onClick={() => recordAccounting("MARKET_CLOSE")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
              title="Record final portfolio accounting when market closes at 03:30 PM"
            >
              <Calendar className="w-4 h-4 text-teal-200" />
              <span>Record End of Day (03:30 PM)</span>
            </button>

            <button
              onClick={handleTickPrices}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              title="Simulate live market movement on holdings"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Live Tick</span>
            </button>
          </div>
        </div>

        {/* Last Accounting Status Info Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Accounting Status:</span>
            <span className="font-semibold text-white">
              {summary.lastAccountingSession === "MARKET_OPEN" && "🌅 Market Opening Snapshot Recorded"}
              {summary.lastAccountingSession === "MARKET_CLOSE" && "🌇 End of Day (03:30 PM) Snapshot Stored"}
              {summary.lastAccountingSession === "NONE" && "No snapshots recorded yet"}
            </span>
            <span className="text-slate-500 font-mono">({summary.lastAccountingTimestamp})</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Total Accounted History: <strong className="text-slate-200">{portfolio?.accountingHistory.length || 0} snapshots</strong></span>
            <span>Active Stocks: <strong className="text-indigo-400">{portfolio?.stocks.length || 0}</strong></span>
            <span>Active SIPs: <strong className="text-teal-400">{portfolio?.sips.length || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* 4 Primary Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Invested</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{summary.totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Stocks: ₹{summary.stocksInvested.toLocaleString("en-IN")}</span>
            <span>SIP: ₹{summary.sipInvested.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Current Portfolio Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Net Worth</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{summary.totalCurrentValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Stocks: ₹{summary.stocksValue.toLocaleString("en-IN")}</span>
            <span>SIP: ₹{summary.sipValue.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Overall Profit & Loss */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Return / P&L</span>
            <div className={`w-8 h-8 rounded-lg ${summary.totalPnl >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"} flex items-center justify-center`}>
              {summary.totalPnl >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${summary.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {summary.totalPnl >= 0 ? "+" : ""}₹{summary.totalPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-semibold ${summary.totalPnl >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
              {summary.totalPnlPct >= 0 ? "+" : ""}{summary.totalPnlPct}% Total ROI
            </span>
            <span className="text-slate-400">across all holdings</span>
          </div>
        </div>

        {/* Today's Day Change */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Day Change</span>
            <div className={`w-8 h-8 rounded-lg ${summary.dayChangeAmount >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"} flex items-center justify-center`}>
              {summary.dayChangeAmount >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${summary.dayChangeAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {summary.dayChangeAmount >= 0 ? "+" : ""}₹{summary.dayChangeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`px-1.5 py-0.5 rounded font-semibold ${summary.dayChangePct >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
              {summary.dayChangePct >= 0 ? "+" : ""}{summary.dayChangePct}% vs Last Snapshot
            </span>
            <span className="text-slate-400">Day P&L</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            📊 Portfolio Overview & Charts
          </button>

          <button
            onClick={() => setActiveTab("stocks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "stocks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            📈 Direct Stocks ({portfolio?.stocks.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("sip")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "sip"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            🌱 Mutual Fund SIPs ({portfolio?.sips.length || 0})
          </button>

          <button
            onClick={() => setActiveTab("accounting")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "accounting"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            🕒 Daily Accounting History ({portfolio?.accountingHistory.length || 0})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "stocks" && (
            <button
              onClick={() => setShowStockModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock</span>
            </button>
          )}

          {activeTab === "sip" && (
            <button
              onClick={() => setShowSipModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SIP</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Charts Row: Historical Growth + Asset Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Historical Growth Chart */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Market Open & EOD Accounting History Curve
                  </h3>
                  <p className="text-xs text-slate-400">Day-over-day tracking of Total Value vs Invested Capital</p>
                </div>
                <span className="text-[11px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono">
                  Daily Stored Snapshots
                </span>
              </div>

              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} name="Total Portfolio Value" dot={{ fill: "#06b6d4", r: 4 }} />
                      <Line type="monotone" dataKey="invested" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" name="Invested Capital" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Record your first Market Open or EOD snapshot to see the growth curve!
                  </div>
                )}
              </div>
            </div>

            {/* Asset Allocation Donut */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-teal-400" />
                  Asset Allocation
                </h3>
                <p className="text-xs text-slate-400">Distribution between Direct Stocks and Mutual Funds</p>
              </div>

              <div className="h-44 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-300">Direct Stocks</span>
                  </div>
                  <span className="font-semibold text-white">
                    {summary.totalCurrentValue > 0 ? Math.round((summary.stocksValue / summary.totalCurrentValue) * 100) : 0}%
                    <span className="text-slate-400 font-normal ml-1">(₹{summary.stocksValue.toLocaleString("en-IN")})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span className="text-slate-300">Mutual Fund SIPs</span>
                  </div>
                  <span className="font-semibold text-white">
                    {summary.totalCurrentValue > 0 ? Math.round((summary.sipValue / summary.totalCurrentValue) * 100) : 0}%
                    <span className="text-slate-400 font-normal ml-1">(₹{summary.sipValue.toLocaleString("en-IN")})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Snapshot Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Latest Stored Accounting Snapshots
              </h3>
              <button
                onClick={() => setActiveTab("accounting")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View Full Audit Log →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3">Invested</th>
                    <th className="py-2.5 px-3">Net Worth</th>
                    <th className="py-2.5 px-3">Day Change</th>
                    <th className="py-2.5 px-3">Total P&L</th>
                    <th className="py-2.5 px-3">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {(portfolio?.accountingHistory || []).slice(-4).reverse().map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 whitespace-nowrap text-white">
                        {snap.date} <span className="text-slate-500">{snap.time}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          snap.sessionType === "MARKET_OPEN"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        }`}>
                          {snap.sessionType === "MARKET_OPEN" ? "🌅 Market Open (09:15)" : "🌇 End of Day (15:30)"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">₹{snap.totalInvested.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-white">₹{snap.totalCurrentValue.toLocaleString("en-IN")}</td>
                      <td className={`py-2.5 px-3 whitespace-nowrap ${snap.dayChangeAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {snap.dayChangeAmount >= 0 ? "+" : ""}₹{snap.dayChangeAmount.toLocaleString("en-IN")} ({snap.dayChangePct}%)
                      </td>
                      <td className={`py-2.5 px-3 whitespace-nowrap font-bold ${snap.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {snap.totalPnl >= 0 ? "+" : ""}₹{snap.totalPnl.toLocaleString("en-IN")} ({snap.totalPnlPct}%)
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-xs">{snap.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DIRECT STOCKS */}
      {activeTab === "stocks" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Direct Stock Holdings ({portfolio?.stocks.length || 0})
              </h3>
              <p className="text-xs text-slate-400">Equity delivery holdings purchased through broker</p>
            </div>
            <button
              onClick={() => setShowStockModal(true)}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Investment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Stock & Sector</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Buy Price</th>
                  <th className="py-3 px-3">Current LTP</th>
                  <th className="py-3 px-3">Invested</th>
                  <th className="py-3 px-3">Current Value</th>
                  <th className="py-3 px-3">Unrealized P&L</th>
                  <th className="py-3 px-3">Day Change</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {(portfolio?.stocks || []).map((stk) => (
                  <tr key={stk.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      <div className="font-bold text-white text-xs">{stk.symbol}</div>
                      <div className="text-[10px] text-slate-400">{stk.name} • <span className="text-indigo-400">{stk.sector}</span></div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{stk.quantity}</td>
                    <td className="py-3 px-3 whitespace-nowrap">₹{stk.buyPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{stk.currentPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">₹{stk.investedAmount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{stk.currentValue.toLocaleString("en-IN")}</td>
                    <td className={`py-3 px-3 whitespace-nowrap font-bold ${stk.unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {stk.unrealizedPnl >= 0 ? "+" : ""}₹{stk.unrealizedPnl.toLocaleString("en-IN")} ({stk.unrealizedPnlPct}%)
                    </td>
                    <td className={`py-3 px-3 whitespace-nowrap ${stk.dayChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {stk.dayChangePct >= 0 ? "+" : ""}{stk.dayChangePct}%
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteStock(stk.id, stk.symbol)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove stock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MUTUAL FUND SIPS */}
      {activeTab === "sip" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-teal-400" />
                Mutual Fund Systematic Investment Plans (SIP)
              </h3>
              <p className="text-xs text-slate-400">Regular automated wealth compounding investments</p>
            </div>
            <button
              onClick={() => setShowSipModal(true)}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New SIP</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Fund Name & Category</th>
                  <th className="py-3 px-3">SIP Frequency</th>
                  <th className="py-3 px-3">Installment</th>
                  <th className="py-3 px-3">Installments Paid</th>
                  <th className="py-3 px-3">Total Invested</th>
                  <th className="py-3 px-3">Units</th>
                  <th className="py-3 px-3">Current NAV</th>
                  <th className="py-3 px-3">Current Value</th>
                  <th className="py-3 px-3">Total Return</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {(portfolio?.sips || []).map((sip) => (
                  <tr key={sip.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      <div className="font-bold text-white text-xs">{sip.fundName}</div>
                      <div className="text-[10px] text-slate-400">Category: <span className="text-teal-400">{sip.category}</span> • Status: <span className="text-emerald-400 font-bold">{sip.status}</span></div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">{sip.frequency}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{sip.installmentAmount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{sip.totalInstallments} installments</td>
                    <td className="py-3 px-3 whitespace-nowrap">₹{sip.investedAmount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{sip.units.toFixed(2)}</td>
                    <td className="py-3 px-3 whitespace-nowrap">₹{sip.currentNav.toFixed(2)}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{sip.currentValue.toLocaleString("en-IN")}</td>
                    <td className={`py-3 px-3 whitespace-nowrap font-bold ${sip.unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {sip.unrealizedPnl >= 0 ? "+" : ""}₹{sip.unrealizedPnl.toLocaleString("en-IN")} ({sip.unrealizedPnlPct}%)
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteSip(sip.id, sip.fundName)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove SIP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DAILY ACCOUNTING HISTORY */}
      {activeTab === "accounting" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Permanent Daily Accounting Audit Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Immutable daily snapshots stored at Market Open (09:15 AM) and End of Day (03:30 PM)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => recordAccounting("MARKET_OPEN")}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                + Record Market Open
              </button>
              <button
                onClick={() => recordAccounting("MARKET_CLOSE")}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
              >
                + Record End of Day
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3">Snapshot Date</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Session Type</th>
                  <th className="py-3 px-3">Stocks Invested</th>
                  <th className="py-3 px-3">SIP Invested</th>
                  <th className="py-3 px-3">Total Invested</th>
                  <th className="py-3 px-3">Current Net Worth</th>
                  <th className="py-3 px-3">Day Change</th>
                  <th className="py-3 px-3">Total P&L</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {(portfolio?.accountingHistory || []).slice().reverse().map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 whitespace-nowrap text-white font-bold">{snap.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">{snap.time}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-sans">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        snap.sessionType === "MARKET_OPEN"
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      }`}>
                        {snap.sessionType === "MARKET_OPEN" ? "🌅 Market Open" : "🌇 End of Day"}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">₹{snap.stocksInvested.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 whitespace-nowrap">₹{snap.sipInvested.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{snap.totalInvested.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-white">₹{snap.totalCurrentValue.toLocaleString("en-IN")}</td>
                    <td className={`py-3 px-3 whitespace-nowrap font-bold ${snap.dayChangeAmount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {snap.dayChangeAmount >= 0 ? "+" : ""}₹{snap.dayChangeAmount.toLocaleString("en-IN")} ({snap.dayChangePct}%)
                    </td>
                    <td className={`py-3 px-3 whitespace-nowrap font-bold ${snap.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {snap.totalPnl >= 0 ? "+" : ""}₹{snap.totalPnl.toLocaleString("en-IN")} ({snap.totalPnlPct}%)
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400 max-w-sm">{snap.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOCK INVESTMENT */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Add Stock Investment
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Stock Ticker Symbol (e.g. RELIANCE, TCS)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN"
                  value={newStockSymbol}
                  onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India"
                  value={newStockName}
                  onChange={(e) => setNewStockName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Avg Buy Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="e.g. 780.50"
                    value={newStockBuyPrice}
                    onChange={(e) => setNewStockBuyPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Current LTP (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="Optional (defaults to buy price)"
                    value={newStockCurrentPrice}
                    onChange={(e) => setNewStockCurrentPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sector</label>
                  <input
                    type="text"
                    value={newStockSector}
                    onChange={(e) => setNewStockSector(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Save Stock Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SIP INVESTMENT */}
      {showSipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-teal-400" />
                Add Mutual Fund SIP Investment
              </h3>
              <button onClick={() => setShowSipModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSip} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Fund Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Top 100 Fund - Direct Growth"
                  value={newSipFundName}
                  onChange={(e) => setNewSipFundName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newSipCategory}
                    onChange={(e: any) => setNewSipCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Flexi Cap">Flexi Cap</option>
                    <option value="Large Cap">Large Cap</option>
                    <option value="Index Fund">Index Fund</option>
                    <option value="Equity">Equity Small/Mid Cap</option>
                    <option value="Debt">Debt</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Frequency</label>
                  <select
                    value={newSipFrequency}
                    onChange={(e: any) => setNewSipFrequency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Installment Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={newSipAmount}
                    onChange={(e) => setNewSipAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Total Installments</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={newSipInstallments}
                    onChange={(e) => setNewSipInstallments(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Current NAV (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 125.40"
                  value={newSipNav}
                  onChange={(e) => setNewSipNav(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSipModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer"
                >
                  Save SIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
