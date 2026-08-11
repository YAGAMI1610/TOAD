/**
 * Deterministic mock blockchain data for $TOAD.
 *
 * IMPORTANT: this file is fake data. It is deliberately kept separate from
 * `solanaDataService.ts` / `marketCapService.ts` so it can be deleted wholesale
 * once a real RPC + indexer is wired up. Nothing here should be imported by a
 * component — go through the services.
 *
 * Everything is generated from a fixed seed so the numbers are stable across
 * reloads (and identical on server and client), while timestamps are anchored
 * to "now" at module init so the feed always looks live.
 */

import type {
  LeaderboardEntry,
  MarketCapMilestone,
  PriceSnapshot,
  TokenMeta,
  Trade,
  Wallet,
  WalletBadge,
  WhaleActivity,
} from "./types";
import { buildTraderProfile } from "./personality";
import type { TraderProfile } from "./types";

/* ------------------------------------------------------------------ */
/* Seeded RNG (mulberry32) — same seed, same swamp, every time.        */
/* ------------------------------------------------------------------ */

export function createRng(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash so any wallet address maps to a repeatable persona. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pick = <T,>(rng: () => number, list: readonly T[]): T => list[Math.floor(rng() * list.length) % list.length];
const between = (rng: () => number, min: number, max: number) => min + rng() * (max - min);
const intBetween = (rng: () => number, min: number, max: number) => Math.floor(between(rng, min, max + 1));

/** Skews toward the low end — most trades are small, a few are enormous. */
const powerLaw = (rng: () => number, min: number, max: number, exponent = 2.6) =>
  min + (max - min) * Math.pow(rng(), exponent);

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function makeAddress(rng: () => number, length = 44): string {
  let out = "";
  for (let i = 0; i < length; i++) out += BASE58_ALPHABET[Math.floor(rng() * BASE58_ALPHABET.length)];
  return out;
}

function makeSignature(rng: () => number): string {
  let out = "";
  for (let i = 0; i < 88; i++) out += BASE58_ALPHABET[Math.floor(rng() * BASE58_ALPHABET.length)];
  return out;
}

/* ------------------------------------------------------------------ */
/* Token + market                                                      */
/* ------------------------------------------------------------------ */

export const TOAD_TOKEN: TokenMeta = {
  symbol: "TOAD",
  name: "TOAD",
  mint: "T0ADm1nt7xKq92AhRbCd4vFgHjKmNpQrStUvWxYz8Bd",
  decimals: 6,
  totalSupply: 1_000_000_000,
};

/** Anchor for all generated timestamps. Set once per process/tab. */
export const MOCK_EPOCH = Date.now();

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const mockPriceSnapshot: PriceSnapshot = {
  priceUsd: 0.0673,
  marketCapUsd: 67_300_000,
  fdvUsd: 67_300_000,
  volume24hUsd: 8_942_000,
  change24hPct: 12.7,
  holders: 41_286,
  liquidityUsd: 3_180_000,
  updatedAt: MOCK_EPOCH,
};

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */

export const mockMarketCapData = {
  snapshot: mockPriceSnapshot,
  milestones: [
    {
      id: "tadpole",
      emoji: "🌱",
      label: "Tadpole",
      target: 1_000_000,
      flavor: "The lily pad is real.",
      meaning: "First real liquidity. The chart exists, the chat is small, the believers are early.",
      reachedAt: MOCK_EPOCH - 96 * DAY,
    },
    {
      id: "baby-toad",
      emoji: "🐸",
      label: "Baby TOAD",
      target: 10_000_000,
      flavor: "Frens are noticing.",
      meaning: "DexScreener trending, first wave of holders, the meme starts to travel on its own.",
      reachedAt: MOCK_EPOCH - 61 * DAY,
    },
    {
      id: "pond-life",
      emoji: "🌊",
      label: "Pond Life",
      target: 50_000_000,
      flavor: "CT is paying attention.",
      meaning: "Crypto Twitter threads, mid-tier influencers, real depth in the pool.",
      reachedAt: MOCK_EPOCH - 9 * DAY,
    },
    {
      id: "whale-waters",
      emoji: "🐋",
      label: "Whale Waters",
      target: 100_000_000,
      flavor: "We are so back.",
      meaning: "Nine figures. Serious wallets size in, Tier 2 CEX conversations start.",
      reachedAt: null,
    },
    {
      id: "on-fire",
      emoji: "🔥",
      label: "On Fire",
      target: 250_000_000,
      flavor: "The normies have arrived.",
      meaning: "Top 200 on CoinGecko. Group chats you're not in are talking about it.",
      reachedAt: null,
    },
    {
      id: "liftoff",
      emoji: "🚀",
      label: "Liftoff",
      target: 500_000_000,
      flavor: "Your friend who said 'it's just a frog' is now asking for the CA.",
      meaning: "Half a billion. Tier 1 CEX listings become a question of when, not if.",
      reachedAt: null,
    },
    {
      id: "lunar-toad",
      emoji: "🌕",
      label: "Lunar TOAD",
      target: 1_000_000_000,
      flavor: "Billionaire frog behavior.",
      meaning: "Ten figures. Mainstream crypto media coverage, meme of the year candidate.",
      reachedAt: null,
    },
    {
      id: "diamond-lily",
      emoji: "💎",
      label: "Diamond Lily",
      target: 2_500_000_000,
      flavor: "Top 50. They can't ignore us.",
      meaning: "Top 50 by market cap. Institutional desks quote it without laughing.",
      reachedAt: null,
    },
    {
      id: "toad-royalty",
      emoji: "👑",
      label: "TOAD Royalty",
      target: 5_000_000_000,
      flavor: "The TOAD has become the ecosystem.",
      meaning: "An ecosystem, not a coin. Builders ship on top of the meme.",
      reachedAt: null,
    },
    {
      id: "toad-supremacy",
      emoji: "🏆",
      label: "TOAD Supremacy",
      target: 10_000_000_000,
      flavor: "We were always inevitable.",
      meaning: "Five-comma club. The frog is a permanent fixture of internet financial history.",
      reachedAt: null,
    },
  ] satisfies MarketCapMilestone[],
};

/* ------------------------------------------------------------------ */
/* Wallets & holders                                                   */
/* ------------------------------------------------------------------ */

const KNOWN_LABELS: Array<{ label: string; badges: WalletBadge[] }> = [
  { label: "Kraken Hot Wallet", badges: ["exchange"] },
  { label: "Jupiter Aggregator", badges: ["exchange"] },
  { label: "pondmaster.sol", badges: ["toad-og", "smart-money"] },
  { label: "ribbit.sol", badges: ["toad-og"] },
  { label: "swampfund.sol", badges: ["smart-money"] },
];

export interface MockHolder {
  wallet: Wallet;
  balance: number;
  change24hPct: number;
  costBasisUsd: number | null;
}

function badgesForHolder(rank: number, balance: number, firstSeen: number, rng: () => number): WalletBadge[] {
  const badges: WalletBadge[] = [];
  const supplyPct = (balance / TOAD_TOKEN.totalSupply) * 100;
  if (supplyPct >= 3) badges.push("mega-whale");
  else if (supplyPct >= 0.4) badges.push("whale");
  if (rank <= 10) badges.push("top-10");
  if (firstSeen < MOCK_EPOCH - 80 * DAY) badges.push("toad-og");
  if (firstSeen > MOCK_EPOCH - 6 * DAY) badges.push("fresh");
  if (rng() > 0.82) badges.push("smart-money");
  return badges;
}

/** 60 ranked holders with a realistic power-law distribution. */
export const mockHolders: MockHolder[] = (() => {
  const rng = createRng(0x70ad);
  const holders: MockHolder[] = [];
  // Top holder ~8.4% of supply, decaying by a fixed factor with noise.
  let balance = 84_200_000;

  for (let rank = 1; rank <= 60; rank++) {
    const addressRng = createRng(0x70ad + rank * 7919);
    const address = makeAddress(addressRng);
    const known = rank <= 3 && rng() > 0.72 ? pick(rng, KNOWN_LABELS) : undefined;
    const firstSeen = MOCK_EPOCH - between(rng, 4, 98) * DAY;
    const lastActive = MOCK_EPOCH - between(rng, 0.02, 26) * HOUR;

    holders.push({
      wallet: {
        address,
        label: known?.label,
        holderRank: rank,
        badges: Array.from(new Set([...badgesForHolder(rank, balance, firstSeen, rng), ...(known?.badges ?? [])])),
        firstSeen,
        lastActive,
      },
      balance: Math.round(balance),
      change24hPct: Number(between(rng, -22, 34).toFixed(1)),
      costBasisUsd: rng() > 0.12 ? Number(between(rng, 0.004, 0.061).toFixed(5)) : null,
    });

    balance *= between(rng, 0.78, 0.94);
  }
  return holders;
})();

export const mockHolderByAddress = new Map(mockHolders.map((h) => [h.wallet.address, h]));

/* ------------------------------------------------------------------ */
/* Whale activity feed                                                 */
/* ------------------------------------------------------------------ */

const VENUES: Trade["venue"][] = ["Raydium", "Orca", "Meteora", "Jupiter", "Pump.fun"];

/**
 * Builds a whale trade. Exported so the live-feed simulator in
 * `solanaDataService` can mint new events with the same shape.
 */
export function createWhaleActivity(seed: number, timestamp: number): WhaleActivity {
  const rng = createRng(seed);
  // 58% buys — reflects the net-accumulation regime the mock market is in.
  const side: Trade["side"] = rng() < 0.58 ? "buy" : "sell";
  const usdValue = Math.round(powerLaw(rng, 1_000, 190_000, 2.4));
  const priceUsd = mockPriceSnapshot.priceUsd * between(rng, 0.965, 1.035);
  const tokenAmount = usdValue / priceUsd;

  // 35% of feed events come from a ranked holder; the rest are anonymous whales.
  const useKnownHolder = rng() < 0.35;
  const holder = useKnownHolder ? mockHolders[intBetween(rng, 0, mockHolders.length - 1)] : undefined;
  const address = holder?.wallet.address ?? makeAddress(createRng(seed * 31 + 17));
  const firstSeen = holder?.wallet.firstSeen ?? MOCK_EPOCH - between(rng, 0.4, 70) * DAY;
  const isNewPosition = !holder && rng() < 0.22;

  const badges: WalletBadge[] = holder
    ? holder.wallet.badges
    : [
        ...(usdValue > 90_000 ? (["mega-whale"] as WalletBadge[]) : usdValue > 24_000 ? (["whale"] as WalletBadge[]) : []),
        ...(isNewPosition ? (["fresh"] as WalletBadge[]) : []),
      ];

  const balanceAfter = holder
    ? holder.balance
    : Math.max(0, tokenAmount * between(rng, side === "buy" ? 1.0 : 0.15, side === "buy" ? 7 : 4));

  return {
    id: `wa_${seed.toString(36)}`,
    signature: makeSignature(createRng(seed * 13 + 3)),
    wallet: address,
    side,
    tokenAmount,
    usdValue,
    priceUsd,
    timestamp,
    venue: pick(rng, VENUES),
    realizedPnlUsd:
      side === "sell" ? Math.round(usdValue * between(rng, -0.34, 0.92) * 100) / 100 : undefined,
    walletRank: holder?.wallet.holderRank,
    badges,
    balanceAfter,
    isNewPosition,
  };
}

/** ~7 days of whale prints, newest first. */
export const mockWhaleActivity: WhaleActivity[] = (() => {
  const rng = createRng(0xf0cd);
  const events: WhaleActivity[] = [];
  let cursor = MOCK_EPOCH - 40_000; // newest event sits ~40s in the past

  for (let i = 0; i < 320; i++) {
    events.push(createWhaleActivity(0x51e0 + i * 104729, Math.round(cursor)));
    // Gaps widen as we walk back in time, so the last 24h is densest.
    const ageDays = (MOCK_EPOCH - cursor) / DAY;
    const gapMinutes = between(rng, 2, 14) * (1 + ageDays * 0.85);
    cursor -= gapMinutes * 60_000;
  }
  return events.sort((a, b) => b.timestamp - a.timestamp);
})();

/* ------------------------------------------------------------------ */
/* Trade history per wallet                                            */
/* ------------------------------------------------------------------ */

/** Behavioural archetypes the generator samples to make wallets feel distinct. */
const TRADER_ARCHETYPES = [
  { key: "diamond", trades: [24, 90], holdHours: [400, 2200], sellBias: 0.14, winBias: 0.74, size: [900, 42_000] },
  { key: "paper", trades: [90, 220], holdHours: [0.15, 3], sellBias: 0.52, winBias: 0.3, size: [200, 6_400] },
  { key: "whale", trades: [40, 130], holdHours: [40, 700], sellBias: 0.44, winBias: 0.62, size: [12_000, 165_000] },
  { key: "sniper", trades: [8, 30], holdHours: [30, 210], sellBias: 0.42, winBias: 0.82, size: [2_500, 38_000] },
  { key: "degen", trades: [400, 1_900], holdHours: [0.1, 1.4], sellBias: 0.5, winBias: 0.42, size: [120, 4_200] },
  { key: "farmer", trades: [60, 190], holdHours: [10, 96], sellBias: 0.47, winBias: 0.56, size: [600, 14_000] },
] as const;

/**
 * Generates a full, self-consistent trade history for any address.
 * The same address always yields the same history.
 */
export function generateTradeHistory(address: string): Trade[] {
  const seed = hashString(address);
  const rng = createRng(seed);
  const known = mockHolderByAddress.get(address);

  // Big ranked holders skew toward the whale/diamond archetypes.
  const archetype = known && known.wallet.holderRank! <= 12
    ? TRADER_ARCHETYPES[rng() > 0.5 ? 2 : 0]
    : pick(rng, TRADER_ARCHETYPES);

  const tradeCount = intBetween(rng, archetype.trades[0], archetype.trades[1]);
  const firstSeen = known?.wallet.firstSeen ?? MOCK_EPOCH - between(rng, 3, 100) * DAY;
  const span = Math.max(HOUR * 6, MOCK_EPOCH - firstSeen);

  const trades: Trade[] = [];
  // Track open lots FIFO so realised PnL and hold times are internally consistent.
  const lots: Array<{ amount: number; priceUsd: number; timestamp: number }> = [];
  let position = 0;

  for (let i = 0; i < tradeCount; i++) {
    const t = i / Math.max(1, tradeCount - 1);
    const timestamp = Math.round(firstSeen + span * t * between(rng, 0.9, 1.0));
    // Price walks upward with noise — the mock token is in an uptrend.
    const trend = 0.011 + (mockPriceSnapshot.priceUsd - 0.011) * Math.pow(t, 1.35);
    const priceUsd = Math.max(0.0008, trend * between(rng, 0.72, 1.28));

    const wantsSell = position > 0 && rng() < archetype.sellBias;
    const side: Trade["side"] = wantsSell ? "sell" : "buy";
    const usdValue = Math.round(powerLaw(rng, archetype.size[0], archetype.size[1], 2.1));
    let tokenAmount = usdValue / priceUsd;

    let realizedPnlUsd: number | undefined;
    if (side === "sell") {
      tokenAmount = Math.min(tokenAmount, position);
      if (tokenAmount <= 0) continue;
      // Match against open lots FIFO.
      let remaining = tokenAmount;
      let costBasis = 0;
      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(lot.amount, remaining);
        costBasis += take * lot.priceUsd;
        lot.amount -= take;
        remaining -= take;
        if (lot.amount <= 1e-9) lots.shift();
      }
      const proceeds = tokenAmount * priceUsd;
      realizedPnlUsd = Math.round((proceeds - costBasis) * 100) / 100;
      position -= tokenAmount;
    } else {
      lots.push({ amount: tokenAmount, priceUsd, timestamp });
      position += tokenAmount;
    }

    trades.push({
      id: `tx_${seed.toString(36)}_${i}`,
      signature: makeSignature(createRng(seed + i * 7919)),
      wallet: address,
      side,
      tokenAmount,
      usdValue: side === "sell" ? Math.round(tokenAmount * priceUsd) : usdValue,
      priceUsd,
      timestamp,
      venue: pick(rng, VENUES),
      realizedPnlUsd,
    });
  }

  return trades.sort((a, b) => a.timestamp - b.timestamp);
}

/** Full profile for any address — real holders keep their ranked balance. */
export function generateTraderProfile(address: string): TraderProfile {
  const trades = generateTradeHistory(address);
  const known = mockHolderByAddress.get(address);
  const rng = createRng(hashString(address) ^ 0xbeef);

  const wallet: Wallet =
    known?.wallet ?? {
      address,
      holderRank: undefined,
      badges: [],
      firstSeen: trades[0]?.timestamp ?? MOCK_EPOCH - 30 * DAY,
      lastActive: trades[trades.length - 1]?.timestamp ?? MOCK_EPOCH - HOUR,
    };

  // Net position from the trade history; ranked holders use their real balance.
  const netFromTrades = trades.reduce(
    (acc, t) => acc + (t.side === "buy" ? t.tokenAmount : -t.tokenAmount),
    0
  );
  const balance = known?.balance ?? Math.max(0, netFromTrades);

  return buildTraderProfile({
    wallet: {
      ...wallet,
      badges: wallet.badges.length ? wallet.badges : inferBadges(balance, wallet.firstSeen, rng),
    },
    balance,
    change24hPct: known?.change24hPct ?? Number(between(rng, -18, 26).toFixed(1)),
    trades,
    priceUsd: mockPriceSnapshot.priceUsd,
    totalSupply: TOAD_TOKEN.totalSupply,
    mint: TOAD_TOKEN.mint,
  });
}

function inferBadges(balance: number, firstSeen: number, rng: () => number): WalletBadge[] {
  const badges: WalletBadge[] = [];
  const supplyPct = (balance / TOAD_TOKEN.totalSupply) * 100;
  if (supplyPct >= 3) badges.push("mega-whale");
  else if (supplyPct >= 0.4) badges.push("whale");
  if (firstSeen < MOCK_EPOCH - 80 * DAY) badges.push("toad-og");
  if (firstSeen > MOCK_EPOCH - 6 * DAY) badges.push("fresh");
  if (rng() > 0.85) badges.push("smart-money");
  return badges;
}

/* ------------------------------------------------------------------ */
/* Leaderboard population                                              */
/* ------------------------------------------------------------------ */

/** A stable cohort of traders used for the leaderboard and profile links. */
export const mockTraderAddresses: string[] = (() => {
  const ranked = mockHolders.slice(0, 34).map((h) => h.wallet.address);
  const rng = createRng(0x1eeb);
  const extra = Array.from({ length: 26 }, (_, i) => makeAddress(createRng(0x1eeb + i * 65537)));
  // Interleave so the board isn't just "top holders in order".
  return [...ranked, ...extra].sort(() => rng() - 0.5);
})();

let leaderboardCache: LeaderboardEntry[] | null = null;

export function getMockLeaderboardPool(): LeaderboardEntry[] {
  if (leaderboardCache) return leaderboardCache;
  leaderboardCache = mockTraderAddresses.map((address, i) => {
    const profile = generateTraderProfile(address);
    return {
      rank: i + 1,
      wallet: profile.wallet,
      personality: {
        id: profile.personality.id,
        name: profile.personality.name,
        emoji: profile.personality.emoji,
        accent: profile.personality.accent,
      },
      pnlUsd: profile.pnl.totalUsd,
      winRatePct: profile.metrics.winRatePct,
      trades: profile.metrics.totalTrades,
      volumeUsd: profile.metrics.totalVolumeUsd,
      bestTradeUsd: profile.metrics.bestTradeUsd,
      worstTradeUsd: profile.metrics.worstTradeUsd,
    };
  });
  return leaderboardCache;
}

/** Cache of full profiles so repeat lookups are instant. */
const profileCache = new Map<string, TraderProfile>();
export function getMockProfile(address: string): TraderProfile {
  const cached = profileCache.get(address);
  if (cached) return cached;
  const profile = generateTraderProfile(address);
  profileCache.set(address, profile);
  return profile;
}

/** A wallet with plenty of history — used by the "try an example" affordance. */
export const FEATURED_WALLETS = mockHolders.slice(0, 6).map((h) => h.wallet.address);
