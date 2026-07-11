import { useEffect, useState } from "react";
import { formatUnits, type Abi } from "viem";
import { ABI, ADDR, HAS_DEPLOY } from "../../lib/contracts";
import { useWallet } from "../../lib/wallet";

export function PortfolioView() {
  const { address, isConnected, publicClient } = useWallet();
  const [av, setAv] = useState<{
    collateral: bigint;
    unrealizedPnl: bigint;
    equity: bigint;
    usedMargin: bigint;
  } | null>(null);

  useEffect(() => {
    if (!HAS_DEPLOY || !address) {
      setAv(null);
      return;
    }
    void publicClient
      .readContract({
        address: ADDR.ClearingHouse,
        abi: ABI.ClearingHouse as Abi,
        functionName: "accountView",
        args: [address],
      })
      .then((d) => setAv(d as typeof av))
      .catch(() => setAv(null));
  }, [address, publicClient]);

  return (
    <>
      <div className="metrics">
        <div className="metric">
          <label>Collateral</label>
          <div className="val">
            {av ? Number(formatUnits(av.collateral, 6)).toLocaleString() : isConnected ? "—" : "Connect"}
          </div>
        </div>
        <div className="metric">
          <label>Equity</label>
          <div className="val">{av ? Number(formatUnits(av.equity, 6)).toLocaleString() : "—"}</div>
        </div>
        <div className="metric">
          <label>uPnL</label>
          <div className={`val ${av && av.unrealizedPnl >= 0n ? "pos" : "neg"}`}>
            {av ? Number(formatUnits(av.unrealizedPnl, 6)).toFixed(2) : "—"}
          </div>
        </div>
        <div className="metric">
          <label>Used margin</label>
          <div className="val">{av ? Number(formatUnits(av.usedMargin, 6)).toLocaleString() : "—"}</div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Cross-margin account</h2>
            <p>
              Single ClearingHouse account shares collateral across BTC/ETH/SOL/ARB. Maintenance margin is checked
              portfolio-wide before liquidations.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
