"use client";

/**
 * The feed's "LIVE" indicator.
 *
 * A dot with an expanding ring behind it, plus the word LIVE — the ring is what
 * sells it as a stream rather than a static list. When the feed is paused the
 * ring stops and the whole pill desaturates, so the state is obvious at a
 * glance and readable without relying on the animation.
 */

import { cn } from "@/lib/utils";

export function LivePill({
  paused,
  label,
  className,
}: {
  paused?: boolean;
  /** Extra context shown after the word, e.g. a count. */
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm transition-colors duration-300",
        paused
          ? "border-white/[0.12] bg-white/[0.04] text-white/50"
          : "border-toad-500/30 bg-toad-500/[0.10] text-toad-200 shadow-[0_0_20px_-10px_rgba(0,200,150,0.7)]",
        className
      )}
      role="status"
      aria-live="off"
    >
      <LiveDot paused={paused} />
      {paused ? "Paused" : "Live"}
      {label && (
        <>
          <span aria-hidden className={paused ? "text-white/25" : "text-toad-500/40"}>
            /
          </span>
          <span className="tnum font-semibold tracking-normal">{label}</span>
        </>
      )}
    </span>
  );
}

/** The dot on its own, for tight spots like the network indicator. */
export function LiveDot({ paused, className }: { paused?: boolean; className?: string }) {
  return (
    <span className={cn("relative flex h-1.5 w-1.5 shrink-0", className)} aria-hidden>
      {!paused && (
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-toad-400" />
      )}
      <span
        className={cn(
          "relative inline-flex h-1.5 w-1.5 rounded-full",
          paused ? "bg-white/35" : "bg-toad-400 shadow-[0_0_8px_1px_rgba(31,220,167,0.8)]"
        )}
      />
    </span>
  );
}
