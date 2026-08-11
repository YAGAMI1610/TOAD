import { fetchDuneQueryRows, buildTraderProfile, getAirdropRowsForAddress } from "@/services/duneService";

interface TraderResponse {
  profile?: unknown;
  error?: string;
}

export async function GET(request: Request, { params }: { params: { address: string } }) {
  const address = decodeURIComponent(params.address ?? "").trim();
  if (!address) {
    return new Response(JSON.stringify({ error: "address is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const queryId = process.env.NEXT_PUBLIC_TOAD_DUNE_QUERY_ID ?? "";
    const rows = await fetchDuneQueryRows(queryId);
    const profile = await buildTraderProfile(address);
    const airdropResult = getAirdropRowsForAddress(rows, address);

    return new Response(JSON.stringify({ profile, airdrop: airdropResult }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
