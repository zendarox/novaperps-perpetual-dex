import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, keccak256, toBytes, type Abi } from "viem";
import { MARKETS, getMarket } from "@novaperps/shared";
import { useNovaStore } from "../../store/novaStore";
import { ABI, ADDR, HAS_DEPLOY } from "../../lib/contracts";
import { useWallet } from "../../lib/wallet";

function mid(symbol: string): `0x${string}` {
  const fromDeploy = ADDR.markets?.[symbol];
  if (fromDeploy && fromDeploy !== "0x0000000000000000000000000000000000000000") {
    return fromDeploy as `0x${string}`;
  }
  return keccak256(toBytes(symbol));
}

export function TradePanel() {
  const marketSymbol = useNovaStore((s) => s.market);
  const setMarket = useNovaStore((s) => s.setMarket);
  const market = getMarket(marketSymbol);
  const { address, isConnected, publicClient, walletClient } = useWallet();

  const [side, setSide] = useState<"long" | "short">("long");
  const [size, setSize] = useState("0.1");
  const [leverage, setLeverage] = useState(10);
  const [depositAmt, setDepositAmt] = useState("10000");
  const [mark, setMark] = useState<number>(market.defaultPrice);
  const [collateral, setCollateral] = useState<string>("—");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posSize, setPosSize] = useState(0n);

  const marketBytes = useMemo(() => mid(market.symbol), [market.symbol]);

  useEffect(() => setMark(market.defaultPrice), [market.symbol, market.defaultPrice]);

  const refresh = useCallback(async () => {
    if (!HAS_DEPLOY) return;
    try {
      const markRaw = (await publicClient.readContract({
        address: ADDR.OracleRouter,
        abi: ABI.OracleRouter as Abi,
        functionName: "markPrice",
        args: [marketBytes],
      })) as bigint;
      setMark(Number(formatUnits(markRaw, 6)));
      if (address) {
        const av = (await publicClient.readContract({
          address: ADDR.ClearingHouse,
          abi: ABI.ClearingHouse as Abi,
          functionName: "accountView",
          args: [address],
        })) as { collateral: bigint };
        setCollateral(`${formatUnits(av.collateral, 6)} USDC`);
        const pos = (await publicClient.readContract({
          address: ADDR.ClearingHouse,
          abi: ABI.ClearingHouse as Abi,
          functionName: "getPosition",
          args: [address, marketBytes],
        })) as { size: bigint };
        setPosSize(pos.size);
      }
    } catch {
      /* chain down */
    }
  }, [address, marketBytes, publicClient]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => clearInterval(id);
  }, [refresh]);

  async function send(contract: `0x${string}`, abi: Abi, functionName: string, args: unknown[]) {
    if (!walletClient?.account) throw new Error("Connect wallet");
    setPending(true);
    setError(null);
    try {
      const hash = await walletClient.writeContract({
        address: contract,
        abi,
        functionName,
        args,
        account: walletClient.account,
        chain: walletClient.chain,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refresh();
    } catch (e) {
      setError((e as Error).message.slice(0, 180));
    } finally {
      setPending(false);
    }
  }

  const series = useMemo(() => seedSeries(mark), [mark]);

  return (
    <>
      <div className="hint">
        One command runs the console: <code>npm run server</code>. For on-chain trades also run{" "}
        <code>contracts:node</code> + <code>contracts:deploy</code>, then Mint → Approve → Deposit.
      </div>

      <div className="btn-row" style={{ marginBottom: "0.75rem" }}>
        {MARKETS.map((m) => (
          <button
            key={m.symbol}
            type="button"
            className={`tab ${m.symbol === market.symbol ? "active" : ""}`}
            onClick={() => setMarket(m.symbol)}
          >
            {m.symbol}
          </button>
        ))}
      </div>

      <div className="metrics">
        <div className="metric">
          <label>Mark</label>
          <div className="val">${mark.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="metric">
          <label>24h</label>
          <div className={`val ${market.change24h >= 0 ? "pos" : "neg"}`}>
            {market.change24h >= 0 ? "+" : ""}
            {market.change24h}%
          </div>
        </div>
        <div className="metric">
          <label>Funding 8h</label>
          <div className={`val ${market.funding8h >= 0 ? "pos" : "neg"}`}>
            {(market.funding8h * 100).toFixed(4)}%
          </div>
        </div>
        <div className="metric">
          <label>Collateral</label>
          <div className="val" style={{ fontSize: "0.95rem" }}>
            {collateral}
          </div>
        </div>
      </div>

      <div className="grid3">
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-head">
            <div>
              <h2>{market.symbol} chart</h2>
              <p>Oracle mark sparkline (local simulation)</p>
            </div>
          </div>
          <div className="chart-wrap">
            <Sparkline series={series} color={side === "long" ? "var(--green)" : "var(--red)"} />
            <div
              className="mono"
              style={{ position: "absolute", top: 12, left: 12, fontSize: 22, fontWeight: 700 }}
            >
              ${mark.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-head">
            <div>
              <h2>Order book</h2>
              <p>Synthetic depth around mark</p>
            </div>
          </div>
          <OrderBook mid={mark} />
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-head">
            <div>
              <h2>Ticket</h2>
              <p>ClearingHouse.openPosition</p>
            </div>
          </div>
          <div className="btn-row">
            <button type="button" className={`btn ${side === "long" ? "btn-long" : "btn-ghost"}`} onClick={() => setSide("long")}>
              Long
            </button>
            <button type="button" className={`btn ${side === "short" ? "btn-short" : "btn-ghost"}`} onClick={() => setSide("short")}>
              Short
            </button>
          </div>
          <label className="field">Size ({market.base})</label>
          <input className="mono" value={size} onChange={(e) => setSize(e.target.value)} />
          <label className="field">
            Leverage {leverage}x / max {market.maxLeverage}x
          </label>
          <input
            type="range"
            min={1}
            max={market.maxLeverage}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
          />
          {!HAS_DEPLOY && <div className="hint">Contracts not deployed — UI still browsable.</div>}
          {isConnected && HAS_DEPLOY && (
            <>
              <label className="field">Deposit USDC</label>
              <input className="mono" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} />
              <div className="btn-row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={pending || !address}
                  onClick={() =>
                    void send(ADDR.MockUSDC, ABI.MockUSDC as Abi, "mint", [
                      address!,
                      parseUnits(depositAmt || "0", 6),
                    ])
                  }
                >
                  Mint
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={pending}
                  onClick={() =>
                    void send(ADDR.MockUSDC, ABI.MockUSDC as Abi, "approve", [
                      ADDR.Vault,
                      parseUnits(depositAmt || "0", 6),
                    ])
                  }
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={pending}
                  onClick={() =>
                    void send(ADDR.ClearingHouse, ABI.ClearingHouse as Abi, "deposit", [
                      parseUnits(depositAmt || "0", 6),
                    ])
                  }
                >
                  Deposit
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            className={`btn ${side === "long" ? "btn-long" : "btn-short"}`}
            style={{ width: "100%", marginTop: "0.75rem" }}
            disabled={!isConnected || !HAS_DEPLOY || pending}
            onClick={() => {
              const sizeWei = parseUnits(size || "0", 18);
              const signed = side === "long" ? sizeWei : -sizeWei;
              void send(ADDR.ClearingHouse, ABI.ClearingHouse as Abi, "openPosition", [
                marketBytes,
                signed,
                0n,
              ]);
            }}
          >
            {!isConnected ? "Connect wallet" : pending ? "Submitting…" : `${side} ${market.symbol}`}
          </button>
          {posSize !== 0n && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={pending}
              onClick={() =>
                void send(ADDR.ClearingHouse, ABI.ClearingHouse as Abi, "closePosition", [marketBytes, 0n])
              }
            >
              Close position ({formatUnits(posSize, 18)})
            </button>
          )}
          {error && <p className="neg" style={{ fontSize: 12, marginTop: 8 }}>{error}</p>}
        </div>
      </div>
    </>
  );
}

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const d = series
    .map((v, i) => {
      const x = (i / Math.max(series.length - 1, 1)) * 100;
      const y = 36 - ((v - min) / span) * 32;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg width="100%" height="280" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path d={`${d} L 100 40 L 0 40 Z`} fill={color} opacity="0.15" />
      <path d={d} fill="none" stroke={color} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function OrderBook({ mid }: { mid: number }) {
  const asks = [];
  const bids = [];
  let tA = 0;
  let tB = 0;
  for (let i = 10; i >= 1; i--) {
    const price = mid * (1 + i * 0.00035);
    const size = 0.2 + ((i * 17) % 25) / 10;
    tA += size;
    asks.push({ price, size, total: tA, depth: Math.min(1, tA / 18) });
  }
  for (let i = 1; i <= 10; i++) {
    const price = mid * (1 - i * 0.00035);
    const size = 0.2 + ((i * 13) % 25) / 10;
    tB += size;
    bids.push({ price, size, total: tB, depth: Math.min(1, tB / 18) });
  }
  return (
    <div className="book">
      {asks.map((r) => (
        <div key={`a-${r.price}`} className="book-row">
          <span className="book-depth" style={{ width: `${r.depth * 100}%`, background: "var(--red)" }} />
          <span className="neg">{r.price.toFixed(2)}</span>
          <span style={{ textAlign: "right" }}>{r.size.toFixed(3)}</span>
          <span className="muted" style={{ textAlign: "right" }}>
            {r.total.toFixed(2)}
          </span>
        </div>
      ))}
      <div className="book-row" style={{ fontWeight: 700, color: "var(--cyan)", padding: "0.5rem" }}>
        {mid.toFixed(2)} mark
      </div>
      {bids.map((r) => (
        <div key={`b-${r.price}`} className="book-row">
          <span className="book-depth" style={{ width: `${r.depth * 100}%`, background: "var(--green)" }} />
          <span className="pos">{r.price.toFixed(2)}</span>
          <span style={{ textAlign: "right" }}>{r.size.toFixed(3)}</span>
          <span className="muted" style={{ textAlign: "right" }}>
            {r.total.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

function seedSeries(p: number) {
  const out: number[] = [];
  let v = p;
  for (let i = 0; i < 60; i++) {
    v = v + (Math.sin(i / 5) * p * 0.0008 + ((i * 7) % 5) - 2) * 0.15;
    out.push(v);
  }
  return out;
}
