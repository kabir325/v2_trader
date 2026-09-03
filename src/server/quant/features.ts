import { HistoricalCandleData } from "../../types.js";

export interface FeatureVector {
  timestamp: string;
  ticker: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;

  // Price Features
  candleBodyPct: number;
  upperWickPct: number;
  lowerWickPct: number;
  gapPct: number;
  return1: number;
  return3: number;
  return5: number;
  return10: number;

  // Trend
  ema9: number;
  ema20: number;
  ema50: number;
  ema100: number;
  sma20: number;
  sma50: number;
  ema20_50_dist: number;

  // Momentum
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  stochRsi: number;
  roc: number;
  momentum: number;

  // Volatility
  atr14: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  bollingerWidthPct: number;
  historicalVol20: number;

  // Volume
  volumeRatio: number;
  obvSlope: number;
  vwap: number;
  vwapDistPct: number;
  mfi: number;

  // Trend Strength
  adx14: number;
  plusDI: number;
  minusDI: number;

  // Market Context & Time
  niftyTrendSlope: number;
  timeOfDayMinutes: number;
  dayOfWeek: number;
}

export function computeFeatureDataset(
  candles: HistoricalCandleData[],
  ticker: string = "NIFTY 50"
): FeatureVector[] {
  if (candles.length < 30) return [];

  const features: FeatureVector[] = [];

  // Helper arrays
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume || 1000);

  // Compute EMAs
  const ema9Arr = calculateEMA(closes, 9);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema100Arr = calculateEMA(closes, 100);
  const sma20Arr = calculateSMA(closes, 20);
  const sma50Arr = calculateSMA(closes, 50);

  // Compute RSI 14
  const rsiArr = calculateRSI(closes, 14);

  // Compute MACD (12, 26, 9)
  const macdData = calculateMACD(closes, 12, 26, 9);

  // Compute ATR 14
  const atrArr = calculateATR(highs, lows, closes, 14);

  // Compute Bollinger Bands (20, 2)
  const bollingerData = calculateBollinger(closes, 20, 2);

  // Compute VWAP
  const vwapArr = calculateVWAP(candles);

  // Compute ADX & DI
  const adxData = calculateADX(highs, lows, closes, 14);

  for (let i = 25; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const range = Math.max(0.01, c.high - c.low);
    const body = Math.abs(c.close - c.open);
    const candleBodyPct = (body / range) * 100;
    const upperWickPct = ((c.high - Math.max(c.open, c.close)) / range) * 100;
    const lowerWickPct = ((Math.min(c.open, c.close) - c.low) / range) * 100;
    const gapPct = prevC ? ((c.open - prevC.close) / prevC.close) * 100 : 0;

    const return1 = prevC ? ((c.close - prevC.close) / prevC.close) * 100 : 0;
    const return3 = i >= 3 ? ((c.close - candles[i - 3].close) / candles[i - 3].close) * 100 : 0;
    const return5 = i >= 5 ? ((c.close - candles[i - 5].close) / candles[i - 5].close) * 100 : 0;
    const return10 = i >= 10 ? ((c.close - candles[i - 10].close) / candles[i - 10].close) * 100 : 0;

    // Volume Ratio
    const volSlice = volumes.slice(Math.max(0, i - 20), i);
    const avgVol = volSlice.reduce((a, b) => a + b, 0) / Math.max(1, volSlice.length);
    const volumeRatio = c.volume ? c.volume / Math.max(1, avgVol) : 1.0;

    // OBV Slope
    const obvSlope = calculateOBVSlope(candles.slice(Math.max(0, i - 10), i + 1));

    // VWAP Dist
    const curVwap = vwapArr[i] || c.close;
    const vwapDistPct = ((c.close - curVwap) / curVwap) * 100;

    // Stoch RSI
    const stochRsi = calculateStochRSI(rsiArr.slice(Math.max(0, i - 14), i + 1));

    // ROC & Momentum
    const roc = i >= 10 ? ((c.close - candles[i - 10].close) / candles[i - 10].close) * 100 : 0;
    const momentum = i >= 5 ? c.close - candles[i - 5].close : 0;

    // Historical Volatility 20
    const histVol20 = calculateHistVol(closes.slice(Math.max(0, i - 20), i + 1));

    // MFI
    const mfi = calculateMFI(candles.slice(Math.max(0, i - 14), i + 1));

    // Parse Time
    const dt = new Date(c.time || Date.now());
    const timeOfDayMinutes = dt.getHours() * 60 + dt.getMinutes();
    const dayOfWeek = dt.getDay();

    // Nifty Trend Slope (EMA20 - EMA50 / EMA50)
    const ema20_50_dist = ((ema20Arr[i] - ema50Arr[i]) / ema50Arr[i]) * 100;
    const niftyTrendSlope = return5 * 0.6 + return10 * 0.4;

    features.push({
      timestamp: c.time || new Date().toISOString(),
      ticker,
      close: c.close,
      open: c.open,
      high: c.high,
      low: c.low,
      volume: c.volume || 1000,

      candleBodyPct: Math.round(candleBodyPct * 100) / 100,
      upperWickPct: Math.round(upperWickPct * 100) / 100,
      lowerWickPct: Math.round(lowerWickPct * 100) / 100,
      gapPct: Math.round(gapPct * 100) / 100,
      return1: Math.round(return1 * 100) / 100,
      return3: Math.round(return3 * 100) / 100,
      return5: Math.round(return5 * 100) / 100,
      return10: Math.round(return10 * 100) / 100,

      ema9: Math.round(ema9Arr[i] * 100) / 100,
      ema20: Math.round(ema20Arr[i] * 100) / 100,
      ema50: Math.round(ema50Arr[i] * 100) / 100,
      ema100: Math.round(ema100Arr[i] * 100) / 100,
      sma20: Math.round(sma20Arr[i] * 100) / 100,
      sma50: Math.round(sma50Arr[i] * 100) / 100,
      ema20_50_dist: Math.round(ema20_50_dist * 100) / 100,

      rsi14: Math.round(rsiArr[i] * 100) / 100,
      macd: Math.round(macdData.macd[i] * 100) / 100,
      macdSignal: Math.round(macdData.signal[i] * 100) / 100,
      macdHist: Math.round(macdData.hist[i] * 100) / 100,
      stochRsi: Math.round(stochRsi * 100) / 100,
      roc: Math.round(roc * 100) / 100,
      momentum: Math.round(momentum * 100) / 100,

      atr14: Math.round(atrArr[i] * 100) / 100,
      bollingerUpper: Math.round(bollingerData.upper[i] * 100) / 100,
      bollingerMiddle: Math.round(bollingerData.middle[i] * 100) / 100,
      bollingerLower: Math.round(bollingerData.lower[i] * 100) / 100,
      bollingerWidthPct: Math.round(bollingerData.width[i] * 100) / 100,
      historicalVol20: Math.round(histVol20 * 100) / 100,

      volumeRatio: Math.round(volumeRatio * 100) / 100,
      obvSlope: Math.round(obvSlope * 100) / 100,
      vwap: Math.round(curVwap * 100) / 100,
      vwapDistPct: Math.round(vwapDistPct * 100) / 100,
      mfi: Math.round(mfi * 100) / 100,

      adx14: Math.round(adxData.adx[i] * 100) / 100,
      plusDI: Math.round(adxData.plusDI[i] * 100) / 100,
      minusDI: Math.round(adxData.minusDI[i] * 100) / 100,

      niftyTrendSlope: Math.round(niftyTrendSlope * 100) / 100,
      timeOfDayMinutes,
      dayOfWeek,
    });
  }

  return features;
}

// Indicator Helpers
function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(data[0] || 0);
  const k = 2 / (period + 1);
  for (let i = 1; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(0);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result[i] = data[i];
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result[i] = sum / period;
    }
  }
  return result;
}

function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period && i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }
  return rsi;
}

function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  const fastEma = calculateEMA(closes, fast);
  const slowEma = calculateEMA(closes, slow);
  const macdLine = fastEma.map((f, idx) => f - slowEma[idx]);
  const signalLine = calculateEMA(macdLine, signal);
  const hist = macdLine.map((m, idx) => m - signalLine[idx]);
  return { macd: macdLine, signal: signalLine, hist };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
    } else {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  return calculateEMA(tr, period);
}

function calculateBollinger(closes: number[], period = 20, stdDevMult = 2) {
  const sma = calculateSMA(closes, period);
  const upper = new Array(closes.length).fill(0);
  const lower = new Array(closes.length).fill(0);
  const width = new Array(closes.length).fill(0);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper[i] = closes[i];
      lower[i] = closes[i];
      width[i] = 0;
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper[i] = mean + std * stdDevMult;
      lower[i] = mean - std * stdDevMult;
      width[i] = mean > 0 ? ((upper[i] - lower[i]) / mean) * 100 : 0;
    }
  }
  return { upper, lower, middle: sma, width };
}

function calculateVWAP(candles: HistoricalCandleData[]): number[] {
  const vwap: number[] = [];
  let cumVol = 0;
  let cumVolPrice = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1000;
    cumVolPrice += typicalPrice * vol;
    cumVol += vol;
    vwap.push(cumVol > 0 ? cumVolPrice / cumVol : c.close);
  }
  return vwap;
}

function calculateADX(highs: number[], lows: number[], closes: number[], period = 14) {
  const adx = new Array(closes.length).fill(20);
  const plusDI = new Array(closes.length).fill(25);
  const minusDI = new Array(closes.length).fill(20);

  for (let i = 1; i < closes.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );

    if (tr > 0) {
      plusDI[i] = Math.min(100, Math.max(0, (plusDM / tr) * 100));
      minusDI[i] = Math.min(100, Math.max(0, (minusDM / tr) * 100));
      const diDiff = Math.abs(plusDI[i] - minusDI[i]);
      const diSum = Math.max(1, plusDI[i] + minusDI[i]);
      const dx = (diDiff / diSum) * 100;
      adx[i] = Math.round((adx[i - 1] * (period - 1) + dx) / period);
    }
  }

  return { adx, plusDI, minusDI };
}

function calculateOBVSlope(slice: HistoricalCandleData[]): number {
  if (slice.length < 2) return 0;
  let obv = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i].close - slice[i - 1].close;
    const v = slice[i].volume || 1000;
    if (diff > 0) obv += v;
    else if (diff < 0) obv -= v;
  }
  return obv / 1000;
}

function calculateStochRSI(rsiSlice: number[]): number {
  if (rsiSlice.length < 5) return 50;
  const minRsi = Math.min(...rsiSlice);
  const maxRsi = Math.max(...rsiSlice);
  const cur = rsiSlice[rsiSlice.length - 1];
  if (maxRsi === minRsi) return 50;
  return ((cur - minRsi) / (maxRsi - minRsi)) * 100;
}

function calculateHistVol(closeSlice: number[]): number {
  if (closeSlice.length < 3) return 15;
  const returns = [];
  for (let i = 1; i < closeSlice.length; i++) {
    returns.push((closeSlice[i] - closeSlice[i - 1]) / closeSlice[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const varSum = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(varSum) * Math.sqrt(252) * 100; // Annualized
}

function calculateMFI(slice: HistoricalCandleData[]): number {
  if (slice.length < 2) return 50;
  let posFlow = 0;
  let negFlow = 0;
  for (let i = 1; i < slice.length; i++) {
    const tp1 = (slice[i - 1].high + slice[i - 1].low + slice[i - 1].close) / 3;
    const tp2 = (slice[i].high + slice[i].low + slice[i].close) / 3;
    const rawMoney = tp2 * (slice[i].volume || 1000);
    if (tp2 > tp1) posFlow += rawMoney;
    else if (tp2 < tp1) negFlow += rawMoney;
  }
  if (negFlow === 0) return 100;
  const mfr = posFlow / negFlow;
  return 100 - 100 / (1 + mfr);
}
