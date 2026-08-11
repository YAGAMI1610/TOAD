"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCardSkeleton } from "@/components/ui/skeleton";
import { EmptyPond, ErrorState } from "@/components/shared/states";
import { LivePill } from "@/components/shared/live-pill";
import { WhaleActivityCard } from "./whale-activity-card";
import { useAsync, useNow } from "@/lib/hooks";
import { cn, formatUsd } from "@/lib/utils";
import { solanaDataService } from "@/services/solanaDataService";
import type { FeedQuery, WhaleActivity } from "@/lib/types";

const SIDE_FILTERS = [
  { id: "all", label: "All" },
  { id: "buy", label: "Buys" },
  { id: "sell", label: "Sells" },
  { id: "top-holders", label: "Top Holders" },
] as const;

const MIN_FILTERS = [1_000, 5_000, 10_000, 50_000] as const;

type SideFilter = (typeof SIDE_FILTERS)[number]["id"];

interface WhaleFeedProps {
  /** Cap the list — the dashboard preview shows fewer rows than the feed page. */
  limit?: number;
  /** Hide the filter bar on the dashboard preview. */
  showFilters?: boolean;
  /** Stream new prints in. Off for static previews. */
  live?: boolean;
}

export function WhaleFeed({ limit = 40, showFilters = true, live = true }: WhaleFeedProps) {
  const [side, setSide] = useState<SideFilter>("all");
  const [minUsd, setMinUsd] = useState<number>(MIN_FILTERS[0]);
  const [paused, setPaused] = useState(false);
  /** Filters collapse behind a toggle on mobile so the feed stays above the fold. */
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const now = useNow(10_000);

  const query: FeedQuery = { side, minUsd, limit };
  const { data, status, error, reload, setData } = useAsync(
    () => solanaDataService.getWhaleActivity(query),
    [side, minUsd, limit]
  );

  /** Filters live in state, but the stream handler needs their current values. */
  const filterRef = useRef({ side, minUsd });
  filterRef.current = { side, minUsd };

  const matchesFilters = useCallback((a: WhaleActivity) => {
    const { side: s, minUsd: m } = filterRef.current;
    if (a.usdValue < m) return false;
    if (s === "all") return true;
    if (s === "top-holders") return typeof a.walletRank === "number" && a.walletRank <= 25;
    return a.side === s;
  }, []);

  useEffect(() => {
    if (!live || paused) return;

    const unsubscribe = solanaDataService.subscribeWhaleActivity((activity) => {
      if (!matchesFilters(activity)) return;

      setData((prev) => [activity, ...(prev ?? [])].slice(0, limit));
      setFreshIds((prev) => new Set(prev).add(activity.id));
      // Drop the highlight after the slide-in settles so it doesn't stay lit.
      setTimeout(() => {
        setFreshIds((prev) => {
          const next = new Set(prev);
          next.delete(activity.id);
          return next;
        });
      }, 2600);
    });

    return unsubscribe;
  }, [live, paused, limit, matchesFilters, setData]);

  const activity = data ?? [];
  const activeFilterCount = (side !== "all" ? 1 : 0) + (minUsd !== MIN_FILTERS[0] ? 1 : 0);

  return (
    <div>
      {/* Feed header — live status on the left, controls on the right */}
      {(live || showFilters) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {live ? (
            <LivePill paused={paused} label={`${activity.length} shown`} />
          ) : (
            <span className="text-label">Recent prints</span>
          )}

          <div className="flex items-center gap-2">
            {live && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume live feed" : "Pause live feed"}
                title={paused ? "Resume live feed" : "Pause live feed"}
                className="shrink-0"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}

            {showFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="feed-filters"
                className="shrink-0 sm:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="tnum grid h-4 min-w-4 place-items-center rounded-full bg-toad-500 px-1 text-[10px] font-bold text-ink-975">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform duration-300", filtersOpen && "rotate-180")}
                />
              </Button>
            )}
          </div>
        </div>
      )}

      {showFilters && (
        <div
          id="feed-filters"
          className={cn(
            "mb-4 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
            // Collapsed on mobile until toggled; always laid out from `sm` up.
            filtersOpen ? "animate-fade-up flex" : "hidden sm:flex"
          )}
        >
          {/* Side filter — swipeable on small screens */}
          <div
            className="no-scrollbar snap-row -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            role="group"
            aria-label="Filter by side"
          >
            {SIDE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSide(f.id)}
                aria-pressed={side === f.id}
                className={cn(
                  "h-12 shrink-0 rounded-xl border px-4 text-[13px] font-medium transition-[background-color,border-color,color,box-shadow] duration-200 active:scale-[0.97] sm:h-9 sm:px-3.5",
                  side === f.id
                    ? "border-toad-500/40 bg-toad-500/[0.14] text-toad-100 shadow-[0_0_20px_-10px_rgba(0,200,150,0.8)]"
                    : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/85"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-label hidden shrink-0 items-center gap-1.5 sm:inline-flex">
              <SlidersHorizontal className="h-3 w-3" />
              Min size
            </span>
            <div
              className="no-scrollbar snap-row -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
              role="group"
              aria-label="Minimum transaction size"
            >
              {MIN_FILTERS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinUsd(m)}
                  aria-pressed={minUsd === m}
                  className={cn(
                    "metric h-12 shrink-0 rounded-xl border px-3.5 text-[12.5px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 active:scale-[0.97] sm:h-9 sm:rounded-lg sm:px-3",
                    minUsd === m
                      ? "border-toad-500/40 bg-toad-500/[0.14] text-toad-100 shadow-[0_0_20px_-10px_rgba(0,200,150,0.8)]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white/85"
                  )}
                >
                  {formatUsd(m, { decimals: 0 })}+
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "error" ? (
        <ErrorState title="Couldn't load the whale feed" description={error?.message} onRetry={reload} />
      ) : status === "loading" && !data ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <FeedCardSkeleton key={i} delay={i * 110} />
          ))}
        </div>
      ) : activity.length === 0 ? (
        <EmptyPond
          title="No whales at this size"
          description={`Nothing above ${formatUsd(minUsd, { decimals: 0 })} has crossed the pond yet. Try a smaller minimum.`}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMinUsd(MIN_FILTERS[0]);
                setSide("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {activity.map((a, i) => (
            <li key={a.id}>
              <WhaleActivityCard activity={a} now={now} isNew={freshIds.has(a.id)} perch={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
