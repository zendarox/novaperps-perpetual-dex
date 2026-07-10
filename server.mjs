/**
 * Compatibility shim — prefer `npm run server` (scripts/server.mjs).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const child = spawn(process.execPath, [join(root, "scripts/server.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 0));
