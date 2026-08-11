"use client";

import { useState } from "react";
import { Wallet2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";
import { FEATURED_WALLETS } from "@/lib/mockData";

/**
 * Demo wallet connection.
 *
 * There is no wallet adapter wired up — connecting simulates a session so the
 * "your wallet" affordances are testable. The toast says so explicitly rather
 * than implying a real signature took place.
 */
export function ConnectWalletButton() {
  const [connected, setConnected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const connect = async () => {
    setPending(true);
    await new Promise((r) => setTimeout(r, 700));
    const address = FEATURED_WALLETS[2];
    setConnected(address);
    setPending(false);
    toast.success("Demo wallet connected", {
      description: "Simulated session — no wallet adapter is wired up yet.",
    });
  };

  const disconnect = () => {
    setConnected(null);
    toast("Wallet disconnected");
  };

  if (connected) {
    return (
      <Button variant="secondary" size="sm" onClick={disconnect} className="gap-1.5 font-mono text-[12px]">
        <Check className="h-3.5 w-3.5 text-toad-400" />
        <span className="hidden sm:inline">{shortenAddress(connected, 4, 4)}</span>
        <span className="sm:hidden">{shortenAddress(connected, 3, 3)}</span>
      </Button>
    );
  }

  return (
    <Button variant="primary" size="sm" onClick={connect} disabled={pending} className="shrink-0">
      <Wallet2 className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{pending ? "Connecting…" : "Connect Wallet"}</span>
      <span className="sm:hidden">{pending ? "…" : "Connect"}</span>
    </Button>
  );
}
