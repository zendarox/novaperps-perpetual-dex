export type OrderIntent = {
  market: string;
  side: "buy" | "sell";
  size: string;
  limitPrice: string;
  reduceOnly: boolean;
  nonce: string;
  deadline: number;
};

export async function fetchMarkets(baseUrl: string) {
  const res = await fetch(`${baseUrl}/v1/markets`);
  if (!res.ok) throw new Error(`markets ${res.status}`);
  return res.json();
}

export * from "../../math/src/index.ts";
