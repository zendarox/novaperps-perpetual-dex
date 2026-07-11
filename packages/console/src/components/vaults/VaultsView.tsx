export function VaultsView() {
  const vaults = [
    { name: "USDC Clearing Vault", apy: "6.2%", tvl: "$18.4M", risk: "Core" },
    { name: "Insurance Junior", apy: "14.8%", tvl: "$3.1M", risk: "Junior" },
    { name: "Maker Rebate Pool", apy: "4.1%", tvl: "$3.1M", risk: "MM" },
  ];
  return (
    <div className="grid2">
      {vaults.map((v) => (
        <div key={v.name} className="panel">
          <div className="panel-head">
            <div>
              <h2>{v.name}</h2>
              <p>TVL {v.tvl} · {v.risk}</p>
            </div>
            <span className="version-chip">{v.apy} APY</span>
          </div>
          <button type="button" className="btn btn-primary">
            Deposit
          </button>
        </div>
      ))}
    </div>
  );
}
