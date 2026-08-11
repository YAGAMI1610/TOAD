"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn, copyToClipboard, solscanAddressUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * The official $TOAD SPL token address. Kept in one place so it can never drift
 * out of sync between the sections that display it.
 */
export const TOAD_CONTRACT_ADDRESS = "A13oRB9FFaiUjfi6LdCg6p9ka1u8SfGkUFs4SKvPpump";

interface ContractAddressProps {
  className?: string;
  /** Compact renders as a single-line pill for tight spaces (e.g. footer). */
  variant?: "full" | "compact";
}

/**
 * The canonical, always-visible $TOAD contract address block. Full precision,
 * no truncation — this is the one string on the site that must never be
 * shortened, since people paste it straight into a swap.
 */
export function ContractAddress({ className, variant = "full" }: ContractAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(TOAD_CONTRACT_ADDRESS);
    if (ok) {
      setCopied(true);
      toast.success("Contract address copied", { description: "$TOAD — paste it straight into your wallet." });
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy address");
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("glass flex items-center gap-2 rounded-xl px-3 py-2", className)}>
        <span className="truncate font-mono text-[11.5px] text-white/70">{TOAD_CONTRACT_ADDRESS}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy $TOAD contract address"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-white/[0.08] hover:text-toad-300"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-toad-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass glass-ring card-sheen relative overflow-hidden rounded-2xl p-5 sm:p-6",
        className
      )}
    >
      <div aria-hidden className="pond-texture absolute inset-0 opacity-[0.35]" />
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-toad-500/[0.14] blur-[60px]"
      />

      <div className="relative">
        <p className="text-label text-toad-400/85">$TOAD Contract Address</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-white/[0.55]">
          Solana SPL token. Always verify this exact address before swapping — copy it, don&apos;t retype it.
        </p>

        <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-white/[0.08] bg-ink-950/60 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-3.5">
          <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] leading-relaxed text-white/85 sm:whitespace-nowrap sm:truncate sm:text-[13px]">
            {TOAD_CONTRACT_ADDRESS}
          </code>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              onClick={handleCopy}
              variant={copied ? "outline" : "primary"}
              size="sm"
              className="w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Address
                </>
              )}
            </Button>

            <Button asChild variant="ghost" size="icon-sm" title="View on Solscan">
              <a href={solscanAddressUrl(TOAD_CONTRACT_ADDRESS)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
