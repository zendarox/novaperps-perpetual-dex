import { useEffect, useState } from "react";
import { MARKETS } from "@novaperps/shared";

export function StatsView() {
  const [stats, setStats] = useState<{ volume24h: number; openInterest: number; insuranceFundUsd: number } | null>(
    null
  );
  useEffect(() => {
    void fetch("/v1/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() =>
        setStats({
          volume24h: MARKETS.reduce((a, m) => a + m.volume24h, 0),
          openInterest: MARKETS.reduce((a, m) => a + m.openInterest, 0),
          insuranceFundUsd: 1_800_000,
        })
      );
  }, []);

  return (
    <>
      <div className="metrics">
        <div className="metric">
          <label>24h volume</label>
          <div className="val">${stats ? (stats.volume24h / 1e6).toFixed(0) : "…"}M</div>
        </div>
        <div className="metric">
          <label>Open interest</label>
          <div className="val">${stats ? (stats.openInterest / 1e6).toFixed(0) : "…"}M</div>
        </div>
        <div className="metric">
          <label>Insurance</label>
          <div className="val">${stats ? (stats.insuranceFundUsd / 1e6).toFixed(1) : "…"}M</div>
        </div>
        <div className="metric">
          <label>Markets</label>
          <div className="val">{MARKETS.length}</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Architecture</h2>
            <p>Wallet → Console (viem) → ClearingHouse ← OracleRouter · Vault · Funding · LiquidationEngine</p>
          </div>
        </div>
      </div>
    </>
  );
}
