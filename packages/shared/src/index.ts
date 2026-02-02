export const PROTOCOL = {
  name: "NovaPerps",
  version: "4.2.0",
  stage: "internal QA",
  settlement: "L2 / local Hardhat 31337",
} as const;

export const MARKETS = [
  {
    symbol: "BTC-PERP",
    base: "BTC",
    maxLeverage: 50,
    defaultPrice: 65000,
    change24h: 1.82,
    volume24h: 412_000_000,
    openInterest: 186_000_000,
    funding8h: 0.0124,
  },
  {
    symbol: "ETH-PERP",
    base: "ETH",
    maxLeverage: 50,
    defaultPrice: 3500,
    change24h: -0.64,
    volume24h: 228_000_000,
    openInterest: 94_000_000,
    funding8h: 0.0081,
  },
  {
    symbol: "SOL-PERP",
    base: "SOL",
    maxLeverage: 25,
    defaultPrice: 145,
    change24h: 3.41,
    volume24h: 87_000_000,
    openInterest: 41_000_000,
    funding8h: -0.0042,
  },
  {
    symbol: "ARB-PERP",
    base: "ARB",
    maxLeverage: 20,
    defaultPrice: 1.2,
    change24h: -1.12,
    volume24h: 19_000_000,
    openInterest: 8_400_000,
    funding8h: 0.0015,
  },
] as const;

export type MarketSymbol = (typeof MARKETS)[number]["symbol"];

export function getMarket(symbol: string) {
  return MARKETS.find((m) => m.symbol === symbol) ?? MARKETS[0];
}

export const CONTRACT_MAP = [
  { path: "contracts/src/ClearingHouse.sol", role: "Cross-margin clearing · open/close · equity" },
  { path: "contracts/src/Vault.sol", role: "USDC collateral custody" },
  { path: "contracts/src/OracleRouter.sol", role: "Mark / index feeds · staleness" },
  { path: "contracts/src/PerpMarket.sol", role: "Listing · fees · OI caps" },
  { path: "contracts/src/FundingRate.sol", role: "Premium → capped funding index" },
  { path: "contracts/src/LiquidationEngine.sol", role: "Permissionless liquidations" },
  { path: "contracts/src/InsuranceFund.sol", role: "Bad-debt backstop" },
  { path: "contracts/test/ClearingHouse.test.cjs", role: "Local Hardhat simulation harness" },
] as const;

export const READING_ORDER = [
  { file: "README.md", reason: "Product + local run path" },
  { file: "contracts/src/ClearingHouse.sol", reason: "Margin & position accounting" },
  { file: "packages/console/src/components/trade/TradePanel.tsx", reason: "FE ↔ contract wiring" },
  { file: "packages/api/src/server.ts", reason: "How npm run server serves the console" },
  { file: "docs/RISK.md", reason: "Parameter / liquidation notes" },
] as const;
