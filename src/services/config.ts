/**
 * Runtime data-source configuration.
 *
 * The app runs on mock data until every variable a real integration needs is
 * present. That single check drives the "Demo Data" indicator in the UI — there
 * is no way to show live-looking data without also flipping that badge off.
 */

export interface DataLayerConfig {
  /** Solana RPC endpoint (Helius, Triton, QuickNode, …). */
  rpcUrl?: string;
  /** Indexer base URL that serves parsed swaps/holders for the mint. */
  indexerUrl?: string;
  /** Price/market-cap API base (Birdeye, CoinGecko, DexScreener, …). */
  priceApiUrl?: string;
  /** $TOAD mint address. */
  mint?: string;
  /** Dune query auth for leaderboard / airdrop lookup. */
  duneApiKey?: string;
  /** Dune query ID for TOAD transfers / airdrop data. */
  duneQueryId?: string;
}

export const dataLayerConfig: DataLayerConfig = {
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  indexerUrl: process.env.NEXT_PUBLIC_TOAD_INDEXER_URL,
  priceApiUrl: process.env.NEXT_PUBLIC_PRICE_API_URL,
  mint: process.env.NEXT_PUBLIC_TOAD_MINT,
  duneApiKey: process.env.DUNE_API_KEY,
  duneQueryId: process.env.NEXT_PUBLIC_TOAD_DUNE_QUERY_ID,
};

/** On-chain activity requires an RPC + indexer + mint. */
export const hasChainCredentials = Boolean(
  dataLayerConfig.rpcUrl && dataLayerConfig.indexerUrl && dataLayerConfig.mint
);

/** RPC-only live token holder data for the mint. */
export const hasRpcCredentials = Boolean(dataLayerConfig.rpcUrl && dataLayerConfig.mint);

/** Market cap requires a price API + mint. */
export const hasPriceCredentials = Boolean(dataLayerConfig.priceApiUrl && dataLayerConfig.mint);

/** Dune-powered leaderboard, trader profiles, and airdrop checks. */
export const hasDuneCredentials = Boolean(dataLayerConfig.duneApiKey && dataLayerConfig.duneQueryId);
export const hasLeaderboardCredentials = hasDuneCredentials;

/** True whenever any part of the UI is showing generated data. */
export const isDemoMode = !hasChainCredentials || !hasPriceCredentials || !hasDuneCredentials;

/** Simulated network latency for the mock services, in ms. */
export const MOCK_LATENCY = { min: 260, max: 620 };

export function mockDelay(min = MOCK_LATENCY.min, max = MOCK_LATENCY.max): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
