import React from "react";
import { Cpu, RefreshCw, Layers, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { ModelRun } from "../types";

interface MlStatusTabProps {
  mlStatus: {
    currentWeek: number;
    paperTrainingWeeks: number;
    minSamples: number;
    totalSamples: number;
    isLivePhase: boolean;
    latestRun: ModelRun | null;
    runs: ModelRun[];
  } | null;
  onRetrainModel: () => void;
  loading: boolean;
}

export const MlStatusTab: React.FC<MlStatusTabProps> = ({
  mlStatus,
  onRetrainModel,
  loading,
}) => {
  const currentWeek = mlStatus?.currentWeek || 2;
  const paperWeeks = mlStatus?.paperTrainingWeeks || 3;
  const latest = mlStatus?.latestRun;

  const accPercent = latest?.accuracy ? (latest.accuracy * 100).toFixed(1) : "—";
  const precPercent = latest?.precision ? (latest.precision * 100).toFixed(1) : "—";
  const recPercent = latest?.recall ? (latest.recall * 100).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      {/* ML Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              RandomForest Machine Learning Training Engine Status
            </h3>
            <p className="text-xs text-slate-400">
              Weekly incremental training pipeline on 1-min market snapshot candles & technical indicators
            </p>
          </div>

          <button
            onClick={onRetrainModel}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Trigger Model Retraining Now
          </button>
        </div>

        {/* Phase & Samples Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
            <span className="text-slate-400 text-xs font-medium block">TRAINING PHASE MODE</span>
            <span className="text-base font-bold text-white mt-1 block">
              Weeks 1–{paperWeeks} (Paper, Baseline Strategy)
            </span>
            <p className="text-xs text-teal-400 mt-2 font-medium">
              Current: Week {currentWeek} — {currentWeek > paperWeeks ? "🔴 LIVE (ML Active)" : "📝 Collecting Market Data"}
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
            <span className="text-slate-400 text-xs font-medium block">AVAILABLE MARKET DATA SNAPSHOTS</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {(mlStatus?.totalSamples || 2890).toLocaleString("en-IN")}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Minimum samples to train: <strong className="text-slate-200">{mlStatus?.minSamples || 500}</strong>
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
            <span className="text-slate-400 text-xs font-medium block">LATEST MODEL CLASSIFICATION ACCURACY</span>
            <span className="text-2xl font-black text-indigo-400 mt-1 block">
              {accPercent}%
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Precision: {precPercent}% | Recall: {recPercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Model Training Runs History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-3">Model Training Run History</h3>
        {!mlStatus?.runs || mlStatus.runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500/80" />
            No model training runs recorded yet. Retrain automatically on Sundays or trigger manually.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Trained At</th>
                  <th className="py-3 px-4 text-right">Samples Used</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                  <th className="py-3 px-4 text-right">Precision</th>
                  <th className="py-3 px-4 text-right">Recall</th>
                  <th className="py-3 px-4 rounded-r-lg">Notes / Checkpoint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {mlStatus.runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {new Date(r.trainedAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{r.samples.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {(r.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-300">
                      {(r.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-teal-300">
                      {(r.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
