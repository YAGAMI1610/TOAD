"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { cn, isValidSolanaAddress } from "@/lib/utils";
import type { AirdropCheckResult } from "@/lib/types";

export function AirdropChecker() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<AirdropCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAddress = async () => {
    setError(null);
    setResult(null);

    if (!isValidSolanaAddress(address)) {
      setError("Enter a valid Solana address first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/airdrop-check?address=${encodeURIComponent(address)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const payload = await response.json();
      setResult(payload as AirdropCheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Paste a Solana wallet address"
          aria-label="Wallet address"
        />
        <Button onClick={checkAddress} disabled={loading}>
          {loading ? "Checking…" : "Check wallet"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={cn("rounded-2xl border p-5 text-sm", result.airdropped ? "border-toad-500/30 bg-toad-500/10 text-toad-100" : "border-white/10 bg-white/[0.04] text-white/[0.92]")}>
          <p className="text-[13px] font-semibold">
            {result.airdropped ? "Airdropped" : "Not found in the Dune airdrop data"}
          </p>
          {result.airdropped ? (
            <p className="mt-2 text-[15px] font-bold text-white">{result.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} TOAD</p>
          ) : null}
          <p className="mt-3 text-[12px] text-white/[0.64]">
            {result.demo
              ? "Demo fallback used because DUNE_API_KEY isn’t configured or the query could not be fetched."
              : "Live Dune query result. DUNE_API_KEY is only used on the server."}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
