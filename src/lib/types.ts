/**
 * Domain model for TOAD Intelligence.
 *
 * These types are the contract between the UI and the data layer. Nothing in
 * `src/components` should ever construct or import mock data directly — it
 * consumes these shapes from `solanaDataService` / `marketCapService`, which
 * today are backed by mocks and tomorrow by an RPC + indexer.
 */

/** The token this whole product is about. */
export interface TokenMeta {
  symbol: string;
  name: string;
  /** SPL mint address. */
  mint: string;
  decimals: number;
  totalSupply: number;
}

/* ------------------------------------------------------------------ */
/* Wallets                                                             */
/* ------------------------------------------------------------------ */

export type WalletBadge =
  | "mega-whale"
  | "whale"
  | "toad-og"
  | "top-10"
  | "fresh"
  | "exchange"
  | "smart-money";

export interface Wallet {
  /** Base58 Solana address. */
  address: string;
  /** Optional human label (exchange, known fund, ENS-like handle). */
  label?: string;
  /** 1-indexed rank by $TOAD balance, if the wallet is in the holder set. */
  holderRank?: number;
  badges: WalletBadge[];
  /** Unix ms of the wallet's first observed $TOAD transaction. */
  firstSeen: number;
  /** Unix ms of the most recent observed $TOAD transaction. */
  lastActive: number;
}

/** A wallet's position in a single SPL token. */
export interface TokenHolding {
  address: string;
  mint: string;
  /** UI amount (already decimal-adjusted). */
  amount: number;
  /** USD value of `amount` at the current price. */
  usdValue: number;
  /** Share of total supply, 0–100. */
  supplyPct: number;
  /** Percentage change in token balance over the last 24h. */
  change24hPct: number;
  /** Average USD cost per token across all buys. Null when never bought on-chain. */
  costBasisUsd: number | null;
}

/* ------------------------------------------------------------------ */
/* Trades & activity                                                   */
/* ------------------------------------------------------------------ */

export type TradeSide = "buy" | "sell";

/** A single swap involving $TOAD, normalised from a Solana transaction. */
export interface Trade {
  id: string;
  signature: string;
  wallet: string;
  side: TradeSide;
  /** $TOAD amount moved. */
  tokenAmount: number;
  /** USD notional at execution time. */
  usdValue: number;
  /** Execution price in USD per $TOAD. */
  priceUsd: number;
  timestamp: number;
  /** DEX / aggregator the swap routed through. */
  venue: "Raydium" | "Orca" | "Meteora" | "Jupiter" | "Pump.fun";
  /** Realised USD PnL booked by this trade (sells only). */
  realizedPnlUsd?: number;
}

/** A trade large enough to surface in the whale feed. */
export interface WhaleActivity extends Trade {
  /** Holder rank of the wallet at the time of the trade, if ranked. */
  walletRank?: number;
  badges: WalletBadge[];
  /** Wallet's remaining $TOAD balance after the trade. */
  balanceAfter: number;
  /** True when the wallet had no prior $TOAD history. */
  isNewPosition: boolean;
}

export type FlowRange = "1H" | "6H" | "24H" | "7D";

export interface WhaleFlowPoint {
  timestamp: number;
  buysUsd: number;
  sellsUsd: number;
  netUsd: number;
}

export interface AirdropCheckResult {
  wallet: string;
  airdropped: boolean;
  /** Amount of $TOAD observed in the Dune query rows. */
  amount: number;
  /** Whether the result is based on the live Dune query or demo fallback. */
  demo: boolean;
}

export interface WhaleStats24h {
  largeBuysUsd: number;
  largeBuyCount: number;
  largeSellsUsd: number;
  largeSellCount: number;
  netFlowUsd: number;
  /** Net flow change vs the previous 24h window, in percent. */
  netFlowChangePct: number;
}

/** Everything the dashboard hero-stats row needs, in one call. */
export interface DashboardSnapshot {
  whales24h: WhaleStats24h;
  topHolder: { wallet: Wallet; holding: TokenHolding };
  biggestBuy: WhaleActivity;
  biggestSell: WhaleActivity;
  price: PriceSnapshot;
}

/* ------------------------------------------------------------------ */
/* PnL & trader profiles                                               */
/* ------------------------------------------------------------------ */

export interface PnL {
  realizedUsd: number;
  unrealizedUsd: number;
  totalUsd: number;
  /** Return on invested capital, in percent. */
  roiPct: number;
  investedUsd: number;
}

export interface TraderMetrics {
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  /** buys / sells, capped for display when sells is 0. */
  buySellRatio: number;
  /** 0–100. */
  winRatePct: number;
  totalVolumeUsd: number;
  largestBuyUsd: number;
  largestSellUsd: number;
  bestTradeUsd: number;
  worstTradeUsd: number;
  /** Mean holding period in hours. */
  avgHoldHours: number;
  /** Longest holding period in hours. */
  maxHoldHours: number;
  /** Trades per active day. */
  tradesPerDay: number;
  /** Fraction of realised sells that were full exits, 0–1. */
  fullExitRate: number;
}

/** The five axes behind the personality radar. All 0–100. */
export interface PersonalityScores {
  conviction: number;
  risk: number;
  patience: number;
  activity: number;
  profitability: number;
}

export type PersonalityId =
  | "diamond-toad"
  | "paper-toad"
  | "whale-toad"
  | "sniper-toad"
  | "degen-toad"
  | "farmer-toad"
  | "swamp-lurker"
  | "tadpole";

export interface TraderPersonality {
  id: PersonalityId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  /** Second-person line used on the shareable card. */
  quote: string;
  /** Tailwind-friendly accent token used across cards and charts. */
  accent: "toad" | "ember" | "foam" | "lily" | "orchid";
  /** 0–100 confidence that this archetype fits the wallet. */
  confidence: number;
  /** Human-readable reasons the engine picked this archetype. */
  reasons: string[];
  /** Runner-up archetypes, most likely first. */
  alternates: Array<{ id: PersonalityId; name: string; emoji: string; score: number }>;
}

export interface TraderProfile {
  wallet: Wallet;
  holding: TokenHolding;
  pnl: PnL;
  metrics: TraderMetrics;
  scores: PersonalityScores;
  personality: TraderPersonality;
  trades: Trade[];
}

export type LeaderboardTab =
  | "top-pnl"
  | "best-win-rate"
  | "biggest-winners"
  | "biggest-losers"
  | "most-active";

export interface LeaderboardEntry {
  rank: number;
  wallet: Wallet;
  personality: Pick<TraderPersonality, "id" | "name" | "emoji" | "accent">;
  pnlUsd: number;
  winRatePct: number;
  trades: number;
  volumeUsd: number;
  bestTradeUsd: number;
  worstTradeUsd: number;
}

/* ------------------------------------------------------------------ */
/* Market cap journey                                                  */
/* ------------------------------------------------------------------ */

export interface PriceSnapshot {
  priceUsd: number;
  marketCapUsd: number;
  fdvUsd: number;
  volume24hUsd: number;
  change24hPct: number;
  holders: number;
  liquidityUsd: number;
  /** Unix ms the quote was taken. */
  updatedAt: number;
}

export interface MarketCapMilestone {
  id: string;
  emoji: string;
  label: string;
  /** Market cap target in USD. */
  target: number;
  /** Community flavour text. */
  flavor: string;
  /** What hitting this milestone means in practice. */
  meaning: string;
  /** Unix ms the milestone was first reached, or null. */
  reachedAt: number | null;
}

export interface JourneyState {
  marketCapUsd: number;
  milestones: MarketCapMilestone[];
  /** Index of the highest milestone already reached, -1 before the first. */
  currentIndex: number;
  /** The next unreached milestone, null once everything is cleared. */
  next: MarketCapMilestone | null;
  /** Progress from the last reached milestone to the next, 0–100. */
  progressPct: number;
  /** Multiple required to reach `next` from here. */
  multipleToNext: number;
}

/* ------------------------------------------------------------------ */
/* Service surface                                                     */
/* ------------------------------------------------------------------ */

export interface FeedQuery {
  side?: "all" | "buy" | "sell" | "top-holders";
  minUsd?: number;
  limit?: number;
  /** Only return activity newer than this unix ms. */
  since?: number;
}

/** Implemented by both the mock service and a future RPC-backed service. */
export interface ToadDataSource {
  readonly isDemo: boolean;
  getToken(): Promise<TokenMeta>;
  getDashboard(): Promise<DashboardSnapshot>;
  getWhaleActivity(query?: FeedQuery): Promise<WhaleActivity[]>;
  getWhaleFlow(range: FlowRange): Promise<{
    series: WhaleFlowPoint[];
    netUsd: number;
    buyCount: number;
    sellCount: number;
    uniqueWallets: number;
    buysUsd: number;
    sellsUsd: number;
  }>;

  getTopHolders(limit?: number): Promise<Array<{ wallet: Wallet; holding: TokenHolding }>>;
  getTraderProfile(address: string): Promise<TraderProfile | null>;
  getLeaderboard(tab: LeaderboardTab, limit?: number): Promise<LeaderboardEntry[]>;
  searchWallets(query: string): Promise<Wallet[]>;
  /**
   * Push new whale prints as they land. Backed by a simulator today; swap for a
   * Helius/Yellowstone websocket subscription later. Returns an unsubscribe fn.
   */
  subscribeWhaleActivity(handler: (activity: WhaleActivity) => void): () => void;
}

export interface MarketCapSource {
  readonly isDemo: boolean;
  getPrice(): Promise<PriceSnapshot>;
  getJourney(): Promise<JourneyState>;
}
