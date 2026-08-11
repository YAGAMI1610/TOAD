import type { WhaleActivity } from "@/lib/types";

const TOAD_MINT = process.env.NEXT_PUBLIC_TOAD_MINT;
const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOAD_DECIMALS = 6;

function normalizeAmount(raw: unknown, decimals: number): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) return parsed / 10 ** decimals;
  }
  if (typeof raw === "object" && raw !== null) {
    const value = (raw as Record<string, unknown>).uiAmount ?? (raw as Record<string, unknown>).amount;
    return normalizeAmount(value, decimals);
  }
  return 0;
}

function parseEventTokens(body: any): Array<{ mint: string; amount: number; side?: string }> {
  if (!body || typeof body !== "object") return [];

  const tokens: Array<{ mint: string; amount: number; side?: string }> = [];

  const extract = (candidate: any) => {
    if (!candidate || typeof candidate !== "object") return;
    const mint = candidate.mint || candidate.tokenMint || candidate.token?.mint;
    const amount = normalizeAmount(candidate.amount ?? candidate.tokenAmount ?? candidate.uiAmount ?? candidate.uiAmountString, TOAD_DECIMALS);
    const side = candidate.side || candidate.direction;
    if (typeof mint === "string" && mint.length > 0) {
      tokens.push({ mint, amount, side: typeof side === "string" ? side.toLowerCase() : undefined });
    }
  };

  if (Array.isArray(body.tokens)) {
    body.tokens.forEach(extract);
  }
  if (Array.isArray(body.swapTokens)) {
    body.swapTokens.forEach(extract);
  }
  if (Array.isArray(body.tokenTransfers)) {
    body.tokenTransfers.forEach(extract);
  }
  if (Array.isArray(body.amounts) && Array.isArray(body.mints) && body.amounts.length === body.mints.length) {
    for (let i = 0; i < body.mints.length; i++) {
      tokens.push({ mint: String(body.mints[i]), amount: normalizeAmount(body.amounts[i], TOAD_DECIMALS) });
    }
  }

  if (tokens.length === 0 && body.mint && body.amount) {
    tokens.push({ mint: String(body.mint), amount: normalizeAmount(body.amount, TOAD_DECIMALS) });
  }

  return tokens;
}

function buildWhaleActivityFromPayload(payload: any, solUsdPrice: number): WhaleActivity | null {
  if (!TOAD_MINT) return null;
  const signature = String(payload?.signature ?? payload?.transactionSignature ?? payload?.txHash ?? payload?.txid ?? "");
  const timestamp = typeof payload?.timestamp === "number" ? payload.timestamp * 1000 : typeof payload?.blockTime === "number" ? payload.blockTime * 1000 : Date.now();
  const wallet = String(payload?.wallet ?? payload?.user ?? payload?.owner ?? payload?.payer ?? payload?.source ?? "");
  const venue = String(payload?.venue ?? payload?.dex ?? payload?.protocol ?? "Jupiter") as WhaleActivity["venue"];
  const rawTokens = parseEventTokens(payload);

  const toadToken = rawTokens.find((token) => token.mint === TOAD_MINT);
  const solToken = rawTokens.find((token) => token.mint === SOL_MINT);
  if (!toadToken) return null;

  const tokenAmount = Math.abs(toadToken.amount);
  const priceUsd = solToken && tokenAmount > 0 ? (solToken.amount * solUsdPrice) / tokenAmount : Number(payload?.priceUsd ?? payload?.price ?? 0);
  const usdValue = tokenAmount * priceUsd;
  const side = payload?.side === "sell" || payload?.side === "Sell" || toadToken.amount < 0 ? "sell" : "buy";

  return {
    id: signature || `${wallet}-${timestamp}`,
    signature,
    wallet,
    side: side as WhaleActivity["side"],
    tokenAmount,
    usdValue,
    priceUsd,
    timestamp,
    venue: (venue as WhaleActivity["venue"]) ?? "Jupiter",
    badges: [],
    balanceAfter: 0,
    isNewPosition: false,
  };
}

async function fetchSolUsdPrice(): Promise<number> {
  const priceApiUrl = process.env.NEXT_PUBLIC_PRICE_API_URL;
  if (!priceApiUrl) {
    throw new Error("NEXT_PUBLIC_PRICE_API_URL is not configured");
  }

  const url = `${priceApiUrl.replace(/\/+$/, "")}?ids=${encodeURIComponent(SOL_MINT)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch SOL price: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const rawData = payload?.data;
  const entries = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === "object"
    ? Object.values(rawData)
    : [];
  const solEntry = entries.find((item: any) => String(item?.id).toLowerCase() === SOL_MINT.toLowerCase()) ?? entries[0];
  const priceUsd = Number(solEntry?.priceUsd ?? solEntry?.price ?? solEntry?.priceUsdString);
  if (!priceUsd || Number.isNaN(priceUsd)) {
    throw new Error("Unable to parse SOL price from price API");
  }
  return priceUsd;
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const payload = body?.data ? body.data : body;
  const solUsdPrice = await fetchSolUsdPrice().catch(() => 0);
  const activity = buildWhaleActivityFromPayload(payload, solUsdPrice);
  if (!activity) {
    return new Response("Unsupported Helius payload", { status: 400 });
  }

  return new Response(JSON.stringify({ activity }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
