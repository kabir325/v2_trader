import React from "react";
import { Cpu, RefreshCw, AlertTriangle, Layers } from "lucide-react";
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
    selectedIndex?: string;
    selectedIndexName?: string;
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
  const indexName = mlStatus?.selectedIndexName || "NIFTY 50";

  const formatPct = (val?: number) => {
    if (val === undefined || val === null) return "—";
    const num = val <= 1.0 ? val * 100 : val;
    return num.toFixed(1);
  };

  const accPercent = formatPct(latest?.accuracy);
  const precPercent = formatPct(latest?.precision);
  const recPercent = formatPct(latest?.recall);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* ML Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                RandomForest ML Training Engine Status
              </h3>
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 font-bold border border-teal-500/30">
                <Layers className="w-3 h-3 text-teal-400" />
                {indexName} Model
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Weekly incremental training pipeline on 1-min market snapshot candles & technical indicators for <strong className="text-teal-300">{indexName}</strong>
            </p>
          </div>

          <button
            onClick={onRetrainModel}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Retrain {indexName} Model Now
          </button>
        </div>

        {/* Phase & Samples Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
            <span className="text-slate-400 text-xs font-medium block">INDEX TRAINING ISOLATION</span>
            <span className="text-base font-bold text-teal-300 mt-1 block">
              {indexName}
            </span>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Data, features & model checkpoints are isolated per index.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
            <span className="text-slate-400 text-xs font-medium block">INDEX MARKET SNAPSHOTS</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {(mlStatus?.totalSamples || 2890).toLocaleString("en-IN")}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Minimum samples required: <strong className="text-slate-200">{mlStatus?.minSamples || 500}</strong>
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
            <span className="text-slate-400 text-xs font-medium block">{indexName.toUpperCase()} MODEL ACCURACY</span>
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
        <h3 className="text-sm font-semibold text-white mb-3">
          Model Checkpoint & Retrain History ({indexName})
        </h3>
        {!mlStatus?.runs || mlStatus.runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-amber-500/80" />
            No model training runs recorded yet for {indexName}. Trigger retraining above to generate a checkpoint.
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
                      {formatPct(r.accuracy)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {formatPct(r.precision)}%
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {formatPct(r.recall)}%
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs space-y-1">
                      <div className="italic truncate text-[11px]">{r.notes}</div>
                      {r.modelFile && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                          💾 {r.modelFile}
                        </span>
                      )}
                    </td>
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
