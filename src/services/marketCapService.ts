/**
 * Market cap + price source, kept separate from chain activity so a price API
 * (CoinGecko / Birdeye / DexScreener) can be connected independently of an RPC.
 *
 * `mockMarketCapData` lives in `lib/mockData.ts`; this file only ever shapes it.
 */

import { mockMarketCapData } from "@/lib/mockData";
import type { JourneyState, MarketCapSource, MarketCapMilestone, PriceSnapshot } from "@/lib/types";
import { dataLayerConfig, hasPriceCredentials, mockDelay } from "./config";

/** Pure function: given a market cap and the ladder, where are we standing? */
export function deriveJourney(marketCapUsd: number, milestones: MarketCapMilestone[]): JourneyState {
  const sorted = [...milestones].sort((a, b) => a.target - b.target);
  let currentIndex = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (marketCapUsd >= sorted[i].target) currentIndex = i;
  }

  const next = currentIndex + 1 < sorted.length ? sorted[currentIndex + 1] : null;
  const floor = currentIndex >= 0 ? sorted[currentIndex].target : 0;

  // Log-space progress: linear progress from $67M to $100M would sit at 34%,
  // which understates how close the move actually is on a log chart.
  let progressPct = 100;
  if (next) {
    const lo = Math.log10(Math.max(floor, 1));
    const hi = Math.log10(next.target);
    const cur = Math.log10(Math.max(marketCapUsd, 1));
    progressPct = Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100));
  }

  return {
    marketCapUsd,
    milestones: sorted,
    currentIndex,
    next,
    progressPct,
    multipleToNext: next ? next.target / Math.max(marketCapUsd, 1) : 1,
  };
}

class MockMarketCapSource implements MarketCapSource {
  readonly isDemo = true;

  /** Random-walk the mock price a touch on each poll so the number feels alive. */
  private drift = 0;

  async getPrice(): Promise<PriceSnapshot> {
    await mockDelay(180, 420);
    this.drift += (Math.random() - 0.48) * 0.0022;
    // Clamp the walk so the journey position never wanders off a milestone.
    this.drift = Math.max(-0.035, Math.min(0.055, this.drift));
    const factor = 1 + this.drift;

    return {
      ...mockMarketCapData.snapshot,
      priceUsd: mockMarketCapData.snapshot.priceUsd * factor,
      marketCapUsd: mockMarketCapData.snapshot.marketCapUsd * factor,
      fdvUsd: mockMarketCapData.snapshot.fdvUsd * factor,
      change24hPct: mockMarketCapData.snapshot.change24hPct + this.drift * 100,
      updatedAt: Date.now(),
    };
  }

  async getJourney(): Promise<JourneyState> {
    const price = await this.getPrice();
    return deriveJourney(price.marketCapUsd, mockMarketCapData.milestones);
  }
}

/**
 * Going live: fetch `/simple/token_price` (CoinGecko) or `/defi/token_overview`
 * (Birdeye) for the mint, multiply circulating supply by price, then feed the
 * result straight into `deriveJourney` — the milestone ladder is static config.
 */
class ApiMarketCapSource implements MarketCapSource {
  readonly isDemo = false;

  constructor(private readonly baseUrl: string, private readonly mint: string) {}

  private parsePriceEntry(entry: any) {
    const priceUsd = Number(entry?.priceUsd ?? entry?.price ?? entry?.priceUsdString);
    if (!priceUsd || Number.isNaN(priceUsd)) return null;

    const marketCapUsd = typeof entry?.marketCapUsd === "number" ? entry.marketCapUsd : Math.round(priceUsd * 1_000_000_000);
    const fdvUsd = typeof entry?.fdvUsd === "number" ? entry.fdvUsd : marketCapUsd;
    const volume24hUsd = typeof entry?.volumeUsd24h === "number" ? entry.volumeUsd24h : 0;
    const change24hPct = typeof entry?.priceUsd24hChange === "number"
      ? entry.priceUsd24hChange
      : typeof entry?.change24h === "number"
      ? entry.change24h
      : 0;

    return {
      priceUsd,
      marketCapUsd,
      fdvUsd,
      volume24hUsd,
      change24hPct,
      holders: 0,
      liquidityUsd: 0,
      updatedAt: Date.now(),
    };
  }

  async getPrice(): Promise<PriceSnapshot> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}?ids=${encodeURIComponent(this.mint)}`;

    let response: Response;
    try {
      response = await fetch(url, { cache: "no-store" });
    } catch (error) {
      throw new Error(`Price fetch failed for ${this.mint}: ${(error as Error)?.message ?? "network error"}`);
    }

    if (!response.ok) {
      throw new Error(`Price API returned ${response.status} ${response.statusText} for ${this.mint}`);
    }

    const payload = await response.json();
    const rawData = payload?.data;
    const entries = Array.isArray(rawData)
      ? rawData
      : rawData && typeof rawData === "object"
      ? Object.values(rawData)
      : [];

    const entry = entries.find((item) => item?.id?.toString().toLowerCase() === this.mint.toLowerCase()) ?? entries[0];
    const snapshot = entry ? this.parsePriceEntry(entry) : null;

    if (!snapshot) {
      throw new Error(`Price API returned invalid data for ${this.mint}`);
    }

    return snapshot;
  }

  async getJourney(): Promise<JourneyState> {
    const price = await this.getPrice();
    return deriveJourney(price.marketCapUsd, mockMarketCapData.milestones);
  }
}

export const marketCapService: MarketCapSource = hasPriceCredentials
  ? new ApiMarketCapSource(dataLayerConfig.priceApiUrl!, dataLayerConfig.mint!)
  : new MockMarketCapSource();

/** Static milestone ladder — safe to read synchronously for layout. */
export const MILESTONES = mockMarketCapData.milestones;
