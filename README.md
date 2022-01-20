# NovaPerps

**On-chain perpetual futures DEX** — Zendarox-style monorepo (`packages/*`) + Hardhat-simulatable clearing contracts.

Not Next.js. The UI is a **Vite React console** (`packages/console`) served by `packages/api` via a single command.

---

## Quick start

```bash
# from 05-novaperps-perpetual-dex/
npm install
npm run server                  # build packages + serve → http://localhost:3004
```

Optional on-chain trading:

```bash
npm run contracts:install
npm run contracts:test
npm run contracts:node          # terminal A — :8545
npm run contracts:deploy        # terminal B — writes ABIs to packages/console/src/abi
# restart npm run server, connect MetaMask to Localhost 31337
```

---

## Package layout (like [zendarox-vault/packages](https://github.com/zendarox/zendarox-vault/tree/main/packages))

```text
packages/
  shared/     Protocol constants, markets, contract map
  console/    Vite + React TabShell UI (Trade · Markets · Portfolio · …)
  api/        Node HTTP — /health · /v1/* · static console dist
contracts/    Hardhat clearing house stack
scripts/server.mjs
```

---

## Console tabs

Trade · Markets · Portfolio · Vaults · Stats · Risk · Review

---

## Contracts

Vault · OracleRouter · PerpMarket · FundingRate · ClearingHouse · LiquidationEngine · InsuranceFund · MockUSDC

`npm run contracts:test` — Hardhat simulation harness.

---

## Risk notice

Perpetuals are high-risk. Evaluation software under BSL 1.1.
