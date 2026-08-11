"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/tooltip";
import { ChartSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { RevealOnView } from "@/components/shared/reveal";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Perch } from "@/components/mascot/perch";
import { useAsync, useIsMobile } from "@/lib/hooks";
import { cn, formatClock, formatUsd } from "@/lib/utils";
import { solanaDataService } from "@/services/solanaDataService";
import type { FlowRange, WhaleFlowPoint } from "@/lib/types";

const RANGES: FlowRange[] = ["1H", "6H", "24H", "7D"];

/**
 * Whale Flow summary + buys-vs-sells chart. Sells are plotted below the axis so
 * accumulation and distribution read at a glance without a legend.
 */
export function WhaleFlowChart() {
  const [range, setRange] = useState<FlowRange>("24H");
  const isMobile = useIsMobile();
  const { data, status, error, reload } = useAsync(() => solanaDataService.getWhaleFlow(range), [range]);

  const net = data?.netUsd ?? 0;
  const accumulating = net >= 0;

  const chartData = (data?.series ?? []).map((p) => ({
    ...p,
    sellsPlot: -p.sellsUsd,
  }));

  return (
    <Perch reaction="number" perchKey="whale-flow">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.56]">
                Whale Flow — {range}
              </span>
              <InfoHint>
                Net USD value of whale buys minus whale sells over the selected window. Positive net flow means
                large wallets are accumulating; negative means they are distributing.
              </InfoHint>
            </div>

            {data ? (
              <>
                <div
                  className={cn(
                    "mt-2 font-display text-[30px] font-bold leading-none tracking-[-0.02em] sm:text-[34px]",
                    accumulating ? "text-toad-300" : "text-ember-300"
                  )}
                >
                  <AnimatedNumber value={net} format={(n) => formatUsd(n, { sign: true })} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/60">
                  {accumulating ? (
                    <TrendingUp className="h-3.5 w-3.5 text-toad-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-ember-400" />
                  )}
                  {accumulating ? "Net accumulation" : "Net distribution"}
                  <span className="text-white/35">·</span>
                  <span className="tnum">{data.uniqueWallets} wallets</span>
                </p>
              </>
            ) : (
              <>
                <Skeleton className="mt-3 h-8 w-40" />
                <Skeleton className="mt-3 h-3 w-32" />
              </>
            )}
          </div>

          <div className="flex shrink-0 gap-1 self-start rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={cn(
                  "metric h-12 min-w-12 rounded-lg px-3 text-[12.5px] font-semibold transition-all duration-200 active:scale-[0.94] sm:h-8 sm:min-w-0 sm:px-2.5",
                  range === r
                    ? "bg-toad-500/[0.14] text-toad-100 shadow-[inset_0_0_0_1px_rgba(0,200,150,0.3)]"
                    : "text-white/[0.56] hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Buys / sells totals */}
        {data && (
          <div className="grid grid-cols-2 gap-px border-y border-white/[0.06] bg-white/[0.04]">
            <FlowTotal label="Buys" count={data.buyCount} usd={data.buysUsd} tone="up" />
            <FlowTotal label="Sells" count={data.sellCount} usd={data.sellsUsd} tone="down" />
          </div>
        )}

        <div className="p-5 pt-4 sm:p-6 sm:pt-4">
          {status === "error" ? (
            <ErrorState
              className="border-0 bg-transparent py-6"
              title="Flow data unavailable"
              description={error?.message}
              onRetry={reload}
            />
          ) : !data ? (
            <ChartSkeleton className="h-[200px] w-full sm:h-[240px]" />
          ) : (
            /* Recharts draws its own grow-from-baseline animation; the observer
               just holds it back until the chart is actually on screen. */
            <RevealOnView className="h-[200px] w-full sm:h-[240px]">
              {(inView) => (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -18 : -8 }}>
                    {/* Bars fade toward the axis so the baseline reads as water level */}
                    <defs>
                      <linearGradient id="flowBuyFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1FDCA7" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#00C896" stopOpacity="0.45" />
                      </linearGradient>
                      <linearGradient id="flowSellFill" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#FF7D6D" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#EE5A4B" stopOpacity="0.42" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(t: number) =>
                        range === "7D"
                          ? new Date(t).toLocaleDateString("en-US", { weekday: "short" })
                          : formatClock(t)
                      }
                      interval={isMobile ? 3 : 1}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                      minTickGap={8}
                    />
                    <YAxis
                      tickFormatter={(v: number) => formatUsd(Math.abs(v), { decimals: 0 })}
                      tickLine={false}
                      axisLine={false}
                      width={isMobile ? 46 : 58}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.14)" />
                    <RTooltip
                      cursor={{ fill: "rgba(0,200,150,0.05)" }}
                      content={<FlowTooltip range={range} />}
                    />
                    <Bar
                      dataKey="buysUsd"
                      stackId="flow"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={30}
                      isAnimationActive={inView}
                      animationDuration={720}
                      animationEasing="ease-out"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="url(#flowBuyFill)" />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="sellsPlot"
                      stackId="flow"
                      radius={[0, 0, 3, 3]}
                      maxBarSize={30}
                      isAnimationActive={inView}
                      animationDuration={720}
                      animationBegin={90}
                      animationEasing="ease-out"
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="url(#flowSellFill)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </RevealOnView>
          )}

          <div className="mt-4 flex items-center justify-center gap-5 text-[11.5px] text-white/[0.52]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-toad-400" aria-hidden />
              Buys above the line
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-ember-400" aria-hidden />
              Sells below
            </span>
          </div>
        </div>
      </Card>
    </Perch>
  );
}

function FlowTotal({
  label,
  count,
  usd,
  tone,
}: {
  label: string;
  count: number;
  usd: number;
  tone: "up" | "down";
}) {
  return (
    <div className="bg-ink-950/40 px-5 py-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-white/[0.48]">
        {label} <span className="tnum text-white/35">({count})</span>
      </p>
      <p
        className={cn(
          "tnum mt-1 font-display text-[17px] font-bold",
          tone === "up" ? "text-toad-300" : "text-ember-300"
        )}
      >
        {formatUsd(usd)}
      </p>
    </div>
  );
}

interface TooltipPayloadItem {
  payload: WhaleFlowPoint;
}

function FlowTooltip({
  active,
  payload,
  range,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  range: FlowRange;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 px-3 py-2.5 text-xs shadow-lift backdrop-blur-xl">
      <p className="tnum mb-1.5 font-semibold text-white/70">
        {range === "7D"
          ? new Date(point.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : formatClock(point.timestamp)}
      </p>
      <p className="tnum flex items-center justify-between gap-4 text-toad-300">
        <span className="text-white/[0.56]">Buys</span>
        {formatUsd(point.buysUsd)}
      </p>
      <p className="tnum flex items-center justify-between gap-4 text-ember-300">
        <span className="text-white/[0.56]">Sells</span>
        {formatUsd(point.sellsUsd)}
      </p>
      <p className="tnum mt-1.5 flex items-center justify-between gap-4 border-t border-white/10 pt-1.5 font-semibold text-white/85">
        <span className="text-white/[0.56]">Net</span>
        {formatUsd(point.netUsd, { sign: true })}
      </p>
    </div>
  );
}
