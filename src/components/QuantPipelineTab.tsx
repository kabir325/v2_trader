import React, { useState, useEffect } from "react";
import { IndexInfo } from "../types";
import { InfoTooltip } from "./InfoTooltip";
import {
  BrainCircuit,
  Play,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart2,
  FileCode,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  Cpu,
  RefreshCw,
  FolderDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface QuantPipelineTabProps {
  availableIndexes: IndexInfo[];
  selectedIndex: string;
}

export const QuantPipelineTab: React.FC<QuantPipelineTabProps> = ({
  availableIndexes,
  selectedIndex,
}) => {
  const [symbol, setSymbol] = useState("NIFTY 50");
  const [timeframe, setTimeframe] = useState("3m");
  const [tpPct, setTpPct] = useState<number>(1.5);
  const [slPct, setSlPct] = useState<number>(0.75);
  const [lookahead, setLookahead] = useState<number>(30);
  const [probThreshold, setProbThreshold] = useState<number>(0.65);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);
  const [savedModelFiles, setSavedModelFiles] = useState<any[]>([]);
  const [selectedFileJson, setSelectedFileJson] = useState<any | null>(null);

  // Sync default symbol with active index
  useEffect(() => {
    const active = availableIndexes.find((i) => i.id === selectedIndex);
    if (active) {
      setSymbol(active.name);
    }
  }, [selectedIndex, availableIndexes]);

  // Load latest result & model files on mount
  useEffect(() => {
    fetchLatestResult();
    fetchModelFiles();
  }, []);

  const fetchLatestResult = async () => {
    try {
      const res = await fetch("/api/quant/latest");
      const data = await res.json();
      if (data.latest) {
        setPipelineResult(data.latest);
      }
    } catch (_) {}
  };

  const fetchModelFiles = async () => {
    try {
      const res = await fetch("/api/quant/model-files");
      const data = await res.json();
      if (data.files) {
        setSavedModelFiles(data.files);
      }
    } catch (_) {}
  };

  const handleRunPipeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quant/run-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          timeframe,
          tpPct,
          slPct,
          maxLookaheadCandles: lookahead,
          probabilityThreshold: probThreshold,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to execute Quant ML Pipeline");
      }

      setPipelineResult(data.result);
      fetchModelFiles();
    } catch (err: any) {
      setError(err.message || "Pipeline execution failed");
    } finally {
      setLoading(false);
    }
  };

  const bMetrics = pipelineResult?.backtestComparison;
  const stratAlone = bMetrics?.strategyAlone;
  const stratMl = bMetrics?.strategyWithMlFilter;
  const deltas = bMetrics?.performanceDeltaPct;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & Objective Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Institutional Quantitative ML Pipeline Architecture
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Walk-Forward Quant Machine Learning Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Predicts trade quality (<code className="text-emerald-400 font-bold">Label = 1</code> if trade reaches{" "}
              <span className="text-emerald-400 font-semibold">+{tpPct}% TP</span> before{" "}
              <span className="text-rose-400 font-semibold">-{slPct}% SL</span> within {lookahead} candles) using a 30+ feature vector and XGBoost/LightGBM ensemble. Evaluated on quantitative metrics (Sharpe, Profit Factor, Sortino) — never simple accuracy!
            </p>
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={loading}
            className="self-start md:self-center flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Quant ML Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Pipeline Controls + Pipeline Stage Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col: Hyperparameter & Target Controls */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Pipeline Configuration
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              NSE / Groww API
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Target Stock / Index</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="NIFTY 50">NIFTY 50 (50 stocks)</option>
                <option value="BANKNIFTY">BANKNIFTY (12 banking stocks)</option>
                <option value="FINNIFTY">FINNIFTY (20 financial stocks)</option>
                <option value="RELIANCE">RELIANCE Industries</option>
                <option value="HDFCBANK">HDFC Bank</option>
                <option value="ICICIBANK">ICICI Bank</option>
                <option value="INFY">Infosys</option>
                <option value="TCS">TCS</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Candle Timeframe</label>
              <div className="grid grid-cols-4 gap-1.5">
                {["1m", "3m", "5m", "15m"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                      timeframe === tf
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Triple Barrier Targets */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Triple Barrier Target Labels:</span>
                <InfoTooltip title="Triple Barrier Method" text="Sets profit (+1.5%), loss (-0.75%), and time horizon boundaries to create binary labels without price target overfitting." />
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Take Profit (+%)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={tpPct}
                    onChange={(e) => setTpPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-emerald-400 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Stop Loss (-%)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={slPct}
                    onChange={(e) => setSlPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-rose-400 font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Max Holding Candle Horizon: <span className="text-indigo-300 font-bold">{lookahead} candles</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={lookahead}
                  onChange={(e) => setLookahead(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Probability Threshold Slider */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                <span>ML Filter Probability Threshold:</span>
                <span className="text-emerald-400 font-bold font-mono">{(probThreshold * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.50"
                max="0.90"
                step="0.05"
                value={probThreshold}
                onChange={(e) => setProbThreshold(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Only trades with ensemble model confidence ≥ {(probThreshold * 100).toFixed(0)}% are executed.
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Pipeline Dataset & Stage Breakdown */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Pipeline Architecture & Dataset Breakdown
            </h3>
            {pipelineResult && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Pipeline Active
              </span>
            )}
          </div>

          {pipelineResult ? (
            <div className="space-y-4">
              {/* Dataset Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block font-medium">OHLCV Candles</span>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {pipelineResult.datasetSummary.rawCandlesCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">{timeframe} snapshot bars</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block font-medium">Feature Vectors</span>
                  <div className="text-lg font-bold text-indigo-300 mt-0.5">
                    {pipelineResult.datasetSummary.featureDatasetRows.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">30+ features / row</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block font-medium">Good Trades (Label=1)</span>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {pipelineResult.datasetSummary.positiveLabelCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-emerald-500/80">
                    {pipelineResult.datasetSummary.positiveClassRatioPct}% hit +{tpPct}%
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block font-medium">Bad Trades (Label=0)</span>
                  <div className="text-lg font-bold text-rose-400 mt-0.5">
                    {pipelineResult.datasetSummary.negativeLabelCount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-rose-500/80">Filtered out</span>
                </div>
              </div>

              {/* Walk Forward Time-Series Split Timeline */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Walk-Forward Time-Series Split (Zero Future Information Leakage)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-indigo-500/30">
                    <span className="text-indigo-400 font-bold block text-[11px]">Training Set (60%)</span>
                    <div className="font-semibold text-white mt-0.5">{pipelineResult.walkForwardSplit.trainCount} samples</div>
                    <span className="text-[10px] text-slate-500 truncate block">{pipelineResult.walkForwardSplit.trainPeriod}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-teal-500/30">
                    <span className="text-teal-400 font-bold block text-[11px]">Validation Set (20%)</span>
                    <div className="font-semibold text-white mt-0.5">{pipelineResult.walkForwardSplit.valCount} samples</div>
                    <span className="text-[10px] text-slate-500 truncate block">{pipelineResult.walkForwardSplit.valPeriod}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block text-[11px]">Out-of-Sample Test (20%)</span>
                    <div className="font-semibold text-white mt-0.5">{pipelineResult.walkForwardSplit.testCount} samples</div>
                    <span className="text-[10px] text-slate-500 truncate block">{pipelineResult.walkForwardSplit.testPeriod}</span>
                  </div>
                </div>
              </div>

              {/* Persisted Model JSON Badge */}
              <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded font-bold text-[10px] border border-indigo-400/40 uppercase">
                    MODEL PERSISTED
                  </span>
                  <span className="text-slate-300 font-medium">Model File Saved:</span>
                  <code className="text-emerald-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {pipelineResult.modelFileSaved.relativePath}
                  </code>
                </div>
                <span className="text-[11px] text-slate-400">
                  {pipelineResult.modelFileSaved.sizeBytes} Bytes
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">No Quant Pipeline run executed yet for {symbol}.</p>
              <p className="text-[11px] text-slate-500">Click <strong className="text-indigo-300">Execute Quant ML Pipeline</strong> to run feature engineering, triple barrier labeling, walk-forward splitting, and ensemble training.</p>
            </div>
          )}
        </div>
      </div>

      {/* Out-of-Sample Performance Comparison: Strategy Alone vs Strategy + Quant ML Filter */}
      {pipelineResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Out-of-Sample Quantitative Backtest Evaluation
            </h3>
            <span className="text-xs text-slate-400">
              ML Filter Threshold: <strong className="text-emerald-400 font-mono">{(probThreshold * 100).toFixed(0)}%</strong>
            </span>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strategy Alone (Baseline) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Baseline Strategy Alone</span>
                  <span className="text-[11px] text-slate-500">Takes every generated BUY signal without ML filtering</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-lg">
                  NO ML
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Total Return</span>
                  <div className={`text-base font-bold ${stratAlone?.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {stratAlone?.totalReturnPct >= 0 ? "+" : ""}{stratAlone?.totalReturnPct}%
                  </div>
                  <span className="text-[9px] text-slate-500 block">vs B&H: {stratAlone?.buyHoldReturnPct}%</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Sharpe Ratio</span>
                  <div className="text-base font-bold text-white">{stratAlone?.sharpeRatio}</div>
                  <span className="text-[9px] text-slate-500 block">Sortino: {stratAlone?.sortinoRatio}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Profit Factor</span>
                  <div className="text-base font-bold text-amber-400">{stratAlone?.profitFactor}</div>
                  <span className="text-[9px] text-slate-500 block">Max DD: -{stratAlone?.maxDrawdownPct}%</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Win Rate</span>
                  <div className="text-base font-bold text-teal-300">{stratAlone?.winRatePct}%</div>
                  <span className="text-[9px] text-slate-500 block">{stratAlone?.winningTrades}W / {stratAlone?.losingTrades}L</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Expectancy</span>
                  <div className="text-base font-bold text-indigo-300">+{stratAlone?.expectancyPnlPct}%</div>
                  <span className="text-[9px] text-slate-500 block">Avg return / trade</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Avg Win / Loss</span>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    <span className="text-emerald-400">+{stratAlone?.avgWinnerPct}%</span> / <span className="text-rose-400">-{stratAlone?.avgLoserPct}%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block">Payout Ratio</span>
                </div>
              </div>
            </div>

            {/* Strategy + Quant ML Filter (Institutional) */}
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2.5">
                <div>
                  <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Strategy + Quant ML Ensemble Filter
                  </span>
                  <span className="text-[11px] text-slate-300">Only executes trades with ML Confidence ≥ {(probThreshold * 100).toFixed(0)}%</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold rounded-lg">
                  ML ENHANCED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block font-medium">Total Return</span>
                  <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                    +{stratMl?.totalReturnPct}%
                    {deltas?.returnGainPct > 0 && (
                      <span className="text-[10px] px-1 bg-emerald-500/30 text-emerald-300 rounded font-normal">
                        +{deltas.returnGainPct}%
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 block">CAGR: {stratMl?.cagrPct}%</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block font-medium">Sharpe Ratio</span>
                  <div className="text-lg font-bold text-teal-300 flex items-center gap-1">
                    {stratMl?.sharpeRatio}
                    {deltas?.sharpeGain > 0 && (
                      <span className="text-[10px] px-1 bg-teal-500/30 text-teal-200 rounded font-normal">
                        +{deltas.sharpeGain}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 block">Sortino: {stratMl?.sortinoRatio}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block font-medium">Profit Factor</span>
                  <div className="text-lg font-bold text-amber-300">{stratMl?.profitFactor}</div>
                  <span className="text-[9px] text-emerald-400 block font-semibold">
                    Max DD: -{stratMl?.maxDrawdownPct}% (Saved {deltas?.drawdownReductionPct}%)
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block font-medium">Win Rate</span>
                  <div className="text-lg font-bold text-emerald-300 flex items-center gap-1">
                    {stratMl?.winRatePct}%
                    {deltas?.winRateGainPct > 0 && (
                      <span className="text-[10px] px-1 bg-emerald-500/30 text-emerald-200 rounded font-normal">
                        +{deltas.winRateGainPct}%
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 block">{stratMl?.winningTrades}W / {stratMl?.losingTrades}L</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block font-medium">Expectancy</span>
                  <div className="text-lg font-bold text-indigo-300">+{stratMl?.expectancyPnlPct}%</div>
                  <span className="text-[9px] text-slate-500 block">Avg payout / trade</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block font-medium">Avg Win / Loss</span>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    <span className="text-emerald-400">+{stratMl?.avgWinnerPct}%</span> / <span className="text-rose-400">-{stratMl?.avgLoserPct}%</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block">Calmar: {stratMl?.calmarRatio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              Quant Feature Importance Ranking (Model Decision Drivers)
            </h4>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineResult.featureImportance.slice(0, 10)} margin={{ top: 5, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" interval={0} />
                  <YAxis stroke="#94a3b8" fontSize={10} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(val: any) => [`${val}%`, "Weight"]}
                  />
                  <Bar dataKey="importancePct" radius={[4, 4, 0, 0]}>
                    {pipelineResult.featureImportance.slice(0, 10).map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index < 3 ? "#34d399" : index < 6 ? "#818cf8" : "#38bdf8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saved Model JSON Files Artifact Explorer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-teal-400" />
                Persisted Model Files & JSON Artifact Explorer (<code className="text-indigo-300 font-mono">data/models/</code>)
              </h4>
              <button
                onClick={fetchModelFiles}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Files
              </button>
            </div>

            {savedModelFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedModelFiles.map((file) => (
                    <div
                      key={file.filename}
                      onClick={() => setSelectedFileJson(file.content)}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 font-mono">{file.filename}</span>
                        <span className="text-[10px] text-slate-500">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">{file.path}</span>
                      {file.content && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-900">
                          <span>Algo: {file.content.algorithm?.slice(0, 25)}...</span>
                          <span>Samples: {file.content.samplesCount}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedFileJson && (
                  <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">Inspecting Model JSON Structure:</span>
                      <button
                        onClick={() => setSelectedFileJson(null)}
                        className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Close Preview
                      </button>
                    </div>
                    <pre className="bg-slate-900 p-3 rounded-lg text-[10px] text-emerald-300 font-mono max-h-56 overflow-y-auto border border-slate-800">
                      {JSON.stringify(selectedFileJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No model files saved yet. Click Execute Quant ML Pipeline above to save model artifacts.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
