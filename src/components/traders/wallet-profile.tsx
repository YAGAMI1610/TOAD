"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { WalletBadges } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { WalletAddress } from "@/components/shared/wallet-address";
import { SectionHeading } from "@/components/shared/section-heading";
import { ToadSprite } from "@/components/mascot/toad-sprite";
import { PersonalityCard } from "./personality-card";
import { PersonalityRadar } from "./personality-radar";
import { TradingHistory } from "./trading-history";
import { useAsync, usePrefersReducedMotion } from "@/lib/hooks";
import {
  cn,
  formatDate,
  formatDuration,
  formatPct,
  formatTokenAmount,
  formatUsd,
  isValidSolanaAddress,
} from "@/lib/utils";
import { ANALYSIS_STEPS } from "@/lib/personality";
import type { TraderProfile } from "@/lib/types";

export function WalletProfile({ address }: { address: string }) {
  const valid = isValidSolanaAddress(address);
  const { data, status, error, reload } = useAsync(async () => {
    if (!valid) return null;
    const result = await fetch(`/api/trader/${encodeURIComponent(address)}`, { cache: "no-store" });
    if (!result.ok) {
      throw new Error(`Trader API returned ${result.status}`);
    }
    const payload = await result.json();
    return payload.profile as TraderProfile | null;
  }, [address]);

  if (!valid) {
    return (
      <EmptyState
        title="That isn't a Solana address"
        description="Solana addresses are 32–44 base58 characters. Check for a missing character or a stray space."
      />
    );
  }

  if (status === "error") {
    return <ErrorState title="Couldn't analyze this wallet" description={error?.message} onRetry={reload} />;
  }

  if (status === "loading" || !data) {
    return <AnalyzingState address={address} />;
  }

  return <ProfileBody profile={data} />;
}

/* ------------------------------------------------------------------ */
/* Analyzing                                                           */
/* ------------------------------------------------------------------ */

/** Steps through the analysis copy so a 1s wait feels like work, not a stall. */
function AnalyzingState({ address }: { address: string }) {
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 230);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span className={cn(!reduced && "animate-float")}>
            <ToadSprite size={44} pose="idle" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[17px] font-bold text-white">Reading the chain</p>
            <p className="mt-0.5 truncate font-mono text-[12px] text-white/[0.52]">{address}</p>
          </div>
        </div>

        <ol className="mt-6 space-y-2">
          {ANALYSIS_STEPS.map((label, i) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-2.5 text-[13px] transition-colors duration-300",
                i < step ? "text-toad-300/70" : i === step ? "text-white/85" : "text-white/35"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  i < step ? "bg-toad-400" : i === step ? "bg-toad-300 animate-pulse" : "bg-white/15"
                )}
                aria-hidden
              />
              {label}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Skeleton className="h-[240px] rounded-2xl" />
        <Skeleton className="h-[240px] rounded-2xl" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function ProfileBody({ profile }: { profile: TraderProfile }) {
  const { wallet, holding, pnl, metrics, scores, personality, trades } = profile;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px]" aria-hidden>
                {personality.emoji}
              </span>
              <span className="text-[13px] font-semibold text-white/70">{personality.name}</span>
              <WalletBadges badges={wallet.badges} max={4} size="sm" />
            </div>

            <div className="mt-2.5">
              <WalletAddress address={wallet.address} label={wallet.label} size="lg" head={8} tail={8} />
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-white/[0.48]">
              {typeof wallet.holderRank === "number" && (
                <>
                  <span className="tnum">Rank #{wallet.holderRank} by balance</span>
                  <span>·</span>
                </>
              )}
              <span>First seen {formatDate(wallet.firstSeen)}</span>
              <span>·</span>
              <span>Last active {formatDate(wallet.lastActive)}</span>
            </p>
          </div>
        </div>
      </Card>

      <PersonalityCard profile={profile} />

      {/* Stats + radar */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.56]">Wallet Stats</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Stat
              label="Current Holdings"
              value={`${formatTokenAmount(holding.amount)} TOAD`}
              sub={formatUsd(holding.usdValue)}
              hint="Live $TOAD balance and its value at the current price."
            />
            <Stat
              label="Total Buys"
              value={metrics.buyCount.toLocaleString()}
              sub={formatUsd(metrics.largestBuyUsd) + " largest"}
            />
            <Stat
              label="Total Sells"
              value={metrics.sellCount.toLocaleString()}
              sub={metrics.largestSellUsd > 0 ? formatUsd(metrics.largestSellUsd) + " largest" : "Never sold"}
            />
            <Stat
              label="Realized PnL"
              value={formatUsd(pnl.realizedUsd, { sign: true })}
              tone={pnl.realizedUsd >= 0 ? "up" : "down"}
              hint="Profit or loss already booked by selling, using FIFO cost basis."
            />
            <Stat
              label="Unrealized PnL"
              value={formatUsd(pnl.unrealizedUsd, { sign: true })}
              tone={pnl.unrealizedUsd >= 0 ? "up" : "down"}
              hint="Paper profit or loss on the position still held, versus average cost."
            />
            <Stat
              label="Win Rate"
              value={`${Math.round(metrics.winRatePct)}%`}
              sub={`${metrics.sellCount} closed`}
              hint="Share of realised sales that closed above their cost basis."
            />
            <Stat
              label="Total Volume"
              value={formatUsd(metrics.totalVolumeUsd)}
              sub={`${metrics.totalTrades.toLocaleString()} trades`}
            />
            <Stat
              label="Avg Holding Time"
              value={formatDuration(metrics.avgHoldHours)}
              sub={`Max ${formatDuration(metrics.maxHoldHours)}`}
              hint="Mean time between a buy and the sale that closed it."
            />
            <Stat
              label="ROI"
              value={formatPct(pnl.roiPct)}
              tone={pnl.roiPct >= 0 ? "up" : "down"}
              sub={`${formatUsd(pnl.investedUsd)} in`}
              hint="Total PnL divided by USD invested."
            />
          </dl>
        </Card>

        <Card className="p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.56]">
            Personality Profile
          </p>
          <PersonalityRadar scores={scores} accent={personality.accent} />
        </Card>
      </div>

      {/* History */}
      <section>
        <SectionHeading
          title="Trading History"
          subtitle={`${trades.length.toLocaleString()} $TOAD trades, newest first.`}
          showDemoTag
        />
        <Card className="p-4 sm:p-5">
          <TradingHistory trades={trades} />
        </Card>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "up" | "down";
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.48]">
        <span className="truncate">{label}</span>
        {hint && <InfoHint>{hint}</InfoHint>}
      </dt>
      <dd>
        <p
          className={cn(
            "tnum mt-1 font-display text-[16px] font-bold leading-tight",
            tone === "up" && "text-toad-300",
            tone === "down" && "text-ember-300",
            tone === "neutral" && "text-white"
          )}
        >
          {value}
        </p>
        {sub && <p className="tnum mt-0.5 text-[11.5px] text-white/[0.48]">{sub}</p>}
      </dd>
    </div>
  );
}
