"use client";

import { Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn, copyToClipboard, shortenAddress, solscanAddressUrl } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface WalletAddressProps {
  address: string;
  label?: string;
  head?: number;
  tail?: number;
  className?: string;
  /** Turns the address itself into a link to the trader profile. */
  linkToProfile?: boolean;
  showCopy?: boolean;
  showExplorer?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * The address chip used everywhere: monospace, copyable, explorer-linked.
 * Copy and explorer buttons are real controls with their own hit areas so they
 * never swallow a surrounding card's click.
 */
export function WalletAddress({
  address,
  label,
  head = 4,
  tail = 4,
  className,
  linkToProfile,
  showCopy = true,
  showExplorer = true,
  size = "md",
}: WalletAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      toast.success("Address copied", { description: shortenAddress(address, 8, 8) });
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Couldn't copy address");
    }
  };

  const textSize = size === "sm" ? "text-[11.5px]" : size === "lg" ? "text-sm" : "text-[12.5px]";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const display = label ?? shortenAddress(address, head, tail);

  /**
   * The icon buttons stay visually small — a 44px box next to 12px monospace in
   * a feed row would tower over the text. The touch target is grown instead with
   * an invisible centred overlay, so the tap area clears 48px of height on mobile
   * without changing a single pixel of layout.
   *
   * The overlay is 48×36 rather than square on purpose: the `lg` header renders
   * both controls at `gap-2`, and two 28px buttons 8px apart have their centres
   * 36px apart — so anything wider than 36px would make the explorer overlay
   * swallow part of the copy button's hit area. 36px wide means they meet
   * exactly and never overlap. Height is what the 48px floor is about anyway.
   */
  const control =
    "group/ctl relative grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80 " +
    "before:absolute before:left-1/2 before:top-1/2 before:h-12 before:w-9 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] sm:before:hidden";

  return (
    <span className={cn("inline-flex items-center", size === "lg" ? "gap-2" : "gap-1", className)}>
      {linkToProfile ? (
        <Link
          href={`/wallet/${address}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "truncate rounded font-mono text-white/80 transition-colors hover:text-toad-300 hover:underline hover:underline-offset-2",
            textSize
          )}
        >
          {display}
        </Link>
      ) : (
        <span className={cn("truncate font-mono text-white/75", textSize)}>{display}</span>
      )}

      {showCopy && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={`Copy address ${address}`}
              className={control}
            >
              {copied ? (
                <Check className={cn(iconSize, "text-toad-400")} />
              ) : (
                <Copy className={iconSize} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Copy full address</TooltipContent>
        </Tooltip>
      )}

      {showExplorer && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={solscanAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="View on Solscan"
              className={control}
            >
              <ExternalLink className={iconSize} />
            </a>
          </TooltipTrigger>
          <TooltipContent>Open on Solscan</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
