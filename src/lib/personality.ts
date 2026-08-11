/**
 * TOAD personality engine.
 *
 * Takes a wallet's raw $TOAD trade history and derives, in order:
 *   trades -> metrics -> five-axis scores -> archetype match.
 *
 * Deliberately dependency-free (types only) so it can run against real indexed
 * trades exactly as it runs against mock ones.
 */

import type {
  PersonalityId,
  PersonalityScores,
  PnL,
  TokenHolding,
  Trade,
  TraderMetrics,
  TraderPersonality,
  TraderProfile,
  Wallet,
} from "./types";
import { clamp } from "./utils";

const HOUR = 3_600_000;

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

export function computeMetrics(trades: Trade[]): TraderMetrics {
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const buys = sorted.filter((t) => t.side === "buy");
  const sells = sorted.filter((t) => t.side === "sell");

  // FIFO lot matching to recover holding periods per closed unit.
  const lots: Array<{ amount: number; timestamp: number }> = [];
  let weightedHold = 0;
  let closedAmount = 0;
  let maxHoldHours = 0;
  let fullExits = 0;
  let position = 0;

  for (const t of sorted) {
    if (t.side === "buy") {
      lots.push({ amount: t.tokenAmount, timestamp: t.timestamp });
      position += t.tokenAmount;
      continue;
    }
    let remaining = Math.min(t.tokenAmount, position);
    const positionBefore = position;
    while (remaining > 1e-9 && lots.length > 0) {
      const lot = lots[0];
      const take = Math.min(lot.amount, remaining);
      const holdHours = (t.timestamp - lot.timestamp) / HOUR;
      weightedHold += holdHours * take;
      closedAmount += take;
      maxHoldHours = Math.max(maxHoldHours, holdHours);
      lot.amount -= take;
      remaining -= take;
      position -= take;
      if (lot.amount <= 1e-9) lots.shift();
    }
    if (positionBefore > 0 && position / positionBefore < 0.02) fullExits++;
  }

  const wins = sells.filter((t) => (t.realizedPnlUsd ?? 0) > 0).length;
  const realized = sells.map((t) => t.realizedPnlUsd ?? 0);
  const totalVolumeUsd = sorted.reduce((acc, t) => acc + t.usdValue, 0);

  const firstTs = sorted[0]?.timestamp ?? Date.now();
  const lastTs = sorted[sorted.length - 1]?.timestamp ?? firstTs;
  const activeDays = Math.max(1, (lastTs - firstTs) / (24 * HOUR));

  return {
    totalTrades: sorted.length,
    buyCount: buys.length,
    sellCount: sells.length,
    buySellRatio: sells.length === 0 ? buys.length || 1 : buys.length / sells.length,
    winRatePct: sells.length === 0 ? 0 : (wins / sells.length) * 100,
    totalVolumeUsd,
    largestBuyUsd: buys.reduce((m, t) => Math.max(m, t.usdValue), 0),
    largestSellUsd: sells.reduce((m, t) => Math.max(m, t.usdValue), 0),
    bestTradeUsd: realized.length ? Math.max(...realized) : 0,
    worstTradeUsd: realized.length ? Math.min(...realized) : 0,
    avgHoldHours: closedAmount > 0 ? weightedHold / closedAmount : (Date.now() - firstTs) / HOUR,
    maxHoldHours,
    tradesPerDay: sorted.length / activeDays,
    fullExitRate: sells.length ? fullExits / sells.length : 0,
  };
}

export function computePnl(trades: Trade[], holding: { amount: number; priceUsd: number }): PnL {
  const realizedUsd = trades.reduce((acc, t) => acc + (t.realizedPnlUsd ?? 0), 0);

  // Cost basis of the remaining (unsold) position, FIFO.
  const lots: Array<{ amount: number; priceUsd: number }> = [];
  let position = 0;
  for (const t of [...trades].sort((a, b) => a.timestamp - b.timestamp)) {
    if (t.side === "buy") {
      lots.push({ amount: t.tokenAmount, priceUsd: t.priceUsd });
      position += t.tokenAmount;
    } else {
      let remaining = Math.min(t.tokenAmount, position);
      while (remaining > 1e-9 && lots.length > 0) {
        const lot = lots[0];
        const take = Math.min(lot.amount, remaining);
        lot.amount -= take;
        remaining -= take;
        position -= take;
        if (lot.amount <= 1e-9) lots.shift();
      }
    }
  }

  const openCost = lots.reduce((acc, l) => acc + l.amount * l.priceUsd, 0);
  const openAmount = lots.reduce((acc, l) => acc + l.amount, 0);
  // Scale the derived lots onto the authoritative on-chain balance.
  const scale = openAmount > 0 ? holding.amount / openAmount : 0;
  const investedOpen = openCost * scale;
  const unrealizedUsd = holding.amount * holding.priceUsd - investedOpen;

  const investedUsd = trades.filter((t) => t.side === "buy").reduce((acc, t) => acc + t.usdValue, 0);
  const totalUsd = realizedUsd + unrealizedUsd;

  return {
    realizedUsd,
    unrealizedUsd,
    totalUsd,
    investedUsd,
    roiPct: investedUsd > 0 ? (totalUsd / investedUsd) * 100 : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

/** log-scaled 0–100 normaliser — crypto metrics span orders of magnitude. */
function logScore(value: number, min: number, max: number): number {
  if (value <= min) return 0;
  const v = Math.log10(Math.max(value, min));
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  return clamp(((v - lo) / (hi - lo)) * 100, 0, 100);
}

export function computeScores(metrics: TraderMetrics, pnl: PnL, holdingUsd: number): PersonalityScores {
  // Conviction: holds long, buys more than sells, keeps skin in the game.
  const holdRatio = logScore(metrics.avgHoldHours, 0.1, 2000);
  const ratioScore = clamp((metrics.buySellRatio / 6) * 100, 0, 100);
  const exitPenalty = metrics.fullExitRate * 45;
  const conviction = clamp(holdRatio * 0.5 + ratioScore * 0.5 - exitPenalty, 0, 100);

  // Risk: position size relative to trade count + how big the biggest clip is.
  const sizeScore = logScore(metrics.largestBuyUsd, 250, 250_000);
  const concentration = metrics.totalVolumeUsd > 0
    ? clamp((metrics.largestBuyUsd / metrics.totalVolumeUsd) * 180, 0, 100)
    : 0;
  const risk = clamp(sizeScore * 0.6 + concentration * 0.25 + (100 - metrics.winRatePct) * 0.15, 0, 100);

  // Patience: pure hold-time expression, boosted by max hold.
  const patience = clamp(logScore(metrics.avgHoldHours, 0.05, 2400) * 0.75 + logScore(metrics.maxHoldHours, 1, 3000) * 0.25, 0, 100);

  // Activity: trades per day, log-scaled — 20/day is manic.
  const activity = clamp(logScore(metrics.tradesPerDay, 0.05, 40) * 0.7 + logScore(metrics.totalTrades, 3, 2000) * 0.3, 0, 100);

  // Profitability: blend of win rate and ROI, centred at 50.
  const roiScore = clamp(50 + Math.sign(pnl.roiPct) * logScore(Math.abs(pnl.roiPct), 1, 900) * 0.5, 0, 100);
  const profitability = clamp(metrics.winRatePct * 0.45 + roiScore * 0.55, 0, 100);

  return {
    conviction: Math.round(conviction),
    risk: Math.round(risk),
    patience: Math.round(patience),
    activity: Math.round(activity),
    profitability: Math.round(profitability),
  };
}

/* ------------------------------------------------------------------ */
/* Archetypes                                                          */
/* ------------------------------------------------------------------ */

interface ArchetypeDef {
  id: PersonalityId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  quote: string;
  accent: TraderPersonality["accent"];
  /** Returns 0–1 fit, plus the reasons that drove it. */
  match: (ctx: MatchContext) => { score: number; reasons: string[] };
}

interface MatchContext {
  metrics: TraderMetrics;
  scores: PersonalityScores;
  pnl: PnL;
  holdingUsd: number;
}

/** Smooth 0–1 membership: 0 below `lo`, 1 above `hi`. */
const ramp = (value: number, lo: number, hi: number) => clamp((value - lo) / (hi - lo), 0, 1);

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: "whale-toad",
    name: "The Whale TOAD",
    emoji: "🐋",
    tagline: "Size isn't a problem.",
    description:
      "Moves in clips most wallets can't stomach. When this address touches the book, the chart notices.",
    quote: "You don't take positions. You take up space.",
    accent: "foam",
    match: ({ metrics, holdingUsd }) => {
      const size = ramp(metrics.largestBuyUsd, 25_000, 120_000);
      const volume = ramp(metrics.totalVolumeUsd, 250_000, 3_000_000);
      const bag = ramp(holdingUsd, 80_000, 900_000);
      const score = size * 0.4 + volume * 0.35 + bag * 0.25;
      const reasons: string[] = [];
      if (size > 0.4) reasons.push("Single buys clear five figures");
      if (volume > 0.4) reasons.push("Lifetime volume in the seven-figure range");
      if (bag > 0.4) reasons.push("Holds a top-tier $TOAD position");
      return { score, reasons };
    },
  },
  {
    id: "diamond-toad",
    name: "The Diamond TOAD",
    emoji: "🐸",
    tagline: "Rarely sells. Accumulates aggressively and holds through volatility.",
    description:
      "Buys far more often than it sells and sits through drawdowns that shake everyone else out.",
    quote: "You don't sell. You simply accumulate.",
    accent: "toad",
    match: ({ metrics, scores }) => {
      const hold = ramp(metrics.avgHoldHours, 120, 1400);
      const ratio = ramp(metrics.buySellRatio, 1.8, 8);
      const conviction = ramp(scores.conviction, 45, 90);
      const score = hold * 0.4 + ratio * 0.35 + conviction * 0.25;
      const reasons: string[] = [];
      if (ratio > 0.3) reasons.push(`Buys outnumber sells ${metrics.buySellRatio.toFixed(1)}x`);
      if (hold > 0.3) reasons.push("Average position measured in weeks, not minutes");
      if (metrics.fullExitRate < 0.2) reasons.push("Almost never fully exits the position");
      return { score, reasons };
    },
  },
  {
    id: "degen-toad",
    name: "The Degen TOAD",
    emoji: "🎰",
    tagline: "Why make one trade when you can make 47?",
    description:
      "Trades constantly, holds briefly, and treats the candle chart as a slot machine. Volume is the whole personality.",
    quote: "Sleep is a position you refuse to hold.",
    accent: "orchid",
    match: ({ metrics, scores }) => {
      const count = ramp(metrics.totalTrades, 250, 1500);
      const freq = ramp(metrics.tradesPerDay, 4, 30);
      const shortHold = 1 - ramp(metrics.avgHoldHours, 0.5, 24);
      const score = count * 0.35 + freq * 0.4 + shortHold * 0.25 * ramp(scores.activity, 40, 90);
      const reasons: string[] = [];
      if (count > 0.3) reasons.push(`${metrics.totalTrades.toLocaleString()} trades on a single token`);
      if (freq > 0.3) reasons.push(`${metrics.tradesPerDay.toFixed(1)} trades per active day`);
      if (shortHold > 0.5) reasons.push("Positions rarely survive the hour");
      return { score, reasons };
    },
  },
  {
    id: "paper-toad",
    name: "The Paper TOAD",
    emoji: "🧻",
    tagline: "Buys the excitement. Sells the fear.",
    description:
      "Enters on green candles and exits on red ones. Fast hands, thin conviction, and a win rate that shows it.",
    quote: "You bought the top. Then you sold the bottom. Twice.",
    accent: "ember",
    match: ({ metrics, scores }) => {
      const shortHold = 1 - ramp(metrics.avgHoldHours, 0.3, 12);
      const lowWin = 1 - ramp(metrics.winRatePct, 25, 62);
      const exits = ramp(metrics.fullExitRate, 0.25, 0.8);
      const notDegen = 1 - ramp(metrics.tradesPerDay, 6, 20);
      const score = (shortHold * 0.35 + lowWin * 0.3 + exits * 0.2 + notDegen * 0.15) * ramp(metrics.sellCount, 3, 25);
      const reasons: string[] = [];
      if (shortHold > 0.5) reasons.push("Average hold under half a day");
      if (lowWin > 0.4) reasons.push(`Win rate of ${Math.round(metrics.winRatePct)}%`);
      if (exits > 0.3) reasons.push("Habitually dumps the entire bag at once");
      return { score, reasons };
    },
  },
  {
    id: "sniper-toad",
    name: "The Sniper TOAD",
    emoji: "🧠",
    tagline: "Few trades. High conviction.",
    description:
      "Barely trades, and when it does it's right. Waits for the setup, takes the shot, disappears again.",
    quote: "You don't trade often. You just trade correctly.",
    accent: "lily",
    match: ({ metrics, scores }) => {
      const few = 1 - ramp(metrics.totalTrades, 12, 60);
      const win = ramp(metrics.winRatePct, 55, 88);
      const profit = ramp(scores.profitability, 55, 92);
      const score = few * 0.35 + win * 0.35 + profit * 0.3;
      const reasons: string[] = [];
      if (few > 0.4) reasons.push(`Only ${metrics.totalTrades} lifetime trades`);
      if (win > 0.3) reasons.push(`${Math.round(metrics.winRatePct)}% of exits closed green`);
      if (metrics.bestTradeUsd > 5_000) reasons.push("Best trade cleared five figures");
      return { score, reasons };
    },
  },
  {
    id: "farmer-toad",
    name: "The Farmer TOAD",
    emoji: "🌾",
    tagline: "Small, steady, relentless.",
    description:
      "Ladders in and scales out in consistent clips. No heroics, no panic — just a slow, methodical bid.",
    quote: "You don't chase pumps. You harvest them.",
    accent: "toad",
    match: ({ metrics, scores }) => {
      const midHold = 1 - Math.abs(ramp(metrics.avgHoldHours, 6, 200) - 0.5) * 2;
      const balanced = 1 - Math.abs(clamp(metrics.buySellRatio / 2.4, 0, 2) - 0.5) * 1.6;
      const steady = ramp(metrics.totalTrades, 40, 200) * (1 - ramp(metrics.tradesPerDay, 8, 25));
      const score = clamp(midHold * 0.3 + balanced * 0.3 + steady * 0.4, 0, 1) * ramp(scores.profitability, 30, 80);
      const reasons: string[] = [];
      reasons.push("Consistent position sizing across many entries");
      if (metrics.winRatePct > 50) reasons.push("More green exits than red");
      return { score, reasons };
    },
  },
  {
    id: "swamp-lurker",
    name: "The Swamp Lurker",
    emoji: "🌫️",
    tagline: "Bought once. Never spoke again.",
    description:
      "One or two entries, then total silence. Either forgotten or the most patient wallet in the pond.",
    quote: "You're either a genius or you lost the seed phrase.",
    accent: "foam",
    match: ({ metrics }) => {
      const few = 1 - ramp(metrics.totalTrades, 2, 14);
      const noSells = 1 - ramp(metrics.sellCount, 0, 3);
      const longHold = ramp(metrics.avgHoldHours, 300, 1800);
      const score = few * 0.45 + noSells * 0.35 + longHold * 0.2;
      const reasons: string[] = [];
      if (metrics.sellCount === 0) reasons.push("Has never sold a single $TOAD");
      if (few > 0.5) reasons.push("A handful of transactions, total");
      return { score, reasons };
    },
  },
  {
    id: "tadpole",
    name: "The Tadpole",
    emoji: "🌱",
    tagline: "Fresh in the pond.",
    description:
      "Not enough history to judge yet. Every Diamond TOAD started exactly here.",
    quote: "The story is just getting started.",
    accent: "toad",
    match: ({ metrics }) => {
      // Only wins when there's genuinely nothing to analyse.
      const tiny = 1 - ramp(metrics.totalTrades, 1, 6);
      const smallVolume = 1 - ramp(metrics.totalVolumeUsd, 500, 8_000);
      return { score: tiny * 0.65 + smallVolume * 0.35, reasons: ["Too little on-chain history to classify confidently"] };
    },
  },
];

export function assignPersonality(ctx: MatchContext): TraderPersonality {
  const ranked = ARCHETYPES.map((a) => {
    const { score, reasons } = a.match(ctx);
    return { def: a, score, reasons };
  }).sort((a, b) => b.score - a.score);

  const winner = ranked[0];
  const runnerUp = ranked[1];
  // Confidence = how decisively the winner beat the field, floored so it always reads as a real number.
  const margin = winner.score - (runnerUp?.score ?? 0);
  const confidence = Math.round(clamp(52 + margin * 130 + winner.score * 22, 40, 97));

  const reasons = winner.reasons.length
    ? winner.reasons
    : ["Matched on overall trading rhythm across the full history"];

  return {
    id: winner.def.id,
    name: winner.def.name,
    emoji: winner.def.emoji,
    tagline: winner.def.tagline,
    description: winner.def.description,
    quote: winner.def.quote,
    accent: winner.def.accent,
    confidence,
    reasons: reasons.slice(0, 3),
    alternates: ranked.slice(1, 4).map((r) => ({
      id: r.def.id,
      name: r.def.name,
      emoji: r.def.emoji,
      score: Math.round(clamp(r.score * 100, 1, 99)),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export interface BuildProfileInput {
  wallet: Wallet;
  balance: number;
  change24hPct: number;
  trades: Trade[];
  priceUsd: number;
  totalSupply: number;
  mint: string;
}

export function buildTraderProfile(input: BuildProfileInput): TraderProfile {
  const { wallet, balance, change24hPct, trades, priceUsd, totalSupply, mint } = input;

  const metrics = computeMetrics(trades);
  const pnl = computePnl(trades, { amount: balance, priceUsd });
  const usdValue = balance * priceUsd;

  const buyVolume = trades.filter((t) => t.side === "buy");
  const boughtTokens = buyVolume.reduce((acc, t) => acc + t.tokenAmount, 0);
  const costBasisUsd = boughtTokens > 0 ? buyVolume.reduce((acc, t) => acc + t.usdValue, 0) / boughtTokens : null;

  const holding: TokenHolding = {
    address: wallet.address,
    mint,
    amount: balance,
    usdValue,
    supplyPct: (balance / totalSupply) * 100,
    change24hPct,
    costBasisUsd,
  };

  const scores = computeScores(metrics, pnl, usdValue);
  const personality = assignPersonality({ metrics, scores, pnl, holdingUsd: usdValue });

  return { wallet, holding, pnl, metrics, scores, personality, trades };
}

/** Copy shown while the analyzer is "reading the chain". */
export const ANALYSIS_STEPS = [
  "Resolving wallet on Solana…",
  "Fetching $TOAD transfers…",
  "Reconstructing swap history…",
  "Matching cost basis (FIFO)…",
  "Scoring conviction, risk & patience…",
  "Assigning TOAD personality…",
];
