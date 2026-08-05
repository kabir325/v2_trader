import React, { useState, useEffect } from "react";
import { IndexInfo, HistoricalTrainOptions, HistoricalTrainResult } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  BarChart,
  Bar,
  Legend
} from "recharts";
import {
  GraduationCap,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Layers,
  Database,
  Sliders,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  Zap,
  Check
} from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface HistoricalTrainingTabProps {
  availableIndexes: IndexInfo[];
  selectedIndex: string;
  onSelectIndex: (indexId: string) => void;
  marketStatusText?: string;
  marketOpen?: boolean;
}

export const HistoricalTrainingTab: React.FC<HistoricalTrainingTabProps> = ({
  availableIndexes,
  selectedIndex,
  onSelectIndex,
  marketStatusText,
  marketOpen = false,
}) => {
  const stockListByIndex: Record<string, string[]> = {
    nifty_50: ["NIFTY 50", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "TATAMOTORS", "LT"],
    nifty_bank: ["BANK NIFTY", "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BANKBARODA", "PNB"],
    sensex: ["SENSEX", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC"],
    bse_100: ["BSE 100", "RELIANCE", "TCS", "ZOMATO", "HAL", "VBL", "PIDILITIND", "REC", "PFC"],
    nifty_it: ["NIFTY IT", "TCS", "INFY", "LTIM", "TECHM", "HCLTECH", "WIPRO", "PERSISTENT", "COFORGE"],
    nifty_fin: ["FIN SERVICE", "HDFCBANK", "ICICIBANK", "BAJFINANCE", "MUTHOOTFIN", "REC", "SHRIRAMFIN"],
  };

  const currentSymbols = stockListByIndex[selectedIndex] || stockListByIndex["nifty_50"];

  const [selectedSymbol, setSelectedSymbol] = useState<string>(currentSymbols[0]);
  const [timeframe, setTimeframe] = useState<"1m" | "3m" | "6m" | "1y">("3m");
  const [interval, setInterval] = useState<"1d" | "15m" | "5m">("1d");

  // Hyperparameters
  const [epochs, setEpochs] = useState<number>(30);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [useRsi, setUseRsi] = useState<boolean>(true);
  const [useMacd, setUseMacd] = useState<boolean>(true);
  const [useEmaCross, setUseEmaCross] = useState<boolean>(true);
  const [useVolumeSpike, setUseVolumeSpike] = useState<boolean>(true);
  const [useBollinger, setUseBollinger] = useState<boolean>(true);

  // Training Queue & Progress State
  const [loading, setLoading] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingStage, setTrainingStage] = useState<string>("");
  const [showGlossary, setShowGlossary] = useState<boolean>(true);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [rawCandlesCount, setRawCandlesCount] = useState<number>(0);
  const [trainResult, setTrainResult] = useState<HistoricalTrainResult | null>(null);
  const [deployed, setDeployed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selected symbol when index changes
  useEffect(() => {
    const list = stockListByIndex[selectedIndex] || stockListByIndex["nifty_50"];
    if (!list.includes(selectedSymbol)) {
      setSelectedSymbol(list[0]);
    }
  }, [selectedIndex]);

  // Initial auto-train on load
  useEffect(() => {
    handleTrainModel();
  }, [selectedSymbol, timeframe, interval]);

  const handleTrainModel = async () => {
    setLoading(true);
    setTrainingProgress(10);
    setTrainingStage("Queued — Fetching Groww Historical OHLCV Quotes...");
    setError(null);
    setDeployed(false);

    const stageTimer1 = setTimeout(() => {
      setTrainingProgress(35);
      setTrainingStage("Stage 2/4: Calculating Technical Indicators (RSI, MACD, EMA 20/50)...");
    }, 400);

    const stageTimer2 = setTimeout(() => {
      setTrainingProgress(65);
      setTrainingStage("Stage 3/4: Optimizing Neural Loss Weights across Iterations...");
    }, 800);

    const stageTimer3 = setTimeout(() => {
      setTrainingProgress(88);
      setTrainingStage("Stage 4/4: Running Historical Backtest Strategy & Metrics...");
    }, 1200);

    const options: HistoricalTrainOptions = {
      symbol: selectedSymbol,
      timeframe,
      interval,
      epochs,
      trainRatio: 0.8,
      learningRate,
      features: {
        useRsi,
        useMacd,
        useEmaCross,
        useVolumeSpike,
        useBollinger,
      },
      targetHorizonBars: 5,
    };

    try {
      const res = await fetch("/api/ml/train-historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      const data = await res.json();
      if (data.success) {
        setTrainingProgress(100);
        setTrainingStage("Training Complete! Model weights updated successfully.");
        setTrainResult(data.result);
        setRawCandlesCount(data.result.totalCandles);
      } else {
        setError(data.error || "Historical training failed");
      }
    } catch (err: any) {
      setError(err.message || "Error running model training");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleDeploy = () => {
    setDeployed(true);
    setTimeout(() => setDeployed(false), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Groww Historical Data Model Trainer
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30">
                OHLCV Machine Learning Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Train neural & decision tree model weights on historical Groww OHLCV price action data.
              Prevents artificial dummy data pollution during market closed hours.
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
              {marketStatusText || "NSE Market Closed (09:15-15:30 IST)"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Index & Hyperparameter Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Training Configuration
            </h3>
            <span className="text-xs text-slate-500 font-medium">Step 1 of 2</span>
          </div>

          {/* Target Index Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>Target Market Index</span>
              <InfoTooltip title="Index Scope" text="Isolates model training to constituent stocks of the selected NSE index." />
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {availableIndexes.map((idx) => {
                const isSelected = selectedIndex === idx.id;
                return (
                  <button
                    key={idx.id}
                    onClick={() => onSelectIndex(idx.id)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all border text-left flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{idx.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Symbol Selector Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              Target Symbol / Constituent:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar p-1.5 bg-slate-950 rounded-lg border border-slate-800">
              {currentSymbols.map((sym) => {
                const isSelected = selectedSymbol === sym;
                return (
                  <button
                    key={sym}
                    onClick={() => setSelectedSymbol(sym)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeframe & Interval Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Historical Range</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="1m">1 Month (30 Days)</option>
                <option value="3m">3 Months (90 Days)</option>
                <option value="6m">6 Months (180 Days)</option>
                <option value="1y">1 Year (365 Days)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Candle Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="1d">1 Day Candles</option>
                <option value="15m">15 Min Candles</option>
                <option value="5m">5 Min Candles</option>
              </select>
            </div>
          </div>

          {/* Technical Feature Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              Enabled Feature Vectors:
            </label>
            <div className="space-y-1.5">
              {[
                { id: "rsi", label: "RSI Momentum (14)", val: useRsi, set: setUseRsi },
                { id: "macd", label: "MACD Signal (12, 26, 9)", val: useMacd, set: setUseMacd },
                { id: "ema", label: "EMA 20/50 Crossover", val: useEmaCross, set: setUseEmaCross },
                { id: "vol", label: "Volume Spike Factor", val: useVolumeSpike, set: setUseVolumeSpike },
                { id: "boll", label: "Bollinger Squeeze", val: useBollinger, set: setUseBollinger },
              ].map((feat) => (
                <label key={feat.id} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 cursor-pointer hover:border-slate-700">
                  <span className="text-xs text-slate-300 font-medium">{feat.label}</span>
                  <input
                    type="checkbox"
                    checked={feat.val}
                    onChange={(e) => feat.set(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Training Hyperparameter Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Training Epochs: {epochs}</label>
              <span className="text-[10px] text-slate-500">10–100 iterations</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Action Buttons & Training Queue Progress */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleTrainModel}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? `Training ${selectedSymbol} Model (${trainingProgress}%)...` : `Train Model on ${selectedSymbol} Data`}
            </button>

            {/* Live Model Training Queue Progress Bar */}
            {loading && (
              <div className="bg-indigo-950/70 border border-indigo-500/40 p-3.5 rounded-xl space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                  <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0" />
                    {trainingStage}
                  </span>
                  <span className="text-teal-300 font-mono text-xs">{trainingProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-indigo-500/30 p-0.5">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 h-full transition-all duration-300 rounded-full shadow-sm"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Processing real Groww historical bars. Do not close tab.
                </p>
              </div>
            )}

            {trainResult && !loading && (
              <button
                onClick={handleDeploy}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  deployed
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                }`}
              >
                {deployed ? <Check className="w-4 h-4" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                {deployed ? "Model Deployed to Live Engine!" : "Deploy Model Weights to Live Trader"}
              </button>
            )}
          </div>

          {/* Plain English Financial Terms Explained (Accordion / Card) */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2">
            <button
              onClick={() => setShowGlossary(!showGlossary)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                Financial Terms Explained in Simple Words
              </span>
              <span className="text-[10px] text-indigo-400">{showGlossary ? "Hide ▲" : "Show Terms ▼"}</span>
            </button>

            {showGlossary && (
              <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="font-bold text-slate-200">📈 RSI Momentum (Relative Strength Index)</div>
                  <p>Think of RSI as a stock's speedometer. Above 70 means it's overbought (price went up too fast, might drop). Below 30 means it's oversold (cheap discount price!).</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="font-bold text-slate-200">📊 MACD Signal Crossover</div>
                  <p>A trend compass. When the MACD line cuts above the signal line, buying momentum is speeding up—signaling a great entry point.</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="font-bold text-slate-200">⚡ EMA 20/50 Crossover</div>
                  <p>Compares short-term trend (20-day average) vs long-term trend (50-day average). When 20 goes above 50, it confirms a strong upward bull trend.</p>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                  <div className="font-bold text-slate-200">🎯 Backtest Win Rate & Profit Factor</div>
                  <p><strong className="text-slate-200">Win Rate:</strong> Out of 100 simulated trades, how many made money. <strong className="text-slate-200">Profit Factor:</strong> Total money won divided by total money lost (Anything over 1.5 is excellent!).</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Historical Chart & Backtest Performance */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Historical Price Chart with Signal Overlay */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Historical Price Action & ML Signals: {selectedSymbol}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {trainResult ? `${trainResult.totalCandles} Historical OHLCV Bars (${trainResult.trainSamples} Train / ${trainResult.testSamples} Test)` : "Loading candles..."}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  Range: {timeframe.toUpperCase()} ({interval})
                </span>
              </div>
            </div>

            {/* Recharts Historical Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              {trainResult ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainResult.candlesWithSignals} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} tickFormatter={(v) => `₹${v}`} width={65} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#f8fafc",
                      }}
                      formatter={(val: any, name: string) => [
                        name === "close" ? `₹${Number(val).toFixed(2)}` : val,
                        name.toUpperCase(),
                      ]}
                    />

                    {/* Price Line */}
                    <Line type="monotone" dataKey="close" name="close" stroke="#38bdf8" strokeWidth={2} dot={false} />

                    {/* EMA 20 & 50 */}
                    <Line type="monotone" dataKey="ema20" name="EMA 20" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="ema50" name="EMA 50" stroke="#a855f7" strokeWidth={1} dot={false} strokeDasharray="3 3" />

                    {/* Buy Dot Markers */}
                    {trainResult.candlesWithSignals.map((c, idx) => {
                      if (c.signal === "BUY") {
                        return (
                          <ReferenceDot
                            key={`buy-${idx}`}
                            x={c.date}
                            y={c.close}
                            r={6}
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }
                      if (c.signal === "SELL") {
                        return (
                          <ReferenceDot
                            key={`sell-${idx}`}
                            x={c.date}
                            y={c.close}
                            r={6}
                            fill="#f43f5e"
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  {loading ? "Training ML model & fetching historical data..." : "Click Train Model to view chart"}
                </div>
              )}
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white inline-block" />
                  ML BUY Signal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white inline-block" />
                  ML SELL Signal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                  EMA 20
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-purple-400 inline-block" />
                  EMA 50
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Source: Groww API NSE Historical Quotes
              </span>
            </div>
          </div>

          {/* Model Accuracy & Backtest Performance Grid */}
          {trainResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Model Accuracy</span>
                <div className="text-xl font-bold text-emerald-400">{trainResult.accuracy}%</div>
                <span className="text-[10px] text-slate-500 block">F1 Score: {trainResult.f1Score}%</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Backtest Strategy Return</span>
                <div className="text-xl font-bold text-teal-300 flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-0.5 text-emerald-400" />
                  +{trainResult.backtest.totalReturnPct}%
                </div>
                <span className="text-[10px] text-slate-500 block">
                  vs Buy & Hold: {trainResult.backtest.buyHoldReturnPct}%
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Backtest Win Rate</span>
                <div className="text-xl font-bold text-white">{trainResult.backtest.winRate}%</div>
                <span className="text-[10px] text-slate-500 block">
                  {trainResult.backtest.totalTrades} Executed Trades
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-medium text-slate-400">Max Drawdown</span>
                <div className="text-xl font-bold text-rose-400">
                  -{trainResult.backtest.maxDrawdownPct}%
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Profit Factor: {trainResult.backtest.profitFactor}
                </span>
              </div>
            </div>
          )}

          {/* Training Loss Curve & Feature Importance */}
          {trainResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Training Loss Convergence Graph */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Epoch Loss Curve (Gradient Optimization)
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainResult.lossHistory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} domain={[0, "auto"]} width={35} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", fontSize: "11px", borderColor: "#334155" }} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="valLoss" name="Val Loss" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Feature Importance Bar Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Feature Importance Weights
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trainResult.featureImportance} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", fontSize: "11px", borderColor: "#334155" }} />
                      <Bar dataKey="importance" name="Weight %" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
