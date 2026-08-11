"use client";

import { Check, Lock } from "lucide-react";
import { ToadSprite } from "@/components/mascot/toad-sprite";
import { cn, formatDate, formatUsd } from "@/lib/utils";
import type { MarketCapMilestone } from "@/lib/types";

export type MilestoneStatus = "reached" | "current" | "locked";

export function milestoneStatus(index: number, currentIndex: number): MilestoneStatus {
  if (index <= currentIndex) return "reached";
  if (index === currentIndex + 1) return "current";
  return "locked";
}

/**
 * A single lily pad on the journey. Shared by the horizontal (desktop) and
 * vertical (mobile) layouts — only the wrapper differs.
 */
export function MilestoneNode({
  milestone,
  status,
  selected,
  onSelect,
  showToad,
  orientation,
}: {
  milestone: MarketCapMilestone;
  status: MilestoneStatus;
  selected: boolean;
  onSelect: () => void;
  /** The mascot perches on the wallet's current position. */
  showToad?: boolean;
  orientation: "horizontal" | "vertical";
}) {
  const reached = status === "reached";
  const current = status === "current";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${milestone.label} — ${formatUsd(milestone.target)} market cap, ${
        reached ? "reached" : current ? "next milestone" : "not yet reached"
      }`}
      className={cn(
        "group relative flex shrink-0 outline-none",
        orientation === "horizontal" ? "w-[92px] flex-col items-center" : "w-full items-center gap-3.5 text-left"
      )}
    >
      {/* Pad */}
      <span className="relative grid place-items-center">
        {showToad && (
          <span
            className="pointer-events-none absolute -top-[30px] left-1/2 -translate-x-1/2 animate-float"
            aria-hidden
          >
            <ToadSprite size={30} pose="idle" />
          </span>
        )}

        {current && (
          <span
            className="absolute inset-0 animate-pulse-ring rounded-full border border-toad-400/60"
            aria-hidden
          />
        )}

        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full border text-[17px] transition-all duration-300",
            reached && "border-toad-400/55 bg-toad-500/[0.18] shadow-glow",
            current && "border-toad-300/70 bg-toad-500/[0.13]",
            status === "locked" && "border-white/[0.09] bg-white/[0.03] grayscale",
            selected && "scale-110 ring-2 ring-toad-400/60 ring-offset-2 ring-offset-ink-950",
            !selected && "group-hover:scale-105"
          )}
        >
          <span className={cn(status === "locked" && "opacity-45")} aria-hidden>
            {milestone.emoji}
          </span>

          {reached && (
            <span
              className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-toad-500 text-ink-950"
              aria-hidden
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3.4} />
            </span>
          )}
          {status === "locked" && (
            <span
              className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-white/10 bg-ink-850 text-white/[0.42]"
              aria-hidden
            >
              <Lock className="h-2 w-2" strokeWidth={2.6} />
            </span>
          )}
        </span>
      </span>

      {/* Label */}
      <span
        className={cn(
          orientation === "horizontal" ? "mt-3 text-center" : "min-w-0 flex-1",
          "block"
        )}
      >
        <span
          className={cn(
            "block truncate text-[12px] font-semibold leading-tight transition-colors",
            reached ? "text-white/85" : current ? "text-toad-200" : "text-white/[0.48]"
          )}
        >
          {milestone.label}
        </span>
        <span
          className={cn(
            "tnum mt-0.5 block text-[11px] font-medium",
            current ? "text-toad-300/80" : "text-white/45"
          )}
        >
          {formatUsd(milestone.target, { decimals: 0 })}
        </span>
        {orientation === "vertical" && (
          <span className="mt-0.5 block truncate text-[11px] italic text-white/40">
            {reached && milestone.reachedAt
              ? formatDate(milestone.reachedAt)
              : current
                ? "Next up"
                : "Not yet reached"}
          </span>
        )}
      </span>
    </button>
  );
}
