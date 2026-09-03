import { HistoricalCandleData } from "../../types.js";
import { FeatureVector } from "./features.js";

export interface LabeledSample {
  timestamp: string;
  ticker: string;
  features: FeatureVector;
  entryPrice: number;
  label: 0 | 1; // 1 = Good Trade (+1.5% hit before -0.75% within 30 candles), 0 = Bad Trade
  exitPrice: number;
  holdingCandles: number;
  maxFavorableExcursionPct: number; // MFE %
  maxAdverseExcursionPct: number;   // MAE %
  realizedPnlPct: number;
  exitReason: "TP_HIT" | "SL_HIT" | "TIMEOUT" | "NONE";
}

export interface TripleBarrierConfig {
  tpPct: number; // Take Profit % (e.g. 1.5)
  slPct: number; // Stop Loss % (e.g. 0.75)
  maxLookaheadCandles: number; // Max candles to evaluate (e.g. 30)
}

export const DEFAULT_TRIPLE_BARRIER_CONFIG: TripleBarrierConfig = {
  tpPct: 1.5,
  slPct: 0.75,
  maxLookaheadCandles: 30,
};

/**
 * Applies the Triple Barrier Method to create binary classification labels (0 or 1).
 * For every candle `i`, simulates entering a BUY trade at `candles[i].close`.
 * Looks ahead up to `maxLookaheadCandles` to evaluate whether price hits +tpPct before -slPct.
 */
export function generateTripleBarrierDataset(
  candles: HistoricalCandleData[],
  features: FeatureVector[],
  config: TripleBarrierConfig = DEFAULT_TRIPLE_BARRIER_CONFIG
): LabeledSample[] {
  const dataset: LabeledSample[] = [];

  // Match features to candles by timestamp or index
  const featureMap = new Map<string, FeatureVector>();
  features.forEach((f) => featureMap.set(f.timestamp, f));

  const totalCandles = candles.length;

  for (let i = 0; i < totalCandles - config.maxLookaheadCandles; i++) {
    const entryCandle = candles[i];
    const feat = featureMap.get(entryCandle.time || "");

    if (!feat) continue;

    const entryPrice = entryCandle.close;
    const targetPrice = entryPrice * (1 + config.tpPct / 100);
    const stopPrice = entryPrice * (1 - config.slPct / 100);

    let maxHigh = entryPrice;
    let minLow = entryPrice;
    let exitPrice = entryPrice;
    let exitReason: "TP_HIT" | "SL_HIT" | "TIMEOUT" = "TIMEOUT";
    let holdingCandles = config.maxLookaheadCandles;
    let label: 0 | 1 = 0;

    for (let k = 1; k <= config.maxLookaheadCandles; k++) {
      const futureCandle = candles[i + k];
      if (!futureCandle) break;

      if (futureCandle.high > maxHigh) maxHigh = futureCandle.high;
      if (futureCandle.low < minLow) minLow = futureCandle.low;

      // Check if Stop Loss was hit on this candle
      if (futureCandle.low <= stopPrice) {
        label = 0;
        exitPrice = stopPrice;
        exitReason = "SL_HIT";
        holdingCandles = k;
        break;
      }

      // Check if Take Profit was hit on this candle
      if (futureCandle.high >= targetPrice) {
        label = 1;
        exitPrice = targetPrice;
        exitReason = "TP_HIT";
        holdingCandles = k;
        break;
      }
    }

    if (exitReason === "TIMEOUT") {
      const finalCandle = candles[i + config.maxLookaheadCandles];
      exitPrice = finalCandle ? finalCandle.close : entryPrice;
      // If ended in profit > half TP and didn't touch SL, consider 1
      const timeoutPnl = ((exitPrice - entryPrice) / entryPrice) * 100;
      label = timeoutPnl >= config.tpPct * 0.6 ? 1 : 0;
    }

    const mfePct = ((maxHigh - entryPrice) / entryPrice) * 100;
    const maePct = ((entryPrice - minLow) / entryPrice) * 100;
    const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;

    dataset.push({
      timestamp: entryCandle.time || new Date().toISOString(),
      ticker: feat.ticker,
      features: feat,
      entryPrice,
      label,
      exitPrice,
      holdingCandles,
      maxFavorableExcursionPct: Math.round(mfePct * 100) / 100,
      maxAdverseExcursionPct: Math.round(maePct * 100) / 100,
      realizedPnlPct: Math.round(pnlPct * 100) / 100,
      exitReason,
    });
  }

  return dataset;
}
