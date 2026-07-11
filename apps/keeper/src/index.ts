/**
 * Keeper entry — funding settle + liquidation scan loop (production wires RPC + wallets).
 */
export async function tick(baseUrl: string) {
  const markets = await fetch(`${baseUrl}/v1/markets`).then((r) => r.json());
  return { scanned: markets.markets?.length ?? 0, at: Date.now() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  tick(process.env.NOVA_API ?? "http://localhost:3004").then(console.log);
}
