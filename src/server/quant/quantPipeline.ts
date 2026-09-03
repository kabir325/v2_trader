import fs from "fs";
import path from "path";
import { HistoricalCandleData } from "../../types.js";
import { computeFeatureDataset } from "./features.js";
import {
  generateTripleBarrierDataset,
  DEFAULT_TRIPLE_BARRIER_CONFIG,
  TripleBarrierConfig,
} from "./labeling.js";
import { performWalkForwardSplit } from "./walkForward.js";
import { QuantEnsembleModel, TrainedQuantModel } from "./modelZoo.js";
import { evaluateStrategyBacktest, BacktestPerformanceMetrics } from "./quantEvaluator.js";
import { saveModelArtifact } from "../traderStore.js";

export interface QuantPipelineOptions {
  symbol?: string;
  timeframe?: string;
  tripleBarrier?: TripleBarrierConfig;
  probabilityThreshold?: number; // default 0.65
  trainRatio?: number;           // default 0.60
  valRatio?: number;             // default 0.20
}

export interface QuantPipelineResult {
  symbol: string;
  timeframe: string;
  datasetSummary: {
    rawCandlesCount: number;
    featureDatasetRows: number;
    labeledDatasetRows: number;
    positiveLabelCount: number; // Label 1
    negativeLabelCount: number; // Label 0
    positiveClassRatioPct: number;
  };
  tripleBarrierConfig: TripleBarrierConfig;
  walkForwardSplit: {
    trainCount: number;
    valCount: number;
    testCount: number;
    trainPeriod: string;
    valPeriod: string;
    testPeriod: string;
  };
  modelMetadata: TrainedQuantModel;
  modelFileSaved: {
    relativePath: string;
    sizeBytes: number;
  };
  backtestComparison: {
    probabilityThreshold: number;
    strategyAlone: BacktestPerformanceMetrics;
    strategyWithMlFilter: BacktestPerformanceMetrics;
    performanceDeltaPct: {
      returnGainPct: number;
      sharpeGain: number;
      drawdownReductionPct: number;
      winRateGainPct: number;
    };
  };
  featureImportance: Array<{ name: string; importancePct: number }>;
  executedAt: string;
}

export function executeQuantMlPipeline(
  candles: HistoricalCandleData[],
  options: QuantPipelineOptions = {}
): QuantPipelineResult {
  const symbol = options.symbol || "NIFTY 50";
  const timeframe = options.timeframe || "3m";
  const barrierConfig = options.tripleBarrier || DEFAULT_TRIPLE_BARRIER_CONFIG;
  const probThreshold = options.probabilityThreshold || 0.65;

  // 1. Feature Engineering
  const featureDataset = computeFeatureDataset(candles, symbol);

  // 2. Triple Barrier Labeling
  const labeledDataset = generateTripleBarrierDataset(candles, featureDataset, barrierConfig);

  const posCount = labeledDataset.filter((s) => s.label === 1).length;
  const negCount = labeledDataset.filter((s) => s.label === 0).length;
  const posRatio = labeledDataset.length > 0 ? (posCount / labeledDataset.length) * 100 : 0;

  // 3. Time-Series Walk Forward Split (No Shuffling)
  const split = performWalkForwardSplit(
    labeledDataset,
    options.trainRatio || 0.6,
    options.valRatio || 0.2
  );

  // 4. Fit Model Zoo Ensemble
  const ensemble = new QuantEnsembleModel();
  const modelMeta = ensemble.fit(split.train, split.validation, symbol);

  // 5. Backtest Comparison on Test Set (Out of Sample)
  const strategyAloneMetrics = evaluateStrategyBacktest(split.test, undefined, 0.5);
  const strategyMlFilterMetrics = evaluateStrategyBacktest(split.test, ensemble, probThreshold);

  // Performance Deltas
  const returnGain =
    strategyMlFilterMetrics.totalReturnPct - strategyAloneMetrics.totalReturnPct;
  const sharpeGain = strategyMlFilterMetrics.sharpeRatio - strategyAloneMetrics.sharpeRatio;
  const drawdownReduction =
    strategyAloneMetrics.maxDrawdownPct - strategyMlFilterMetrics.maxDrawdownPct;
  const winRateGain = strategyMlFilterMetrics.winRatePct - strategyAloneMetrics.winRatePct;

  // 6. Save Model Artifact File to disk (/data/models/)
  const savedFile = saveModelArtifact({
    modelId: modelMeta.id,
    indexId: symbol.toLowerCase().replace(/\s+/g, "_"),
    symbol,
    algorithm: modelMeta.algorithm,
    trainedAt: modelMeta.trainedAt,
    samplesCount: modelMeta.sampleCount,
    timeframe,
    features: modelMeta.featuresUsed,
    weights: modelMeta.featureWeights,
    bias: modelMeta.bias,
    hyperparameters: {
      epochs: 30,
      learningRate: 0.03,
      l2Regularization: 0.01,
    },
    metrics: {
      accuracy: modelMeta.modelZooMetrics.ensembleAccuracy,
      precision: modelMeta.modelZooMetrics.ensemblePrecision,
      recall: modelMeta.modelZooMetrics.ensembleRecall,
      f1Score: modelMeta.modelZooMetrics.ensembleF1,
    },
  });

  // Feature importance array sorted descending
  const featureImpList = Object.entries(modelMeta.featureWeights)
    .map(([name, weight]) => ({
      name,
      importancePct: Math.round(weight * 100 * 10) / 10,
    }))
    .sort((a, b) => b.importancePct - a.importancePct);

  return {
    symbol,
    timeframe,
    datasetSummary: {
      rawCandlesCount: candles.length,
      featureDatasetRows: featureDataset.length,
      labeledDatasetRows: labeledDataset.length,
      positiveLabelCount: posCount,
      negativeLabelCount: negCount,
      positiveClassRatioPct: Math.round(posRatio * 10) / 10,
    },
    tripleBarrierConfig: barrierConfig,
    walkForwardSplit: {
      trainCount: split.train.length,
      valCount: split.validation.length,
      testCount: split.test.length,
      trainPeriod: `${split.trainPeriod.start.slice(0, 10)} to ${split.trainPeriod.end.slice(0, 10)}`,
      valPeriod: `${split.valPeriod.start.slice(0, 10)} to ${split.valPeriod.end.slice(0, 10)}`,
      testPeriod: `${split.testPeriod.start.slice(0, 10)} to ${split.testPeriod.end.slice(0, 10)}`,
    },
    modelMetadata: modelMeta,
    modelFileSaved: {
      relativePath: savedFile.filename,
      sizeBytes: savedFile.sizeBytes,
    },
    backtestComparison: {
      probabilityThreshold: probThreshold,
      strategyAlone: strategyAloneMetrics,
      strategyWithMlFilter: strategyMlFilterMetrics,
      performanceDeltaPct: {
        returnGainPct: Math.round(returnGain * 10) / 10,
        sharpeGain: Math.round(sharpeGain * 100) / 100,
        drawdownReductionPct: Math.round(drawdownReduction * 10) / 10,
        winRateGainPct: Math.round(winRateGain * 10) / 10,
      },
    },
    featureImportance: featureImpList,
    executedAt: new Date().toISOString(),
  };
}
