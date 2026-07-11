import { create } from "zustand";
import type { MarketSymbol } from "@novaperps/shared";

export type TabId =
  | "trade"
  | "markets"
  | "portfolio"
  | "vaults"
  | "stats"
  | "risk"
  | "review";

type NovaState = {
  tab: TabId;
  market: MarketSymbol;
  healthOk: boolean | null;
  setTab: (t: TabId) => void;
  setMarket: (m: MarketSymbol) => void;
  setHealthOk: (ok: boolean) => void;
};

export const useNovaStore = create<NovaState>((set) => ({
  tab: "trade",
  market: "BTC-PERP",
  healthOk: null,
  setTab: (tab) => set({ tab }),
  setMarket: (market) => set({ market, tab: "trade" }),
  setHealthOk: (healthOk) => set({ healthOk }),
}));
