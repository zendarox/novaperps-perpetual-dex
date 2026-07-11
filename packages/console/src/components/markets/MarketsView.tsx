import { MARKETS } from "@novaperps/shared";
import { useNovaStore } from "../../store/novaStore";

export function MarketsView() {
  const setMarket = useNovaStore((s) => s.setMarket);
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>Markets</h2>
          <p>Listed perpetuals on NovaPerps clearing.</p>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Mark</th>
            <th>24h</th>
            <th>Volume</th>
            <th>OI</th>
            <th>Funding</th>
            <th>Lev</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {MARKETS.map((m) => (
            <tr key={m.symbol}>
              <td>{m.symbol}</td>
              <td className="mono">${m.defaultPrice.toLocaleString()}</td>
              <td className={`mono ${m.change24h >= 0 ? "pos" : "neg"}`}>
                {m.change24h >= 0 ? "+" : ""}
                {m.change24h}%
              </td>
              <td className="mono">${(m.volume24h / 1e6).toFixed(1)}M</td>
              <td className="mono">${(m.openInterest / 1e6).toFixed(1)}M</td>
              <td className={`mono ${m.funding8h >= 0 ? "pos" : "neg"}`}>
                {(m.funding8h * 100).toFixed(4)}%
              </td>
              <td>{m.maxLeverage}x</td>
              <td>
                <button type="button" className="btn btn-primary" onClick={() => setMarket(m.symbol)}>
                  Trade
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
