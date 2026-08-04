import React, { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Plus, Eye, EyeOff, Trash2, Tag, Filter, Search, Zap } from "lucide-react";
import { WatchlistItem, TradingSignal } from "../types";

interface WatchlistTabProps {
  watchlist: WatchlistItem[];
  signals: TradingSignal[];
  onAddStock: (stock: { symbol: string; category: string; priority: number; tags: string; notes: string }) => void;
  onToggleStock: (symbol: string, enabled: boolean) => void;
  onDeleteStock: (symbol: string) => void;
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({
  watchlist,
  signals,
  onAddStock,
  onToggleStock,
  onDeleteStock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [newSymbol, setNewSymbol] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Banking");
  const [newPriority, setNewPriority] = useState<number>(3);
  const [newTags, setNewTags] = useState<string>("largecap");
  const [newNotes, setNewNotes] = useState<string>("");

  const categories = ["ALL", ...Array.from(new Set(watchlist.map((w) => w.category)))];

  const filteredWatchlist = watchlist.filter((w) => {
    const matchesCategory = selectedCategory === "ALL" || w.category === selectedCategory;
    const matchesSearch =
      w.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    onAddStock({
      symbol: newSymbol.trim().toUpperCase(),
      category: newCategory,
      priority: Number(newPriority),
      tags: newTags,
      notes: newNotes,
    });
    setNewSymbol("");
    setShowAddModal(false);
  };

  // Signal distribution data for BarChart
  const buyCount = signals.filter((s) => s.signal === "BUY").length;
  const sellCount = signals.filter((s) => s.signal === "SELL").length;
  const holdCount = signals.filter((s) => s.signal === "HOLD").length;

  const signalChartData = [
    { name: "BUY Signals", count: buyCount, color: "#10b981" },
    { name: "HOLD Signals", count: holdCount, color: "#64748b" },
    { name: "SELL Signals", count: sellCount, color: "#f43f5e" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Search / Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              NSE Watchlist & Polling Configuration ({watchlist.length} Stocks)
            </h3>
            <p className="text-xs text-slate-400">
              Manage tracked stock symbols, polling priorities, and active data streams
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Stock to Watchlist
          </button>
        </div>

        {/* Category Chips & Search Input */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-teal-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search symbol, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-medium uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Status</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Last Price (LTP)</th>
                <th className="py-3 px-4 text-right">Daily Change</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4 text-center rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredWatchlist.map((item) => {
                const isPos = item.change >= 0;
                return (
                  <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleStock(item.symbol, !item.enabled)}
                        className={`p-1 rounded transition-colors ${
                          item.enabled
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                        title={item.enabled ? "Enabled (Click to disable)" : "Disabled (Click to enable)"}
                      >
                        {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.symbol}
                      {item.notes && <p className="text-[10px] text-slate-400 font-normal">{item.notes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-300">
                      P{item.priority}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      ₹{item.ltp.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span className={isPos ? "text-emerald-400" : "text-rose-400"}>
                        {isPos ? "+" : ""}{item.change.toFixed(2)} ({item.changePct}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {(item.volume / 100000).toFixed(2)} L
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.tags}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteStock(item.symbol)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signals Feed & Signal Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Stream Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Latest Generated Algorithmic Signals
              </h3>
              <p className="text-xs text-slate-400">
                Real-time signals evaluated by Baseline SMA / ML Predictor engine
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {signals.map((sig) => {
              const isBuy = sig.signal === "BUY";
              const isSell = sig.signal === "SELL";
              return (
                <div
                  key={sig.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded font-black text-xs ${
                        isBuy
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                          : isSell
                          ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {sig.signal}
                    </span>
                    <div>
                      <span className="font-bold text-white text-sm mr-2">{sig.symbol}</span>
                      <span className="text-slate-400">@ ₹{sig.price.toFixed(2)}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{sig.reason}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-amber-400 font-semibold block text-[11px]">
                      {(sig.confidence * 100).toFixed(0)}% Confidence
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(sig.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signal Distribution Histogram Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-white mb-2">Signal Type Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Frequency of BUY, SELL, and HOLD signals</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signalChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {signalChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Stock to Watchlist</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">NSE Symbol (e.g. AXISBANK)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AXISBANK"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                  >
                    <option value="Banking">Banking</option>
                    <option value="IT">IT</option>
                    <option value="Energy">Energy</option>
                    <option value="Auto">Auto</option>
                    <option value="FMCG">FMCG</option>
                    <option value="Pharma">Pharma</option>
                    <option value="Infra">Infra</option>
                    <option value="Telecom">Telecom</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Priority (1 highest, 10 lowest)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. largecap, private, banking"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Axis Bank private sector banking leader"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Add Symbol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
