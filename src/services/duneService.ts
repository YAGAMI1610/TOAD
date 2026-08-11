import fs from "node:fs";
import path from "node:path";
import { marketCapService } from "@/services/marketCapService";
import { TOAD_TOKEN } from "@/lib/mockData";
import type { LeaderboardEntry, TraderProfile, Trade, Wallet } from "@/lib/types";

const WALLET_COLUMN_CANDIDATES = ["destination_address", "wallet", "address", "recipient", "to_address", "owner", "from"];
const AMOUNT_COLUMN_CANDIDATES = ["tokens_airdropped", "airdrop_amount", "token_amount", "to_amount", "amount", "value"];

let localAirdropCsvCache: string | null = null;

function loadLocalAirdropCsv(): string {
  if (localAirdropCsvCache !== null) return localAirdropCsvCache;
  try {
    const csvPath = path.join(process.cwd(), "src", "data", "airdrop-table.csv");
    localAirdropCsvCache = fs.readFileSync(csvPath, "utf-8");
  } catch {
    localAirdropCsvCache = "";
  }
  return localAirdropCsvCache;
}

export type DuneCsvRow = Record<string, string>;

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
}

function parseCsv(csv: string): DuneCsvRow[] {
  const lines = csv.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: DuneCsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

export async function fetchDuneQueryRows(_queryId: string): Promise<DuneCsvRow[]> {
  const csvText = process.env.TOAD_DUNE_CSV || loadLocalAirdropCsv();
  if (!csvText) return [];
  return parseCsv(csvText);
}

function findColumn(row: DuneCsvRow, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const needle = candidate.toLowerCase();
    const found = keys.find((key) => key.toLowerCase().includes(needle));
    if (found) return found;
  }
  return undefined;
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function parseNumeric(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[,\$\s]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number(trimmed);
    return parsed > 1e12 ? parsed : parsed * 1000;
  }
  const date = Date.parse(trimmed);
  return Number.isFinite(date) ? date : 0;
}

function findRowValue(row: DuneCsvRow, candidates: string[]): string {
  const column = findColumn(row, candidates);
  return column ? row[column] ?? "" : "";
}

export function getAirdropRowsForAddress(rows: DuneCsvRow[], targetAddress: string) {
  const address = normalizeAddress(targetAddress);
  if (rows.length === 0) return { rows: [], amount: 0 };

  const walletKey = findColumn(rows[0], WALLET_COLUMN_CANDIDATES);
  const amountKey = findColumn(rows[0], AMOUNT_COLUMN_CANDIDATES);
  if (!walletKey || !amountKey) return { rows: [], amount: 0 };

  const hits = rows.filter((row) => normalizeAddress(row[walletKey]) === address);
  const amount = hits.reduce((sum, row) => sum + parseNumeric(row[amountKey]), 0);
  return { rows: hits, amount };
}

export function buildLeaderboardEntries(rows: DuneCsvRow[], priceUsd: number): LeaderboardEntry[] {
  if (rows.length === 0) return [];

  const walletKey = findColumn(rows[0], WALLET_COLUMN_CANDIDATES);
  const amountKey = findColumn(rows[0], AMOUNT_COLUMN_CANDIDATES);
  if (!walletKey || !amountKey) return [];

  const totals = new Map<string, { totalAmount: number; maxAmount: number; minAmount: number; transfers: number }>();

  for (const row of rows) {
    const address = normalizeAddress(row[walletKey]);
    if (!address) continue;

    const amount = parseNumeric(row[amountKey]);
    if (!totals.has(address)) {
      totals.set(address, { totalAmount: 0, maxAmount: 0, minAmount: amount, transfers: 0 });
    }

    const bucket = totals.get(address)!;
    bucket.totalAmount += amount;
    bucket.maxAmount = Math.max(bucket.maxAmount, amount);
    bucket.minAmount = Math.min(bucket.minAmount, amount);
    bucket.transfers += 1;
  }

  return Array.from(totals.entries())
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .slice(0, 250)
    .map(([address, bucket], index) => {
      const totalUsd = bucket.totalAmount * priceUsd;
      const rank = index + 1;
      const transferCount = bucket.transfers;

      return {
        rank,
        wallet: {
          address,
          badges: rank <= 10 ? ["top-10"] : [],
          firstSeen: Date.now() - 1000 * 60 * 60 * 24 * 30,
          lastActive: Date.now(),
        } as Wallet,
        personality: {
          id: rank <= 5 ? "whale-toad" : rank <= 20 ? "sniper-toad" : "swamp-lurker",
          name: rank <= 5 ? "Whale Toad" : rank <= 20 ? "Sniper Toad" : "Swamp Lurker",
          emoji: rank <= 5 ? "🐋" : rank <= 20 ? "🎯" : "🪱",
          tagline: "Based on Dune transfer history.",
          description: "Derived from on-chain TOAD transfer data.",
          quote: "I move in the swamp.",
          accent: rank <= 5 ? "toad" : rank <= 20 ? "ember" : "foam",
          confidence: 76,
          reasons: [
            `Total TOAD moved: ${bucket.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
            `${transferCount} transfer${transferCount === 1 ? "" : "s"} observed in the dataset.`,
          ],
          alternates: [],
        },
        pnlUsd: totalUsd,
        winRatePct: 100,
        trades: transferCount,
        volumeUsd: totalUsd,
        bestTradeUsd: bucket.maxAmount * priceUsd,
        worstTradeUsd: bucket.minAmount * priceUsd,
      };
    });
}

function findTimestampKey(row: DuneCsvRow): string | undefined {
  return findColumn(row, ["timestamp", "time", "block_time", "date", "created_at", "updated_at"]);
}

export async function buildTraderProfile(address: string): Promise<TraderProfile> {
  const rows = await fetchDuneQueryRows("");
  const { rows: walletRows, amount } = getAirdropRowsForAddress(rows, address);
  const price = await marketCapService.getPrice().catch(() => ({ priceUsd: 0 }));
  const totalUsd = amount * price.priceUsd;

  const firstSeen = walletRows.length
    ? parseTimestamp(findRowValue(walletRows[0], ["timestamp", "time", "block_time", "date"])) || Date.now() - 1000 * 60 * 60 * 24 * 30
    : Date.now() - 1000 * 60 * 60 * 24 * 30;
  const lastActive = walletRows.length
    ? parseTimestamp(findRowValue(walletRows[walletRows.length - 1], ["timestamp", "time", "block_time", "date"])) || Date.now()
    : Date.now();

  const signatureKey = walletRows.length ? findColumn(walletRows[0], ["sig", "signature", "tx", "transaction"]) : undefined;
  const amountKey = walletRows.length ? findColumn(walletRows[0], ["amount", "value", "token_amount", "to_amount", "airdrop_amount"]) : undefined;
  const timeKey = walletRows.length ? findTimestampKey(walletRows[0]) : undefined;

  const trades = walletRows.map((row, index) => {
    const signature = signatureKey && row[signatureKey] ? row[signatureKey] : `unknown-${index}`;
    const tokenAmount = amountKey ? parseNumeric(row[amountKey]) : 0;
    const usdValue = tokenAmount * price.priceUsd;
    const timestamp = timeKey ? parseTimestamp(row[timeKey]) || Date.now() : Date.now();

    return {
      id: `${address}-${index}`,
      signature,
      wallet: address,
      side: "buy" as const,
      tokenAmount,
      usdValue,
      priceUsd: price.priceUsd,
      timestamp,
      venue: "Jupiter",
    } as Trade;
  });

  const wallet: Wallet = {
    address,
    badges: walletRows.length > 0 ? ["smart-money"] : [],
    firstSeen,
    lastActive,
  };

  return {
    wallet,
    holding: {
      address,
      mint: process.env.NEXT_PUBLIC_TOAD_MINT ?? "",
      amount,
      usdValue: totalUsd,
      supplyPct: (amount / TOAD_TOKEN.totalSupply) * 100,
      change24hPct: 0,
      costBasisUsd: null,
    },
    pnl: {
      realizedUsd: 0,
      unrealizedUsd: totalUsd,
      totalUsd,
      roiPct: 0,
      investedUsd: 0,
    },
    metrics: {
      totalTrades: trades.length,
      buyCount: trades.length,
      sellCount: 0,
      buySellRatio: trades.length > 0 ? trades.length : 0,
      winRatePct: 100,
      totalVolumeUsd: totalUsd,
      largestBuyUsd: trades.reduce((max, trade) => Math.max(max, trade.usdValue), 0),
      largestSellUsd: 0,
      bestTradeUsd: trades.reduce((max, trade) => Math.max(max, trade.usdValue), 0),
      worstTradeUsd: trades.reduce((min, trade) => Math.min(min || trade.usdValue, trade.usdValue), 0),
      avgHoldHours: 0,
      maxHoldHours: 0,
      tradesPerDay: trades.length,
      fullExitRate: 0,
    },
    scores: {
      conviction: 72,
      risk: 56,
      patience: 48,
      activity: 60,
    },
    trades,
  };
}
