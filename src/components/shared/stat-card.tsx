"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/tooltip";
import { Perch } from "@/components/mascot/perch";
import { cn, formatPct } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Delta pill                                                          */
/* ------------------------------------------------------------------ */

export function Delta({
  value,
  suffix,
  className,
  size = "md",
}: {
  value: number;
  suffix?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
        size === "sm" ? "text-[11px]" : "text-[12px]",
        up ? "bg-toad-500/10 text-toad-300" : "bg-ember-500/10 text-ember-300",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.4} />
      {formatPct(Math.abs(value), { sign: false })}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  /** Explains what the metric actually measures — required for honesty. */
  hint?: string;
  icon?: React.ReactNode;
  accent?: "toad" | "ember" | "foam" | "lily" | "neutral";
  /** The headline number. Rendered large, tabular, and perch-able. */
  value: React.ReactNode;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  perchKey?: string;
  /** Mascot celebrates when landing on a big-number card. */
  celebrate?: boolean;
}

const ACCENT_WASH: Record<NonNullable<StatCardProps["accent"]>, string> = {
  toad: "from-toad-500/[0.13]",
  ember: "from-ember-500/[0.12]",
  foam: "from-foam-500/[0.12]",
  lily: "from-lily-500/[0.12]",
  neutral: "from-white/[0.05]",
};

export function StatCard({
  label,
  hint,
  icon,
  accent = "neutral",
  value,
  sub,
  footer,
  onClick,
  className,
  perchKey,
  celebrate,
}: StatCardProps) {
  const clickable = Boolean(onClick);

  return (
    <Perch reaction={celebrate ? "number" : "plain"} perchKey={perchKey} className={cn("h-full", className)}>
      <Card
        interactive={clickable}
        onClick={onClick}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        className={cn("group h-full", clickable && "cursor-pointer")}
      >
        {/* Accent wash in the top-left corner, not a full neon flood */}
        <div
          className={cn(
            "pointer-events-none absolute -left-10 -top-14 h-32 w-40 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-500",
            ACCENT_WASH[accent],
            clickable ? "opacity-70 group-hover:opacity-100" : "opacity-70"
          )}
        />

        <div className="relative flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center gap-1.5">
            {icon && <span className="text-white/[0.48]">{icon}</span>}
            <span className="text-label text-white/[0.56]">{label}</span>
            {hint && <InfoHint>{hint}</InfoHint>}
          </div>

          <div className="tnum mt-3.5 font-display text-[28px] font-bold leading-none tracking-[-0.025em] text-white sm:text-[31px]">
            {value}
          </div>

          {sub && <div className="mt-3 text-[13px] leading-[1.55] text-white/60">{sub}</div>}

          {footer && <div className="mt-auto pt-5">{footer}</div>}
        </div>
      </Card>
    </Perch>
  );
}

/* ------------------------------------------------------------------ */
/* Mini row used inside stat cards (label ······ value)                */
/* ------------------------------------------------------------------ */

export function StatRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <span className="text-white/[0.52]">{label}</span>
      <span
        className={cn(
          "tnum font-semibold",
          tone === "up" && "text-toad-300",
          tone === "down" && "text-ember-300",
          tone === "neutral" && "text-white/80"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * On mobile the four dashboard cards become a snap-scrolling row so the fold
 * still shows a full card plus a hint of the next one.
 */
export function StatCardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-scrollbar snap-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 xl:grid-cols-4">
      {React.Children.map(children, (child, i) => (
        <div
          key={i}
          className="animate-fade-up w-[78vw] max-w-[300px] shrink-0 sm:w-auto sm:max-w-none"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
