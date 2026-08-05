import React from "react";
import {
  Play,
  RotateCcw,
  Cpu,
  Download,
  Activity,
  Zap,
  TrendingUp,
  ShieldCheck,
  Radio
} from "lucide-react";
import { PortfolioStats } from "../types";

interface NavbarProps {
  stats: PortfolioStats | null;
  autoCycle: boolean;
  setAutoCycle: (val: boolean) => void;
  onRunCycle: () => void;
  onRetrainModel: () => void;
  onResetPortfolio: () => void;
  onDownloadReport: () => void;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  autoCycle,
  setAutoCycle,
  onRunCycle,
  onRetrainModel,
  onResetPortfolio,
  onDownloadReport,
  loading,
}) => {
  const isLive = stats?.mode === "LIVE";

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 rounded-xl text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  My Money Maker
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  v2.4 Algo Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Groww API Paper & Algorithmic ML Trader (NSE India)
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Mode / RL Phase Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                isLive
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "⚡ LIVE MONEY TRADING" : `🧠 RL TRIAL & ERROR (WEEKS 1-3)`}
            </div>

            {/* Current Week Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Week {stats?.currentWeek || 2} of 3 (Paper RL Training)
            </div>

            {/* Dynamic Market Open Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border text-xs font-medium ${
              stats?.marketOpen ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${stats?.marketOpen ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`}></span>
              {stats?.marketStatusText || (stats?.marketOpen ? "🟢 NSE Market OPEN" : "🔴 NSE Market CLOSED")}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Auto Cycle Toggle */}
            <button
              onClick={() => setAutoCycle(!autoCycle)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                autoCycle
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title="Automatically poll live Groww quotes every 5 seconds"
            >
              <Zap className={`w-3.5 h-3.5 ${autoCycle ? "text-amber-400 animate-bounce" : ""}`} />
              <span className="hidden sm:inline">{autoCycle ? "Auto-Poll ON" : "Auto-Poll OFF"}</span>
            </button>

            {/* Evaluate Market & RL Step */}
            <button
              onClick={onRunCycle}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
              title="Poll live Groww market quotes & evaluate RL trading policy. Executes trades ONLY when Q-confidence exceeds entry threshold."
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Evaluate Market</span>
            </button>

            {/* Retrain ML */}
            <button
              onClick={onRetrainModel}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-100 text-xs font-medium transition-all disabled:opacity-50"
              title="Train RandomForest ML Model"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">Train ML</span>
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
          </div>
        </div>
      </div>
    </header>
  );
};
