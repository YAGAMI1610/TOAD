"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { InfoHint } from "@/components/ui/tooltip";
import { ErrorState, EmptyPond } from "@/components/shared/states";
import { WalletAddress } from "@/components/shared/wallet-address";
import { useAsync } from "@/lib/hooks";
import { cn, formatUsd } from "@/lib/utils";
import { PERSONALITY_ACCENT } from "@/components/traders/personality-accent";
import type { LeaderboardEntry, LeaderboardTab } from "@/lib/types";

const TABS: Array<{ id: LeaderboardTab; label: string; hint: string; metric: string }> = [
  {
    id: "top-pnl",
    label: "Top PnL",
    hint: "Realised plus unrealised USD profit across all $TOAD activity.",
    metric: "Total PnL",
  },
  {
    id: "best-win-rate",
    label: "Best Win Rate",
    hint: "Share of closed sales booked in profit. Wallets with fewer than 10 trades are excluded.",
    metric: "Total PnL",
  },
  {
    id: "biggest-winners",
    label: "Biggest Winners",
    hint: "Ranked by the single most profitable trade.",
    metric: "Best Trade",
  },
  {
    id: "biggest-losers",
    label: "Biggest Losers",
    hint: "Ranked by the single worst trade. Someone has to sell the bottom.",
    metric: "Worst Trade",
  },
  {
    id: "most-active",
    label: "Most Active",
    hint: "Ranked by total number of $TOAD trades.",
    metric: "Total PnL",
  },
];

const GRID =
  "md:grid md:grid-cols-[46px_minmax(0,1.35fr)_minmax(0,1.05fr)_110px_84px_74px_20px] md:items-center md:gap-3";

export function Leaderboard({ limit = 25 }: { limit?: number }) {
  const [tab, setTab] = useState<LeaderboardTab>("top-pnl");
  const active = TABS.find((t) => t.id === tab)!;
  const { data, status, error, reload } = useAsync(async () => {
    const result = await fetch(`/api/leaderboard?tab=${encodeURIComponent(tab)}&limit=${encodeURIComponent(
      String(limit)
    )}`, { cache: "no-store" });
    if (!result.ok) {
      throw new Error(`Leaderboard API returned ${result.status}`);
    }
    const payload = await result.json();
    return payload.entries as LeaderboardEntry[];
  }, [tab, limit]);

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as LeaderboardTab)}>
        <TabsList className="w-full md:w-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="mt-2.5 text-[12.5px] text-white/[0.52]">{active.hint}</p>

      <div className="mt-4">
        {status === "error" ? (
          <ErrorState title="Couldn't load the leaderboard" description={error?.message} onRetry={reload} />
        ) : !data ? (
          <Card>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={6} />
            ))}
          </Card>
        ) : data.length === 0 ? (
          <EmptyPond
            title="Nobody qualifies yet"
            description="No wallets meet the minimum trade count for this ranking."
          />
        ) : (
          <LeaderboardTable entries={data} metricLabel={active.metric} tab={tab} />
        )}
      </div>
    </div>
  );
}

function LeaderboardTable({
  entries,
  metricLabel,
  tab,
}: {
  entries: LeaderboardEntry[];
  metricLabel: string;
  tab: LeaderboardTab;
}) {
  const router = useRouter();
  const open = (address: string) => router.push(`/wallet/${address}`);

  /** The column the current tab actually sorts on gets the emphasis. */
  const primary = (e: LeaderboardEntry) =>
    tab === "biggest-winners" ? e.bestTradeUsd : tab === "biggest-losers" ? e.worstTradeUsd : e.pnlUsd;

  return (
    <Card className="overflow-hidden">
      {/* Desktop header */}
      <div className={cn("hidden border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5", GRID)}>
        <HeaderCell>#</HeaderCell>
        <HeaderCell>Wallet</HeaderCell>
        <HeaderCell>Personality</HeaderCell>
        <HeaderCell className="text-right">{metricLabel}</HeaderCell>
        <HeaderCell className="text-right">
          <span className="inline-flex items-center gap-1">
            Win Rate
            <InfoHint>Share of closed sales that booked a profit.</InfoHint>
          </span>
        </HeaderCell>
        <HeaderCell className="text-right">Trades</HeaderCell>
        <span />
      </div>

      <ul>
        {entries.map((entry) => {
          const accent = PERSONALITY_ACCENT[entry.personality.accent];
          const value = primary(entry);

          return (
            <li key={entry.wallet.address}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => open(entry.wallet.address)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(entry.wallet.address);
                  }
                }}
                className={cn(
                  "group cursor-pointer border-b border-white/[0.04] px-4 py-3.5 transition-colors last:border-0 hover:bg-white/[0.035]",
                  GRID
                )}
              >
                {/* Rank + (mobile) address */}
                <div className="flex items-center gap-3 md:block">
                  <span
                    className={cn(
                      "tnum grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold",
                      entry.rank === 1
                        ? "bg-lily-500/15 text-lily-300"
                        : entry.rank <= 3
                          ? "bg-white/[0.07] text-white/70"
                          : "bg-white/[0.04] text-white/[0.52]"
                    )}
                  >
                    {entry.rank}
                  </span>

                  <div className="min-w-0 flex-1 md:hidden">
                    <WalletAddress
                      address={entry.wallet.address}
                      label={entry.wallet.label}
                      showExplorer={false}
                      size="sm"
                    />
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-white/30 md:hidden" />
                </div>

                {/* Desktop wallet */}
                <div className="hidden min-w-0 md:block">
                  <WalletAddress
                    address={entry.wallet.address}
                    label={entry.wallet.label}
                    showExplorer={false}
                    size="sm"
                  />
                </div>

                {/* Personality */}
                <div className="mt-2.5 md:mt-0 md:min-w-0">
                  <span
                    className={cn(
                      "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11.5px] font-semibold",
                      accent.border,
                      accent.bg,
                      accent.text
                    )}
                  >
                    <span aria-hidden>{entry.personality.emoji}</span>
                    <span className="truncate">{entry.personality.name.replace("The ", "")}</span>
                  </span>
                </div>

                {/* Mobile numbers */}
                <dl className="mt-3 grid grid-cols-3 gap-3 md:hidden">
                  <MobileStat
                    label={metricLabel}
                    value={formatUsd(value, { sign: true })}
                    tone={value >= 0 ? "up" : "down"}
                  />
                  <MobileStat label="Win Rate" value={`${Math.round(entry.winRatePct)}%`} />
                  <MobileStat label="Trades" value={entry.trades.toLocaleString()} />
                </dl>

                {/* Desktop numbers */}
                <div className="hidden text-right md:block">
                  <p
                    className={cn(
                      "tnum text-[14px] font-bold",
                      value >= 0 ? "text-toad-300" : "text-ember-300"
                    )}
                  >
                    {formatUsd(value, { sign: true })}
                  </p>
                  <p className="tnum text-[11px] text-white/[0.42]">{formatUsd(entry.volumeUsd)} vol</p>
                </div>
                <div className="tnum hidden text-right text-[13.5px] text-white/75 md:block">
                  {Math.round(entry.winRatePct)}%
                </div>
                <div className="tnum hidden text-right text-[13.5px] text-white/65 md:block">
                  {entry.trades.toLocaleString()}
                </div>
                <ChevronRight className="hidden h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-toad-300 md:block" />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45", className)}>
      {children}
    </span>
  );
}

function MobileStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "up" | "down";
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/[0.42]">{label}</dt>
      <dd
        className={cn(
          "tnum mt-0.5 text-[13px] font-semibold",
          tone === "up" && "text-toad-300",
          tone === "down" && "text-ember-300",
          tone === "neutral" && "text-white/85"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
