import { CONTRACT_MAP } from "@novaperps/shared";

export function RiskView() {
  const rows = [
    { p: "Initial margin", v: "200 bps (2%)", c: "ClearingHouse.imrBps" },
    { p: "Maintenance margin", v: "100 bps (1%)", c: "ClearingHouse.mmrBps" },
    { p: "Liq penalty", v: "50 bps", c: "ClearingHouse.liqPenaltyBps" },
    { p: "Max funding / interval", v: "0.1%", c: "FundingRate.MAX_RATE_1e18" },
    { p: "Oracle staleness", v: "3600s", c: "OracleRouter.maxStaleness" },
  ];
  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Risk parameters</h2>
            <p>On-chain IM / MM / funding caps for local simulation.</p>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Contract</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.p}>
                <td>{r.p}</td>
                <td className="mono">{r.v}</td>
                <td className="mono muted">{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Contract map</h2>
            <p>Same surface as /v1/review for senior SC review.</p>
          </div>
        </div>
        {CONTRACT_MAP.map((c) => (
          <div key={c.path} className="contract-row">
            <code>{c.path}</code>
            <p>{c.role}</p>
          </div>
        ))}
      </div>
    </>
  );
}
