#!/usr/bin/env node
/**
 * NovaPerps — one command: build packages + serve console.
 * Usage: npm run server
 */
import { spawn, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function step(label) {
  console.log(`\n ▸ ${label}\n`);
}

function runSync(args) {
  const r = spawnSync(npm, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log(`
 ╔══════════════════════════════════════════════════════════╗
 ║  NOVAPERPS — Perpetual Futures Protocol Lab              ║
 ╠══════════════════════════════════════════════════════════╣
 ║  Contracts · Shared · Console UI · API                   ║
 ╚══════════════════════════════════════════════════════════╝
`);

// step("Building packages (shared → console → api)");
// runSync(["run", "build", "-w", "@novaperps/shared"]);
// runSync(["run", "build", "-w", "@novaperps/console"]);
// runSync(["run", "build", "-w", "@novaperps/api"]);

// step("Starting API + console");
// console.log(`
//  ┌──────────────────────────────────────────────────────────┐
//  │  Dashboard → http://localhost:${process.env.PORT ?? 3004}
//  │  Tabs: Trade · Markets · Portfolio · Vaults · Stats …    │
//  │  Stop: Ctrl+C                                            │
//  └──────────────────────────────────────────────────────────┘
// `);

const child = spawn(process.execPath, [join(root, "packages/api/dist/server.js")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
