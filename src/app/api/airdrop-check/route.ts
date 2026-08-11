import { fetchDuneQueryRows, getAirdropRowsForAddress } from "@/services/duneService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.trim() ?? "";

  if (!address) {
    return new Response(JSON.stringify({ error: "address is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let demo = false;
  try {
    const queryId = process.env.NEXT_PUBLIC_TOAD_DUNE_QUERY_ID ?? "";
    const rows = await fetchDuneQueryRows(queryId);
    const { amount, rows: addressRows } = getAirdropRowsForAddress(rows, address);

    return new Response(JSON.stringify({
      wallet: address,
      airdropped: amount > 0,
      amount,
      demo,
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    demo = true;
    return new Response(JSON.stringify({
      wallet: address,
      airdropped: false,
      amount: 0,
      demo,
      error: (error as Error).message,
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}
