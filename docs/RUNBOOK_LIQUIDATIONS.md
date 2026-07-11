# Liquidation runbook

1. Monitor `MarginRatio` via indexer  
2. Keeper calls `LiquidationEngine.liquidate`  
3. Verify event `Liquidated` and account health  
4. If insurance drawdown > threshold, pause new leverage  
