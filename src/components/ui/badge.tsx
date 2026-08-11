import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { WalletBadge } from "@/lib/types";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] whitespace-nowrap backdrop-blur-sm",
  {
    variants: {
      tone: {
        neutral: "border-white/[0.12] bg-white/[0.055] text-white/70",
        toad: "border-toad-500/30 bg-toad-500/[0.11] text-toad-200",
        ember: "border-ember-500/30 bg-ember-500/[0.11] text-ember-300",
        foam: "border-foam-500/30 bg-foam-500/[0.11] text-foam-300",
        lily: "border-lily-400/30 bg-lily-400/[0.11] text-lily-300",
        orchid: "border-orchid-500/30 bg-orchid-500/[0.11] text-orchid-300",
      },
      size: {
        sm: "px-1.5 py-0 text-[9.5px]",
        md: "",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Wallet badge mapping                                                */
/* ------------------------------------------------------------------ */

export const WALLET_BADGE_META: Record<
  WalletBadge,
  { label: string; emoji: string; tone: NonNullable<BadgeProps["tone"]>; hint: string }
> = {
  "mega-whale": {
    label: "Mega Whale",
    emoji: "🦈",
    tone: "orchid",
    hint: "Holds 3% or more of total $TOAD supply.",
  },
  whale: {
    label: "Whale",
    emoji: "🐋",
    tone: "foam",
    hint: "Holds at least 0.4% of total $TOAD supply.",
  },
  "toad-og": {
    label: "TOAD OG",
    emoji: "🐸",
    tone: "toad",
    hint: "Has held $TOAD since the first weeks of trading.",
  },
  "top-10": {
    label: "Top 10 Holder",
    emoji: "🏅",
    tone: "lily",
    hint: "Ranked in the ten largest $TOAD wallets.",
  },
  fresh: {
    label: "Fresh Wallet",
    emoji: "✨",
    tone: "neutral",
    hint: "First $TOAD activity within the last week.",
  },
  exchange: {
    label: "Exchange",
    emoji: "🏦",
    tone: "neutral",
    hint: "Known custodial or routing wallet — not an individual trader.",
  },
  "smart-money": {
    label: "Smart Money",
    emoji: "🧠",
    tone: "toad",
    hint: "Consistently profitable across realised $TOAD exits.",
  },
};

export function WalletBadges({
  badges,
  max = 3,
  size = "md",
  className,
}: {
  badges: WalletBadge[];
  max?: number;
  size?: BadgeProps["size"];
  className?: string;
}) {
  if (!badges.length) return null;
  const shown = badges.slice(0, max);
  const overflow = badges.length - shown.length;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {shown.map((b) => {
        const meta = WALLET_BADGE_META[b];
        if (!meta) return null;
        return (
          <Badge key={b} tone={meta.tone} size={size} title={meta.hint}>
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </Badge>
        );
      })}
      {overflow > 0 && (
        <Badge tone="neutral" size={size} title={badges.slice(max).map((b) => WALLET_BADGE_META[b]?.label).join(", ")}>
          +{overflow}
        </Badge>
      )}
    </span>
  );
}
