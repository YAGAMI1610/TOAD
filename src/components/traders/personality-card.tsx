"use client";

import { useCallback } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareCardDialog } from "@/components/shared/share-card-dialog";
import { Perch } from "@/components/mascot/perch";
import { cn, copyToClipboard, formatDuration, formatPct, formatUsd } from "@/lib/utils";
import { renderPersonalityCard } from "@/lib/shareCard";
import { isDemoMode } from "@/services/config";
import type { TraderProfile } from "@/lib/types";
import { PERSONALITY_ACCENT } from "./personality-accent";

/**
 * The reveal card. Everything above the fold on a personality result:
 * archetype, why it was chosen, and the five headline stats.
 */
export function PersonalityCard({ profile }: { profile: TraderProfile }) {
  const { personality, metrics, pnl } = profile;
  const accent = PERSONALITY_ACCENT[personality.accent];

  const renderCard = useCallback(
    () => renderPersonalityCard(profile, isDemoMode),
    [profile]
  );

  const copyLink = async () => {
    const url = `${window.location.origin}/wallet/${profile.wallet.address}`;
    const ok = await copyToClipboard(url);
    toast[ok ? "success" : "error"](ok ? "Profile link copied" : "Couldn't copy the link");
  };

  return (
    <Perch reaction="number" perchKey="personality-card">
      <Card className={cn("animate-fade-up relative overflow-hidden", accent.glow)}>
        <div
          className={cn("pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full blur-3xl", accent.bg)}
          aria-hidden
        />

        <div className="relative p-5 sm:p-7">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/[0.52]">
            Your TOAD Personality
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3.5">
                <span
                  className={cn(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border text-[28px]",
                    accent.border,
                    accent.bg
                  )}
                  aria-hidden
                >
                  {personality.emoji}
                </span>
                <div className="min-w-0">
                  <h2
                    className={cn(
                      "font-display text-[24px] font-extrabold uppercase leading-tight tracking-[-0.01em] sm:text-[30px]",
                      accent.text
                    )}
                  >
                    {personality.name}
                  </h2>
                  <p className="mt-0.5 text-[13.5px] text-white/60">{personality.tagline}</p>
                </div>
              </div>

              <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/[0.68]">{personality.description}</p>

              <p className={cn("mt-3 text-[14px] italic", accent.text)}>&ldquo;{personality.quote}&rdquo;</p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <Badge tone={accent.badge} title="How decisively this archetype beat the runners-up">
                {personality.confidence}% match
              </Badge>
              {personality.alternates.length > 0 && (
                <p className="text-[11.5px] text-white/[0.48] sm:text-right">
                  Also reads as{" "}
                  {personality.alternates.slice(0, 2).map((alt, i) => (
                    <span key={alt.id}>
                      {i > 0 && " · "}
                      <span aria-hidden>{alt.emoji}</span> {alt.name.replace("The ", "")}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>

          {/* Why this archetype */}
          {personality.reasons.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {personality.reasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-white/65"
                >
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {/* Headline stats */}
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-5">
            <HeroStat label="Win Rate" value={`${Math.round(metrics.winRatePct)}%`} />
            <HeroStat label="Total Trades" value={metrics.totalTrades.toLocaleString()} />
            <HeroStat
              label="Realized PnL"
              value={formatUsd(pnl.realizedUsd, { sign: true })}
              tone={pnl.realizedUsd >= 0 ? "up" : "down"}
            />
            <HeroStat
              label="Best Trade"
              value={formatUsd(metrics.bestTradeUsd, { sign: true })}
              tone={metrics.bestTradeUsd >= 0 ? "up" : "down"}
            />
            <HeroStat
              label="Average Hold"
              value={formatDuration(metrics.avgHoldHours)}
              className="col-span-2 sm:col-span-1"
            />
          </dl>

          {/* Share */}
          <div className="mt-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.52]">Share Your TOAD</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <ShareCardDialog
                render={renderCard}
                tweetText={`I'm ${personality.emoji} ${personality.name} on TOAD Intelligence.\n\n"${personality.quote}"\n\nFind your $TOAD personality 🐸`}
                triggerLabel="Share Your TOAD"
                title="Your shareable TOAD card"
                description="Copy the image, then paste it into your post."
                filename="my-toad-personality.png"
              />
              <Button variant="secondary" size="sm" onClick={copyLink}>
                <Link2 className="h-3.5 w-3.5" />
                Copy Profile Link
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Perch>
  );
}

function HeroStat({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "up" | "down";
  className?: string;
}) {
  return (
    <div className={cn("bg-ink-900/70 px-3.5 py-3", className)}>
      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/[0.48]">{label}</dt>
      <dd
        className={cn(
          "tnum mt-1 font-display text-[16px] font-bold leading-tight sm:text-[17px]",
          tone === "up" && "text-toad-300",
          tone === "down" && "text-ember-300",
          tone === "neutral" && "text-white"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
