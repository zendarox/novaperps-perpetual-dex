export declare const PROTOCOL: {
    readonly name: "NovaPerps";
    readonly version: "4.2.0";
    readonly stage: "internal QA";
    readonly settlement: "L2 / local Hardhat 31337";
};
export declare const MARKETS: readonly [{
    readonly symbol: "BTC-PERP";
    readonly base: "BTC";
    readonly maxLeverage: 50;
    readonly defaultPrice: 65000;
    readonly change24h: 1.82;
    readonly volume24h: 412000000;
    readonly openInterest: 186000000;
    readonly funding8h: 0.0124;
}, {
    readonly symbol: "ETH-PERP";
    readonly base: "ETH";
    readonly maxLeverage: 50;
    readonly defaultPrice: 3500;
    readonly change24h: -0.64;
    readonly volume24h: 228000000;
    readonly openInterest: 94000000;
    readonly funding8h: 0.0081;
}, {
    readonly symbol: "SOL-PERP";
    readonly base: "SOL";
    readonly maxLeverage: 25;
    readonly defaultPrice: 145;
    readonly change24h: 3.41;
    readonly volume24h: 87000000;
    readonly openInterest: 41000000;
    readonly funding8h: -0.0042;
}, {
    readonly symbol: "ARB-PERP";
    readonly base: "ARB";
    readonly maxLeverage: 20;
    readonly defaultPrice: 1.2;
    readonly change24h: -1.12;
    readonly volume24h: 19000000;
    readonly openInterest: 8400000;
    readonly funding8h: 0.0015;
}];
export type MarketSymbol = (typeof MARKETS)[number]["symbol"];
export declare function getMarket(symbol: string): {
    readonly symbol: "BTC-PERP";
    readonly base: "BTC";
    readonly maxLeverage: 50;
    readonly defaultPrice: 65000;
    readonly change24h: 1.82;
    readonly volume24h: 412000000;
    readonly openInterest: 186000000;
    readonly funding8h: 0.0124;
} | {
    readonly symbol: "ETH-PERP";
    readonly base: "ETH";
    readonly maxLeverage: 50;
    readonly defaultPrice: 3500;
    readonly change24h: -0.64;
    readonly volume24h: 228000000;
    readonly openInterest: 94000000;
    readonly funding8h: 0.0081;
} | {
    readonly symbol: "SOL-PERP";
    readonly base: "SOL";
    readonly maxLeverage: 25;
    readonly defaultPrice: 145;
    readonly change24h: 3.41;
    readonly volume24h: 87000000;
    readonly openInterest: 41000000;
    readonly funding8h: -0.0042;
} | {
    readonly symbol: "ARB-PERP";
    readonly base: "ARB";
    readonly maxLeverage: 20;
    readonly defaultPrice: 1.2;
    readonly change24h: -1.12;
    readonly volume24h: 19000000;
    readonly openInterest: 8400000;
    readonly funding8h: 0.0015;
};
export declare const CONTRACT_MAP: readonly [{
    readonly path: "contracts/src/ClearingHouse.sol";
    readonly role: "Cross-margin clearing · open/close · equity";
}, {
    readonly path: "contracts/src/Vault.sol";
    readonly role: "USDC collateral custody";
}, {
    readonly path: "contracts/src/OracleRouter.sol";
    readonly role: "Mark / index feeds · staleness";
}, {
    readonly path: "contracts/src/PerpMarket.sol";
    readonly role: "Listing · fees · OI caps";
}, {
    readonly path: "contracts/src/FundingRate.sol";
    readonly role: "Premium → capped funding index";
}, {
    readonly path: "contracts/src/LiquidationEngine.sol";
    readonly role: "Permissionless liquidations";
}, {
    readonly path: "contracts/src/InsuranceFund.sol";
    readonly role: "Bad-debt backstop";
}, {
    readonly path: "contracts/test/ClearingHouse.test.cjs";
    readonly role: "Local Hardhat simulation harness";
}];
export declare const READING_ORDER: readonly [{
    readonly file: "README.md";
    readonly reason: "Product + local run path";
}, {
    readonly file: "contracts/src/ClearingHouse.sol";
    readonly reason: "Margin & position accounting";
}, {
    readonly file: "packages/console/src/components/trade/TradePanel.tsx";
    readonly reason: "FE ↔ contract wiring";
}, {
    readonly file: "packages/api/src/server.ts";
    readonly reason: "How npm run server serves the console";
}, {
    readonly file: "docs/RISK.md";
    readonly reason: "Parameter / liquidation notes";
}];
//# sourceMappingURL=index.d.ts.map