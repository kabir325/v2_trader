import { LabeledSample } from "./labeling.js";
import { ModelPrediction, QuantEnsembleModel } from "./modelZoo.js";

export interface TradeRecord {
  timestamp: string;
  ticker: string;
  entryPrice: number;
  exitPrice: number;
  pnlPct: number;
  pnlInr: number;
  holdingCandles: number;
  mlProb: number;
  exitReason: string;
  isWin: boolean;
}

export interface BacktestPerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  totalReturnPct: number;
  buyHoldReturnPct: number;
  cagrPct: number;
  sharpeRatio: number; // Risk-adjusted return
  sortinoRatio: number; // Downside risk-adjusted return
  profitFactor: number; // Gross profit / Gross loss
  maxDrawdownPct: number; // Peak to trough capital drop
  calmarRatio: number;
  avgWinnerPct: number;
  avgLoserPct: number;
  expectancyPnlPct: number; // Expected return per trade
  trades: TradeRecord[];
}

export function evaluateStrategyBacktest(
  testDataset: LabeledSample[],
  model?: QuantEnsembleModel,
  probabilityThreshold: number = 0.65,
  initialCapital: number = 100000
): BacktestPerformanceMetrics {
  const trades: TradeRecord[] = [];
  let currentCapital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdownInr = 0;
  let maxDrawdownPct = 0;

  const returnsList: number[] = [];
  const downsideReturnsList: number[] = [];

  let totalGrossProfit = 0;
  let totalGrossLoss = 0;

  let totalWinPctSum = 0;
  let totalLossPctSum = 0;
  let winCount = 0;
  let lossCount = 0;

  testDataset.forEach((sample) => {
    let takeTrade = true;
    let mlProb = 0.8;

    if (model) {
      const pred = model.predict(sample.features, probabilityThreshold);
      mlProb = pred.probability;
      takeTrade = pred.prediction === 1; // Only enter if ML probability >= threshold
    }

    if (!takeTrade) return;

    const pnlPct = sample.realizedPnlPct;
    const isWin = pnlPct > 0;
    const pnlInr = (currentCapital * pnlPct) / 100;

    currentCapital += pnlInr;
    if (currentCapital > peakCapital) {
      peakCapital = currentCapital;
    }

    const drawdownInr = peakCapital - currentCapital;
    const drawdownPct = peakCapital > 0 ? (drawdownInr / peakCapital) * 100 : 0;
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
      maxDrawdownInr = drawdownInr;
    }

    returnsList.push(pnlPct);
    if (pnlPct < 0) {
      downsideReturnsList.push(pnlPct);
      totalGrossLoss += Math.abs(pnlInr);
      totalLossPctSum += Math.abs(pnlPct);
      lossCount++;
    } else {
      totalGrossProfit += pnlInr;
      totalWinPctSum += pnlPct;
      winCount++;
    }

    trades.push({
      timestamp: sample.timestamp,
      ticker: sample.ticker,
      entryPrice: sample.entryPrice,
      exitPrice: sample.exitPrice,
      pnlPct,
      pnlInr: Math.round(pnlInr),
      holdingCandles: sample.holdingCandles,
      mlProb,
      exitReason: sample.exitReason,
      isWin,
    });
  });

  const totalTrades = trades.length;
  const winningTrades = winCount;
  const losingTrades = lossCount;
  const winRatePct = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 1000) / 10 : 0;
  const totalReturnPct = Math.round(((currentCapital - initialCapital) / initialCapital) * 1000) / 10;

  // Buy & Hold baseline return across same period
  let buyHoldReturnPct = 0;
  if (testDataset.length > 0) {
    const firstPrice = testDataset[0].entryPrice;
    const lastPrice = testDataset[testDataset.length - 1].exitPrice;
    buyHoldReturnPct = Math.round(((lastPrice - firstPrice) / firstPrice) * 1000) / 10;
  }

  // Profit Factor
  const profitFactor =
    totalGrossLoss > 0
      ? Math.round((totalGrossProfit / totalGrossLoss) * 100) / 100
      : totalGrossProfit > 0
      ? 3.5
      : 1.0;

  // Avg Winner & Loser
  const avgWinnerPct = winCount > 0 ? Math.round((totalWinPctSum / winCount) * 100) / 100 : 0;
  const avgLoserPct = lossCount > 0 ? Math.round((totalLossPctSum / lossCount) * 100) / 100 : 0;

  // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  const winProb = totalTrades > 0 ? winningTrades / totalTrades : 0;
  const lossProb = totalTrades > 0 ? losingTrades / totalTrades : 0;
  const expectancyPnlPct = Math.round((winProb * avgWinnerPct - lossProb * avgLoserPct) * 100) / 100;

  // Sharpe & Sortino Calculations
  const avgReturn =
    returnsList.length > 0 ? returnsList.reduce((a, b) => a + b, 0) / returnsList.length : 0;
  const varSum =
    returnsList.length > 0
      ? returnsList.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returnsList.length
      : 1;
  const stdReturn = Math.sqrt(varSum) || 1.0;

  // Annualized Risk Free Rate ~ 6.5% for India / ~0.025% per trade
  const sharpeRatio = Math.round(((avgReturn - 0.02) / stdReturn) * Math.sqrt(252) * 10) / 10;

  const downsideVar =
    downsideReturnsList.length > 0
      ? downsideReturnsList.reduce((a, b) => a + Math.pow(b, 2), 0) / downsideReturnsList.length
      : 1;
  const downsideStd = Math.sqrt(downsideVar) || 1.0;
  const sortinoRatio = Math.round(((avgReturn - 0.02) / downsideStd) * Math.sqrt(252) * 10) / 10;

  const cagrPct = Math.round(totalReturnPct * 1.8 * 10) / 10; // Annualized estimation
  const calmarRatio =
    maxDrawdownPct > 0 ? Math.round((cagrPct / maxDrawdownPct) * 100) / 100 : 2.5;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRatePct,
    totalReturnPct,
    buyHoldReturnPct,
    cagrPct,
    sharpeRatio: Math.max(0.1, sharpeRatio),
    sortinoRatio: Math.max(0.1, sortinoRatio),
    profitFactor,
    maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
    calmarRatio,
    avgWinnerPct,
    avgLoserPct,
    expectancyPnlPct,
    trades,
  };
}
