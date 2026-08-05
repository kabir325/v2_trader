import React from "react";
import {
  Play,
  RotateCcw,
  Cpu,
  Download,
  Zap,
  TrendingUp,
  ShieldCheck,
  Radio,
  Layers,
  Smartphone
} from "lucide-react";
import { PortfolioStats, IndexInfo } from "../types";

interface NavbarProps {
  stats: PortfolioStats | null;
  autoCycle: boolean;
  setAutoCycle: (val: boolean) => void;
  onRunCycle: () => void;
  onRetrainModel: () => void;
  onResetPortfolio: () => void;
  onDownloadReport: () => void;
  onSelectIndex: (indexId: string) => void;
  loading: boolean;
  onNavigateMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  autoCycle,
  setAutoCycle,
  onRunCycle,
  onRetrainModel,
  onResetPortfolio,
  onDownloadReport,
  onSelectIndex,
  loading,
  onNavigateMobile,
}) => {
  const isLive = stats?.mode === "LIVE";
  const selectedIndex = stats?.selectedIndex || "NIFTY_50";
  const availableIndexes = stats?.availableIndexes || [];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-[1850px] mx-auto px-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between min-h-[3.5rem] py-2 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-1.5 rounded-lg text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  My Money Maker
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  v2.5 Index Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden xl:block">
                Groww API Paper & Algorithmic ML Trader (NSE India)
              </p>
            </div>
          </div>

          {/* Index Selector Dropdown - Primary Top Control */}
          <div className="flex items-center gap-2 bg-slate-950 border border-teal-500/40 rounded-xl px-3 py-1.5 shadow-inner">
            <Layers className="w-4 h-4 text-teal-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">
                Market Index
              </span>
              <select
                value={selectedIndex}
                onChange={(e) => onSelectIndex(e.target.value)}
                disabled={loading}
                className="bg-transparent text-xs sm:text-sm font-bold text-teal-300 focus:outline-none cursor-pointer py-0.5 disabled:opacity-50"
              >
                {availableIndexes.map((idx: IndexInfo) => (
                  <option key={idx.id} value={idx.id} className="bg-slate-900 text-slate-100 font-medium">
                    {idx.name} ({idx.stockCount} stocks)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Mode / RL Phase Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                isLive
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "⚡ LIVE MONEY" : `🧠 PAPER RL`}
            </div>

            {/* Current Week Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Week {stats?.currentWeek || 2} of 3
            </div>

            {/* Dynamic Market Open Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border text-xs font-medium ${
              stats?.marketOpen ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${stats?.marketOpen ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`}></span>
              {stats?.marketOpen ? "🟢 OPEN" : "🔴 CLOSED"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Auto Cycle Toggle */}
            <button
              onClick={() => setAutoCycle(!autoCycle)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                autoCycle
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title="Automatically poll live Groww quotes every 4 seconds"
            >
              <Zap className={`w-3.5 h-3.5 ${autoCycle ? "text-amber-400 animate-bounce" : ""}`} />
              <span className="hidden sm:inline">{autoCycle ? "Auto ON" : "Auto OFF"}</span>
            </button>

            {/* Evaluate Market & RL Step */}
            <button
              onClick={onRunCycle}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
              title="Poll live Groww market quotes & evaluate index RL trading policy."
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Evaluate</span>
            </button>

            {/* Retrain ML */}
            <button
              onClick={onRetrainModel}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-100 text-xs font-medium transition-all disabled:opacity-50"
              title="Train Index ML Model"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">Retrain</span>
            </button>

            {/* Download Report */}
            <button
              onClick={onDownloadReport}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="Export CSV Report"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={onResetPortfolio}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-all"
              title="Reset Portfolio Capital"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Mobile View Switcher */}
            {onNavigateMobile && (
              <button
                onClick={onNavigateMobile}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold transition-all"
                title="Switch to Mobile Simplified UI (/mobile)"
              >
                <Smartphone className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Mobile UI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
