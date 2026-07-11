"use client";

import { useEffect } from "react";
import { PROTOCOL } from "@novaperps/shared";
import { useNovaStore } from "../../store/novaStore";
import { useWallet, novaChain } from "../../lib/wallet";

export function TopBar() {
  const healthOk = useNovaStore((s) => s.healthOk);
  const { address, isConnected, chainId, connect, disconnect, switchToLocal } = useWallet();

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">N</div>
        <div>
          <h1>NovaPerps</h1>
          <p>Perps console · Vite package · clearing-backed</p>
        </div>
      </div>
      <div className="topbar__meta">
        <span className="version-chip">v{PROTOCOL.version}</span>
        <span className={`live ${healthOk ? "" : "live--warn"}`}>
          {healthOk ? "API live" : "Connecting…"}
        </span>
        {isConnected && chainId !== novaChain.id && (
          <button className="btn btn-ghost" onClick={() => void switchToLocal()}>
            Switch Local
          </button>
        )}
        {isConnected ? (
          <>
            <span className="version-chip mono">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
            <button className="btn btn-ghost" onClick={() => disconnect()}>
              Disconnect
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => void connect()}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}

export function BootHealth() {
  const setHealthOk = useNovaStore((s) => s.setHealthOk);
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/health");
        const j = (await r.json()) as { ok?: boolean };
        setHealthOk(!!j.ok);
      } catch {
        setHealthOk(false);
      }
    })();
  }, [setHealthOk]);
  return null;
}
