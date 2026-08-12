/**
 * The single door between the UI and $TOAD chain data.
 *
 * Two implementations behind one interface:
 *   - MockToadDataSource  — deterministic generated data (today)
 *   - RpcToadDataSource   — Solana RPC + indexer (stubbed; drop credentials in)
 *
 * Components import `solanaDataService` and never touch `lib/mockData` directly.
 */

import {
  createWhaleActivity,
  getMockLeaderboardPool,
  getMockProfile,
  mockHolders,
  mockPriceSnapshot,
  mockWhaleActivity,
  TOAD_TOKEN,
} from "@/lib/mockData";
import { isValidSolanaAddress } from "@/lib/utils";
import { marketCapService } from "@/services/marketCapService";
import type {
  DashboardSnapshot,
  FeedQuery,
  FlowRange,
  LeaderboardEntry,
  LeaderboardTab,
  TokenHolding,
  TokenMeta,
  ToadDataSource,
  TraderProfile,
  Wallet,
  WhaleActivity,
  WhaleFlowPoint,
} from "@/lib/types";
import { dataLayerConfig, hasChainCredentials, hasRpcCredentials, mockDelay } from "./config";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Below this USD notional a trade isn't "whale" activity. */
export const WHALE_THRESHOLD_USD = 1_000;


function toHolding(amount: number, address: string, change24hPct: number, costBasisUsd: number | null): TokenHolding {
  return {
    address,
    mint: TOAD_TOKEN.mint,
    amount,
    usdValue: amount * mockPriceSnapshot.priceUsd,
    supplyPct: (amount / TOAD_TOKEN.totalSupply) * 100,
    change24hPct,
    costBasisUsd,
  };
}

/* ------------------------------------------------------------------ */
/* Mock implementation                                                 */
/* ------------------------------------------------------------------ */

class MockToadDataSource implements ToadDataSource {
  readonly isDemo = true;

  /** Events minted by the live simulator, newest first. */
  private liveEvents: WhaleActivity[] = [];
  private seedCounter = 900_001;

  private allActivity(): WhaleActivity[] {
    return [...this.liveEvents, ...mockWhaleActivity];
  }

  async getToken(): Promise<TokenMeta> {
    await mockDelay(60, 140);
    return TOAD_TOKEN;
  }

  async getDashboard(): Promise<DashboardSnapshot> {
    await mockDelay();
    const now = Date.now();
    const activity = this.allActivity();
    const last24h = activity.filter((a) => a.timestamp >= now - DAY);
    const prev24h = activity.filter((a) => a.timestamp >= now - 2 * DAY && a.timestamp < now - DAY);

    const sum = (list: WhaleActivity[], side: "buy" | "sell") =>
      list.filter((a) => a.side === side).reduce((acc, a) => acc + a.usdValue, 0);

    const buys = sum(last24h, "buy");
    const sells = sum(last24h, "sell");
    const prevNet = sum(prev24h, "buy") - sum(prev24h, "sell");
    const net = buys - sells;

    const biggestBuy = last24h
      .filter((a) => a.side === "buy")
      .reduce((best, a) => (a.usdValue > best.usdValue ? a : best), last24h.find((a) => a.side === "buy")!);
    const biggestSell = last24h
      .filter((a) => a.side === "sell")
      .reduce((best, a) => (a.usdValue > best.usdValue ? a : best), last24h.find((a) => a.side === "sell")!);

    const top = mockHolders[0];

    return {
      whales24h: {
        largeBuysUsd: buys,
        largeBuyCount: last24h.filter((a) => a.side === "buy").length,
        largeSellsUsd: sells,
        largeSellCount: last24h.filter((a) => a.side === "sell").length,
        netFlowUsd: net,
        netFlowChangePct: prevNet !== 0 ? ((net - prevNet) / Math.abs(prevNet)) * 100 : 0,
      },
      topHolder: {
        wallet: top.wallet,
        holding: toHolding(top.balance, top.wallet.address, top.change24hPct, top.costBasisUsd),
      },
      biggestBuy,
      biggestSell,
      price: { ...mockPriceSnapshot, updatedAt: Date.now() },
    };
  }

  async getWhaleActivity(query: FeedQuery = {}): Promise<WhaleActivity[]> {
    await mockDelay();
    return this.filterActivity(query);
  }

  async getWhaleFlow(range: FlowRange): Promise<{ series: WhaleFlowPoint[]; netUsd: number; buyCount: number; sellCount: number; uniqueWallets: number; buysUsd: number; sellsUsd: number }> {
    await mockDelay();
    const activity = this.allActivity().filter((a) => a.timestamp >= Date.now() - {"1H": HOUR, "6H": 6 * HOUR, "24H": DAY, "7D": 7 * DAY}[range]);
    const points = Array.from({ length: range === "7D" ? 7 : Number(range.replace("H", "")) }, (_, index) => {
      const bucketSize = range === "7D" ? DAY : HOUR;
      const bucketStart = Date.now() - (index + 1) * bucketSize;
      const bucketEnd = Date.now() - index * bucketSize;
      const bucket = activity.filter((a) => a.timestamp >= bucketStart && a.timestamp < bucketEnd);
      return {
        timestamp: bucketStart,
        buysUsd: bucket.filter((a) => a.side === "buy").reduce((sum, a) => sum + a.usdValue, 0),
        sellsUsd: bucket.filter((a) => a.side === "sell").reduce((sum, a) => sum + a.usdValue, 0),
        netUsd: bucket.filter((a) => a.side === "buy").reduce((sum, a) => sum + a.usdValue, 0) - bucket.filter((a) => a.side === "sell").reduce((sum, a) => sum + a.usdValue, 0),
      };
    }).reverse();

    const buysUsd = activity.filter((a) => a.side === "buy").reduce((sum, a) => sum + a.usdValue, 0);
    const sellsUsd = activity.filter((a) => a.side === "sell").reduce((sum, a) => sum + a.usdValue, 0);
    const netUsd = buysUsd - sellsUsd;
    const buyCount = activity.filter((a) => a.side === "buy").length;
    const sellCount = activity.filter((a) => a.side === "sell").length;
    const uniqueWallets = new Set(activity.map((a) => a.wallet)).size;

    return { series: points, netUsd, buyCount, sellCount, uniqueWallets, buysUsd, sellsUsd };
  }

  /** Synchronous filter used by both the initial fetch and client-side refiltering. */
  filterActivity(query: FeedQuery = {}): WhaleActivity[] {
    const { side = "all", minUsd = WHALE_THRESHOLD_USD, limit = 40, since } = query;
    return this.allActivity()
      .filter((a) => a.usdValue >= minUsd)
      .filter((a) => (since ? a.timestamp > since : true))
      .filter((a) => {
        if (side === "all") return true;
        if (side === "top-holders") return typeof a.walletRank === "number" && a.walletRank <= 25;
        return a.side === side;
      })
      .slice(0, limit);
  }


  async getTopHolders(limit = 25): Promise<Array<{ wallet: Wallet; holding: TokenHolding }>> {
    await mockDelay();
    return mockHolders.slice(0, limit).map((h) => ({
      wallet: h.wallet,
      holding: toHolding(h.balance, h.wallet.address, h.change24hPct, h.costBasisUsd),
    }));
  }

  async getTraderProfile(address: string): Promise<TraderProfile | null> {
    await mockDelay(700, 1500);
    const trimmed = address.trim();
    if (!isValidSolanaAddress(trimmed)) return null;
    return getMockProfile(trimmed);
  }

  async getLeaderboard(tab: LeaderboardTab, limit = 25): Promise<LeaderboardEntry[]> {
    await mockDelay();
    const pool = [...getMockLeaderboardPool()];

    const comparators: Record<LeaderboardTab, (a: LeaderboardEntry, b: LeaderboardEntry) => number> = {
      "top-pnl": (a, b) => b.pnlUsd - a.pnlUsd,
      // Require a real sample size before a win rate means anything.
      "best-win-rate": (a, b) =>
        b.winRatePct - a.winRatePct || b.trades - a.trades,
      "biggest-winners": (a, b) => b.bestTradeUsd - a.bestTradeUsd,
      "biggest-losers": (a, b) => a.worstTradeUsd - b.worstTradeUsd,
      "most-active": (a, b) => b.trades - a.trades,
    };

    const filtered = tab === "best-win-rate" ? pool.filter((e) => e.trades >= 10) : pool;

    return filtered
      .sort(comparators[tab])
      .slice(0, limit)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }

  async searchWallets(query: string): Promise<Wallet[]> {
    await mockDelay(120, 260);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mockHolders
      .filter(
        (h) =>
          h.wallet.address.toLowerCase().includes(q) ||
          (h.wallet.label ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((h) => h.wallet);
  }

  subscribeWhaleActivity(handler: (activity: WhaleActivity) => void): () => void {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      // Irregular cadence reads as real chain activity; a fixed interval doesn't.
      const wait = 5_500 + Math.random() * 11_000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const event = createWhaleActivity(this.seedCounter++ * 7919, Date.now());
        this.liveEvents = [event, ...this.liveEvents].slice(0, 200);
        handler(event);
        schedule();
      }, wait);
    };

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }
}

/* ------------------------------------------------------------------ */
/* Real implementation (stub)                                          */
/* ------------------------------------------------------------------ */

/**
 * Wiring guide for going live:
 *   getTopHolders      -> RPC getTokenLargestAccounts + getMultipleAccounts
 *   getWhaleActivity   -> indexer query for parsed swaps on the mint, USD-priced
 *   getWhaleFlow       -> aggregate the same swaps into time buckets
 *   getTraderProfile   -> full transfer history for the wallet, then reuse
 *                         buildTraderProfile() from lib/personality verbatim
 *   subscribe…         -> Helius webhook / Yellowstone gRPC stream
 *
 * The personality engine and every component work unchanged — they only need
 * these shapes to be filled with real numbers.
 */
const TOKEN_DECIMALS = 6;

class RpcToadDataSource implements ToadDataSource {
  readonly isDemo = false;

  constructor(private readonly rpcUrl: string, private readonly indexerUrl: string, private readonly mint: string) {}

  private notImplemented(method: string): never {
    throw new Error(
      `solanaDataService.${method}() is not implemented yet. RPC=${this.rpcUrl} indexer=${this.indexerUrl} mint=${this.mint}`
    );
  }

  private async callRpc(method: string, params: unknown[]) {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });

    if (!response.ok) {
      throw new Error(`RPC request failed ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(`RPC error: ${payload.error.message ?? JSON.stringify(payload.error)}`);
    }

    return payload.result;
  }

  private parseTokenAmount(account: any): number {
    if (typeof account?.uiAmount === "number") {
      return account.uiAmount;
    }

    if (typeof account?.uiAmountString === "string" && account.uiAmountString.length > 0) {
      const parsed = Number(account.uiAmountString);
      if (!Number.isNaN(parsed)) return parsed;
    }

    if (typeof account?.amount === "string") {
      const rawAmount = Number(account.amount);
      if (!Number.isNaN(rawAmount)) {
        return rawAmount / 10 ** TOKEN_DECIMALS;
      }
    }

    return 0;
  }

  async getToken(): Promise<TokenMeta> {
    return this.notImplemented("getToken");
  }
  async getDashboard(): Promise<DashboardSnapshot> {
    return this.notImplemented("getDashboard");
  }
  async getWhaleActivity(): Promise<WhaleActivity[]> {
    return this.notImplemented("getWhaleActivity");
  }
  async getWhaleFlow(_range: FlowRange): Promise<{ series: WhaleFlowPoint[]; netUsd: number; buyCount: number; sellCount: number; uniqueWallets: number; buysUsd: number; sellsUsd: number }> {
    return this.notImplemented("getWhaleFlow");
  }
  async getTopHolders(limit = 25): Promise<Array<{ wallet: Wallet; holding: TokenHolding }>> {
    const result = await this.callRpc("getTokenLargestAccounts", [this.mint]);
    const accounts = Array.isArray(result?.value) ? result.value : [];
    const priceSnapshot = await marketCapService.getPrice().catch(() => mockPriceSnapshot);

    return accounts.slice(0, limit).map((account: any, index: number) => {
      const amount = this.parseTokenAmount(account);
      const address = account?.address ?? "";

      const wallet: Wallet = {
        address,
        badges: [],
        firstSeen: Date.now(),
        lastActive: Date.now(),
        holderRank: index + 1,
      };

      const holding: TokenHolding = {
        address,
        mint: this.mint,
        amount,
        usdValue: amount * priceSnapshot.priceUsd,
        supplyPct: (amount / TOAD_TOKEN.totalSupply) * 100,
        change24hPct: 0,
        costBasisUsd: null,
      };

      return { wallet, holding };
    });
  }
  async getTraderProfile(address: string): Promise<TraderProfile | null> {
    const addr = address.trim();
    if (!isValidSolanaAddress(addr)) return null;

    try {
      // Fetch token accounts for the owner filtered by the mint
      const result = await this.callRpc("getTokenAccountsByOwner", [addr, { mint: this.mint }, { encoding: "jsonParsed" }]);
      const accounts = Array.isArray(result?.value) ? result.value : [];

      let amount = 0;
      for (const acc of accounts) {
        const parsedToken = acc?.account?.data?.parsed?.info?.tokenAmount ?? acc?.account?.data?.parsed ?? null;
        if (parsedToken) {
          amount += this.parseTokenAmount(parsedToken);
        } else if (acc?.account) {
          amount += this.parseTokenAmount(acc.account);
        }
      }

      // Try to fetch total supply from the RPC; fall back to bundled TOAD_TOKEN
      let totalSupply = TOAD_TOKEN.totalSupply;
      try {
        const supplyRes = await this.callRpc("getTokenSupply", [this.mint]);
        const val = supplyRes?.value;
        if (val) {
          if (typeof val.uiAmount === "number") totalSupply = val.uiAmount;
          else if (typeof val.amount === "string" && typeof val.decimals === "number") {
            totalSupply = Number(val.amount) / Math.pow(10, val.decimals);
          }
        }
      } catch {
        // ignore and use fallback
      }

      const price = await marketCapService.getPrice().catch(() => mockPriceSnapshot);
      const usdValue = amount * (price?.priceUsd ?? mockPriceSnapshot.priceUsd);

      const wallet: Wallet = {
        address: addr,
        badges: [],
        firstSeen: Date.now(),
        lastActive: Date.now(),
      };

      const holding: TokenHolding = {
        address: addr,
        mint: this.mint,
        amount,
        usdValue,
        supplyPct: totalSupply ? (amount / totalSupply) * 100 : 0,
        change24hPct: 0,
        costBasisUsd: null,
      };

      const profile: TraderProfile = {
        wallet,
        holding,
        pnl: { realizedUsd: 0, unrealizedUsd: usdValue, totalUsd: usdValue, roiPct: 0, investedUsd: 0 },
        metrics: {
          totalTrades: 0,
          buyCount: 0,
          sellCount: 0,
          buySellRatio: 0,
          winRatePct: 0,
          totalVolumeUsd: 0,
          largestBuyUsd: 0,
          largestSellUsd: 0,
          bestTradeUsd: 0,
          worstTradeUsd: 0,
          avgHoldHours: 0,
          maxHoldHours: 0,
          tradesPerDay: 0,
          fullExitRate: 0,
        },
        scores: { conviction: 0, risk: 0, patience: 0, activity: 0, profitability: 0 },
        personality: {
          id: "tadpole",
          name: "Holder",
          emoji: "🐸",
          tagline: "On-chain holder",
          description: "Live holdings from RPC",
          quote: "",
          accent: "toad",
          confidence: 0,
          reasons: [],
          alternates: [],
        },
        trades: [],
      };

      return profile;
    } catch {
      return null;
    }
  }
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.notImplemented("getLeaderboard");
  }
  async searchWallets(): Promise<Wallet[]> {
    return this.notImplemented("searchWallets");
  }
  subscribeWhaleActivity(): () => void {
    return () => {};
  }
}

class HybridToadDataSource implements ToadDataSource {
  readonly isDemo = false;

  constructor(private readonly rpcSource: RpcToadDataSource, private readonly fallback: ToadDataSource) {}

  getToken(): Promise<TokenMeta> {
    return this.fallback.getToken();
  }
  getDashboard(): Promise<DashboardSnapshot> {
    return this.fallback.getDashboard();
  }
  getWhaleActivity(query?: FeedQuery): Promise<WhaleActivity[]> {
    return this.fallback.getWhaleActivity(query);
  }
  getWhaleFlow(range: FlowRange): Promise<{ series: WhaleFlowPoint[]; netUsd: number; buyCount: number; sellCount: number; uniqueWallets: number; buysUsd: number; sellsUsd: number }> {
    return this.fallback.getWhaleFlow(range);
  }
  getTopHolders(limit?: number): Promise<Array<{ wallet: Wallet; holding: TokenHolding }>> {
    return this.rpcSource.getTopHolders(limit);
  }
  getTraderProfile(address: string): Promise<TraderProfile | null> {
    return this.fallback.getTraderProfile(address);
  }
  getLeaderboard(tab: LeaderboardTab, limit?: number): Promise<LeaderboardEntry[]> {
    return this.fallback.getLeaderboard(tab, limit);
  }
  searchWallets(query: string): Promise<Wallet[]> {
    return this.fallback.searchWallets(query);
  }
  subscribeWhaleActivity(handler: (activity: WhaleActivity) => void): () => void {
    return this.fallback.subscribeWhaleActivity(handler);
  }
}

export const solanaDataService: ToadDataSource = hasChainCredentials
  ? new RpcToadDataSource(dataLayerConfig.rpcUrl!, dataLayerConfig.indexerUrl!, dataLayerConfig.mint!)
  : hasRpcCredentials
  ? new HybridToadDataSource(
      new RpcToadDataSource(dataLayerConfig.rpcUrl!, dataLayerConfig.indexerUrl ?? "", dataLayerConfig.mint!),
      new MockToadDataSource()
    )
  : new MockToadDataSource();

export const toadToken = TOAD_TOKEN;
