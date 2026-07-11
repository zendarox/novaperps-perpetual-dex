export type Side = "long" | "short";

export function notionalUsd(sizeBase: number, markPrice: number): number {
  return Math.abs(sizeBase) * markPrice;
}

export function initialMargin(notional: number, imr = 0.02): number {
  return notional * imr;
}

export function liquidationPrice(params: {
  side: Side;
  entry: number;
  leverage: number;
  mmr?: number;
}): number {
  const mmr = params.mmr ?? 0.01;
  const lev = params.leverage;
  if (params.side === "long") {
    return params.entry * (1 - 1 / lev + mmr);
  }
  return params.entry * (1 + 1 / lev - mmr);
}
