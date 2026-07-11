# Risk parameters

| Param | Default | Notes |
|-------|---------|-------|
| IMR | 2% | Initial margin ratio |
| MMR | 1% | Maintenance margin ratio |
| Max funding | 0.4%/hr | Cap per market |
| OI cap | per-market | Enforced in PerpMarket |
| Oracle stale | 60s | Reject opens if heartbeat exceeded |

## Liquidation waterfall

1. Partial close to restore MMR + buffer  
2. Penalty to insurance fund / keeper  
3. Residual bad debt socialized via InsuranceFund  
