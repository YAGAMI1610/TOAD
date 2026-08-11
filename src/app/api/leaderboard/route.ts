import { fetchDuneQueryRows, buildLeaderboardEntries } from "@/services/duneService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "top-pnl";
  const limit = Number(url.searchParams.get("limit") ?? "25");

  try {
    const queryId = process.env.NEXT_PUBLIC_TOAD_DUNE_QUERY_ID ?? "";
    const rows = await fetchDuneQueryRows(queryId);
    const priceUsd = 0;
    const entries = buildLeaderboardEntries(rows, priceUsd).slice(0, Math.max(1, Math.min(100, limit)));

    return new Response(JSON.stringify({ entries, tab }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message, entries: [] }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
