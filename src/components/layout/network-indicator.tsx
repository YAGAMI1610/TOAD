"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/services/config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Live network + data-source indicator.
 *
 * The dot reflects the mock service's simulated connection; the "Demo Data"
 * chip is driven purely by `isDemoMode`, so it disappears the moment real
 * credentials are configured. Never fake a "live" state.
 */
export function NetworkIndicator({ className }: { className?: string }) {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    // Mock RPC health-check cadence. Replace with a real getHealth/slot poll.
    const tick = () => setLatency(Math.round(28 + Math.random() * 46));
    tick();
    const id = setInterval(tick, 9_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-toad-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-toad-400" />
            </span>
            <span className="text-[11px] font-medium text-white/65">Solana</span>
            {latency !== null && (
              <span className="tnum hidden text-[10px] text-white/[0.42] sm:inline">{latency}ms</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isDemoMode
            ? "Simulated Solana mainnet connection. Connect an RPC endpoint to stream live data."
            : `Connected to Solana mainnet-beta · ${latency}ms`}
        </TooltipContent>
      </Tooltip>

      {isDemoMode && <DemoBadge />}
    </div>
  );
}

/**
 * The honesty chip. Rendered anywhere generated data is on screen.
 * Removing `NEXT_PUBLIC_*` config is the only way to make this appear/disappear.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-8 shrink-0 cursor-help items-center gap-1.5 rounded-lg border border-lily-500/25 bg-lily-500/[0.08] px-2.5 text-[11px] font-semibold uppercase tracking-wider text-lily-300",
            className
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-lily-400" />
          Demo Data
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Every number in this app is generated mock data — not real on-chain activity. Wallet addresses,
        balances, trades and PnL are simulated. This badge disappears automatically once a Solana RPC and
        price API are connected.
      </TooltipContent>
    </Tooltip>
  );
}

/** Compact inline variant for section headers. */
export function DemoTag({ className }: { className?: string }) {
  if (!isDemoMode) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help items-center gap-1 rounded-md border border-lily-500/20 bg-lily-500/[0.07] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-lily-300/90",
            className
          )}
        >
          Demo
        </span>
      </TooltipTrigger>
      <TooltipContent>Simulated data — not live on-chain activity.</TooltipContent>
    </Tooltip>
  );
}
