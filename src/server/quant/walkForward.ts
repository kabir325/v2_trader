import { LabeledSample } from "./labeling.js";

export interface WalkForwardSplit {
  train: LabeledSample[];
  validation: LabeledSample[];
  test: LabeledSample[];
  trainPeriod: { start: string; end: string; count: number };
  valPeriod: { start: string; end: string; count: number };
  testPeriod: { start: string; end: string; count: number };
}

/**
 * Perform chronological time-series splitting for walk-forward validation.
 * No shuffling to prevent lookahead bias!
 */
export function performWalkForwardSplit(
  dataset: LabeledSample[],
  trainRatio = 0.6,
  valRatio = 0.2
): WalkForwardSplit {
  if (dataset.length === 0) {
    const emptyPeriod = { start: "N/A", end: "N/A", count: 0 };
    return {
      train: [],
      validation: [],
      test: [],
      trainPeriod: emptyPeriod,
      valPeriod: emptyPeriod,
      testPeriod: emptyPeriod,
    };
  }

  // Sort strictly by timestamp ascending
  const sorted = [...dataset].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const total = sorted.length;
  const trainEndIdx = Math.floor(total * trainRatio);
  const valEndIdx = Math.floor(total * (trainRatio + valRatio));

  const train = sorted.slice(0, trainEndIdx);
  const validation = sorted.slice(trainEndIdx, valEndIdx);
  const test = sorted.slice(valEndIdx);

  const formatPeriod = (arr: LabeledSample[]) => {
    if (arr.length === 0) return { start: "N/A", end: "N/A", count: 0 };
    return {
      start: arr[0].timestamp,
      end: arr[arr.length - 1].timestamp,
      count: arr.length,
    };
  };

  return {
    train,
    validation,
    test,
    trainPeriod: formatPeriod(train),
    valPeriod: formatPeriod(validation),
    testPeriod: formatPeriod(test),
  };
}
