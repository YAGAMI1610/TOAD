"use client";

import { useCallback, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { SectionHeading } from "@/components/shared/section-heading";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { ShareCardDialog } from "@/components/shared/share-card-dialog";
import { MilestoneNode, milestoneStatus } from "./milestone-node";
import { useAsync, usePrefersReducedMotion } from "@/lib/hooks";
import { cn, formatDate, formatPct, formatUsd } from "@/lib/utils";
import { renderJourneyCard } from "@/lib/shareCard";
import { marketCapService } from "@/services/marketCapService";
import { isDemoMode } from "@/services/config";
import type { JourneyState } from "@/lib/types";

/**
 * "Road to the Moon" — the milestone ladder from $1M to $10B.
 *
 * Horizontal lily-pad hop on desktop, vertical path on mobile. Both read from
 * the same `JourneyState`, so the layout switch can't drift out of sync.
 */
export function ToadJourney() {
  const { data, status, error, reload } = useAsync(() => marketCapService.getJourney(), []);
  const [selected, setSelected] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  const activeIndex = selected ?? (data ? Math.min(data.currentIndex + 1, data.milestones.length - 1) : 0);

  const renderCard = useCallback(async () => {
    if (!data) throw new Error("Journey data hasn't loaded yet.");
    return renderJourneyCard(data, isDemoMode);
  }, [data]);

  const tweetText = useMemo(() => {
    if (!data) return "Watching the $TOAD journey to $10B. 🐸";
    const next = data.next;
    return next
      ? `$TOAD is at ${formatUsd(data.marketCapUsd)} — ${data.progressPct.toFixed(0)}% of the way to ${next.emoji} ${next.label} (${formatUsd(next.target, { decimals: 0 })}).\n\nEvery lily pad is a milestone. 🐸`
      : `$TOAD cleared every milestone on the board. We were always inevitable. 🐸🏆`;
  }, [data]);

  return (
    <section className="relative">
      <SectionHeading
        eyebrow="Road to the moon"
        title={
          <span className="flex items-center gap-2.5">
            <span aria-hidden>🐸</span> The TOAD Journey
          </span>
        }
        subtitle={<span className="italic">Every lily pad is a milestone.</span>}
        showDemoTag
        action={
          data && (
            <ShareCardDialog
              render={renderCard}
              tweetText={tweetText}
              triggerLabel="Share The Journey"
              title="Share the journey"
              description="A snapshot of where $TOAD stands on the road to $10B."
              filename="toad-journey.png"
            />
          )
        }
      />

      {status === "error" ? (
        <ErrorState title="Couldn't load the journey" description={error?.message} onRetry={reload} />
      ) : !data ? (
        <JourneySkeleton />
      ) : (
        <div className="space-y-5">
          <CurrentPosition journey={data} />

          <Card className="relative overflow-hidden">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />

            {/* Desktop: horizontal hop */}
            <div className="relative hidden px-6 py-8 md:block">
              <JourneyTrack journey={data} reduced={reduced} />
              <div className="no-scrollbar relative flex justify-between gap-1 overflow-x-auto pb-1">
                {data.milestones.map((m, i) => (
                  <MilestoneNode
                    key={m.id}
                    milestone={m}
                    status={milestoneStatus(i, data.currentIndex)}
                    selected={activeIndex === i}
                    onSelect={() => setSelected(i)}
                    showToad={i === Math.max(0, data.currentIndex)}
                    orientation="horizontal"
                  />
                ))}
              </div>
            </div>

            {/* Mobile: vertical path */}
            <div className="relative px-4 py-6 md:hidden">
              <span
                className="absolute bottom-10 left-[42px] top-10 w-px bg-gradient-to-b from-toad-400/60 via-toad-500/25 to-white/[0.06]"
                aria-hidden
              />
              <ul className="relative space-y-4">
                {data.milestones.map((m, i) => (
                  <li key={m.id}>
                    <MilestoneNode
                      milestone={m}
                      status={milestoneStatus(i, data.currentIndex)}
                      selected={activeIndex === i}
                      onSelect={() => setSelected(i)}
                      showToad={i === Math.max(0, data.currentIndex)}
                      orientation="vertical"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <MilestoneDetail journey={data} index={activeIndex} />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The glowing trail behind the desktop pads                           */
/* ------------------------------------------------------------------ */

function JourneyTrack({ journey, reduced }: { journey: JourneyState; reduced: boolean }) {
  const count = journey.milestones.length;
  // Pads are evenly distributed, so the trail ends mid-way through the current pad.
  const cleared = ((journey.currentIndex + 0.5) / count) * 100;
  const partial = ((journey.currentIndex + 0.5 + journey.progressPct / 100) / count) * 100;

  return (
    <div className="pointer-events-none absolute inset-x-6 top-[54px]" aria-hidden>
      <div className="relative h-[3px] rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-toad-600 to-toad-400 shadow-[0_0_18px_-2px_rgba(31,220,167,0.75)]"
          style={{ width: `${Math.max(0, cleared)}%` }}
        />
        {/* Dashed segment showing progress toward the next pad */}
        <div
          className={cn(
            "absolute inset-y-0 rounded-full bg-toad-400/45",
            !reduced && "animate-pulse"
          )}
          style={{ left: `${Math.max(0, cleared)}%`, width: `${Math.max(0, partial - cleared)}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Current position                                                    */
/* ------------------------------------------------------------------ */

function CurrentPosition({ journey }: { journey: JourneyState }) {
  const next = journey.next;

  return (
    <Card className="p-5">
      <div className="grid gap-5 sm:grid-cols-3 sm:items-end">
        <div>
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.56]">
            Current Market Cap
            <InfoHint>Circulating supply multiplied by the current $TOAD price.</InfoHint>
          </p>
          <p className="mt-2 font-display text-[30px] font-bold leading-none tracking-[-0.02em] text-white">
            <AnimatedNumber value={journey.marketCapUsd} format={(n) => formatUsd(n)} />
          </p>
        </div>

        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.56]">Next Milestone</p>
          <p className="mt-2 font-display text-[19px] font-bold leading-tight text-toad-200">
            {next ? (
              <>
                <span aria-hidden>{next.emoji}</span> {next.label}
              </>
            ) : (
              "🏆 All milestones cleared"
            )}
          </p>
          {next && (
            <p className="tnum mt-1 text-[12.5px] text-white/[0.56]">
              {formatUsd(next.target, { decimals: 0 })} · {journey.multipleToNext.toFixed(1)}x from here
            </p>
          )}
        </div>

        <div className="sm:text-right">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.56]">Progress</p>
          <p className="tnum mt-2 font-display text-[19px] font-bold text-white">
            {journey.progressPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={Math.round(journey.progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={next ? `Progress to ${next.label}` : "Journey complete"}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-toad-600 via-toad-400 to-toad-200 shadow-[0_0_20px_-4px_rgba(31,220,167,0.9)] transition-[width] duration-1000 ease-out"
          style={{ width: `${Math.max(2, journey.progressPct)}%` }}
        />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Milestone detail                                                    */
/* ------------------------------------------------------------------ */

function MilestoneDetail({ journey, index }: { journey: JourneyState; index: number }) {
  const milestone = journey.milestones[index];
  if (!milestone) return null;

  const status = milestoneStatus(index, journey.currentIndex);
  const awayPct = ((milestone.target - journey.marketCapUsd) / journey.marketCapUsd) * 100;

  return (
    <Card className="animate-fade-in p-5" key={milestone.id}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-bold tracking-tight text-white">
            <span aria-hidden>{milestone.emoji}</span> {formatUsd(milestone.target, { decimals: 0 })}{" "}
            {milestone.label}
          </h3>
          <p className="mt-1.5 text-[14px] italic text-toad-200/90">&ldquo;{milestone.flavor}&rdquo;</p>
          <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-white/60">{milestone.meaning}</p>
        </div>

        <div className="shrink-0 sm:text-right">
          {status === "reached" ? (
            <>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-toad-300">Reached</p>
              <p className="tnum mt-1 text-[14px] font-semibold text-white/80">
                {milestone.reachedAt ? formatDate(milestone.reachedAt) : "—"}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-white/[0.48]">
                Not yet reached
              </p>
              <p className="tnum mt-1 text-[14px] font-semibold text-white/80">
                {formatPct(awayPct, { sign: false, decimals: 0 })} away
              </p>
              <p className="tnum mt-0.5 text-[12px] text-white/[0.48]">
                {(milestone.target / journey.marketCapUsd).toFixed(1)}x from here
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function JourneySkeleton() {
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
      </Card>
      <Skeleton className="h-[190px] w-full rounded-2xl" />
    </div>
  );
}
