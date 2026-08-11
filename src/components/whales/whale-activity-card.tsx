"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, WalletBadges } from "@/components/ui/badge";
import { WalletAddress } from "@/components/shared/wallet-address";
import { Perch } from "@/components/mascot/perch";
import {
  cn,
  formatRelativeTime,
  formatTokenAmount,
  formatUsd,
  formatUsdExact,
  solscanTxUrl,
} from "@/lib/utils";
import type { WhaleActivity } from "@/lib/types";

interface WhaleActivityCardProps {
  activity: WhaleActivity;
  now: number;
  /** Newly streamed prints slide in and briefly glow. */
  isNew?: boolean;
  /** Only the first few cards are mascot perches — it shouldn't roam the whole feed. */
  perch?: boolean;
}

/**
 * One whale print.
 *
 * Buys and sells are separated four ways — rail colour, background tint, glyph,
 * and a worded label — so the distinction survives colour blindness and
 * high-contrast mode rather than resting on hue alone.
 *
 * The three facts people actually scan for are given deliberately different
 * typographic treatments so the eye can jump straight to one of them:
 *   • USD value  → large monospace, accent-tinted, right-aligned
 *   • wallet     → monospace chip, mid-weight, left-aligned
 *   • timestamp  → small uppercase caps, dimmed, clearly metadata
 */
export function WhaleActivityCard({ activity, now, isNew, perch }: WhaleActivityCardProps) {
  const isBuy = activity.side === "buy";
  const usd = activity.usdValue;
  /** $50k+ prints get the heavier treatment — this is what people scan for. */
  const isMajor = usd >= 50_000;

  const body = (
    <Card
      interactive
      ring={false}
      className={cn(
        "group relative border-white/[0.07]",
        // Subtle directional tint across the whole card, strongest at the rail.
        isBuy
          ? "bg-gradient-to-r from-toad-500/[0.075] via-toad-500/[0.022] to-transparent hover:border-toad-500/25"
          : "bg-gradient-to-r from-ember-500/[0.075] via-ember-500/[0.022] to-transparent hover:border-ember-500/25",
        isNew && "animate-slide-in-feed",
        isNew && (isBuy ? "shadow-glow" : "shadow-glow-ember")
      )}
    >
      {/* Left accent border — solid, full-height, the primary side signal */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          isBuy
            ? "bg-toad-400 shadow-[0_0_12px_0_rgba(31,220,167,0.55)]"
            : "bg-ember-400 shadow-[0_0_12px_0_rgba(255,125,109,0.5)]"
        )}
      />

      <div className="flex items-start gap-3 p-4 pl-5 sm:items-center sm:gap-4 sm:p-5 sm:pl-6">
        {/* Direction glyph */}
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[15px] transition-transform duration-300 group-hover:scale-105",
            isBuy ? "border-toad-500/30 bg-toad-500/[0.12]" : "border-ember-500/30 bg-ember-500/[0.12]"
          )}
          aria-hidden
        >
          {isBuy ? "🟢" : "🔴"}
        </span>

        <div className="min-w-0 flex-1">
          {/* Row 1 — what happened, plus wallet standing */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-[0.13em]",
                isBuy ? "text-toad-300" : "text-ember-300"
              )}
            >
              Whale {isBuy ? "Buy" : "Sell"}
            </span>

            {typeof activity.walletRank === "number" && (
              <Badge tone="neutral" size="sm" title={`Ranked #${activity.walletRank} by $TOAD balance`}>
                #{activity.walletRank}
              </Badge>
            )}

            {activity.isNewPosition && (
              <Badge tone="lily" size="sm" title="This wallet had no prior $TOAD history">
                <Sparkles className="h-2.5 w-2.5" />
                New
              </Badge>
            )}
          </div>

          {/* Row 2 — the wallet and the token size */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px]">
            <WalletAddress address={activity.wallet} linkToProfile showExplorer={false} size="sm" />
            <span className="text-white/[0.52]">{isBuy ? "bought" : "sold"}</span>
            <span className="metric text-[13.5px] font-semibold text-white/90">
              {formatTokenAmount(activity.tokenAmount)}
              <span className="ml-1 text-[11px] font-medium text-white/45">TOAD</span>
            </span>
          </div>

          {/* Row 3 — metadata, visibly demoted to small caps */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-white/[0.42]">
            <span className="tnum">{formatRelativeTime(activity.timestamp, now)}</span>
            <span aria-hidden className="text-white/20">
              •
            </span>
            <span>{activity.venue}</span>
            <span aria-hidden className="text-white/20">
              •
            </span>
            <span className="tnum normal-case tracking-normal">
              Holds {formatTokenAmount(activity.balanceAfter)}
            </span>
            <WalletBadges badges={activity.badges} max={1} size="sm" className="ml-0.5" />
          </div>
        </div>

        {/* Money column — the loudest thing on the card */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={cn(
              "metric font-bold leading-none",
              isMajor ? "text-[21px] sm:text-[24px]" : "text-[18px] sm:text-[19px]",
              isBuy ? "text-toad-300" : "text-ember-300"
            )}
            title={formatUsdExact(usd)}
          >
            {isBuy ? "+" : "−"}
            {formatUsd(usd)}
          </span>

          {isMajor && (
            <Badge tone={isBuy ? "toad" : "ember"} size="sm">
              Major print
            </Badge>
          )}

          <Link
            href={solscanTxUrl(activity.signature)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] text-white/45 transition-colors hover:text-toad-300"
          >
            {isBuy ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.2} />
            ) : (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2.2} />
            )}
            Transaction
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>
    </Card>
  );

  if (!perch) return body;

  return (
    <Perch reaction="whale" perchKey={`whale-${activity.id}`}>
      {body}
    </Perch>
  );
}
