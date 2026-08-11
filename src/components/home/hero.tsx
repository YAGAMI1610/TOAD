"use client";

import Link from "next/link";
import { ArrowRight, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetworkBackdrop } from "./network-backdrop";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { formatCompactNumber, formatUsd } from "@/lib/utils";
import { useAsync } from "@/lib/hooks";
import { marketCapService } from "@/services/marketCapService";
import { DemoTag } from "@/components/layout/network-indicator";
import { ToadBrandImage } from "@/components/shared/toad-brand-image";

export function Hero() {
  const { data: price } = useAsync(() => marketCapService.getPrice(), []);

  return (
    <section className="relative overflow-hidden">
      <NetworkBackdrop />

      <div className="container relative flex flex-col gap-8 pb-12 pt-14 sm:pb-16 sm:pt-20 lg:flex-row lg:items-center lg:gap-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-toad-500/20 bg-toad-500/[0.07] px-3 py-1 text-[11.5px] font-medium text-toad-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-toad-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-toad-400" />
            </span>
            Live whale tracking for $TOAD
            <DemoTag className="ml-0.5" />
          </div>

          <h1 className="animate-fade-up mt-5 font-display text-[34px] font-extrabold leading-[1.06] tracking-[-0.02em] text-white sm:text-5xl lg:text-[56px]">
            Know What the{" "}
            <span className="relative inline-block">
              <span className="text-gradient-toad">TOADs</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                height="7"
                viewBox="0 0 200 7"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 5C40 2 80 1.5 120 3C150 4 175 5 198 4"
                  stroke="url(#heroUnderline)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="heroUnderline" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#1FDCA7" stopOpacity="0.15" />
                    <stop offset="0.5" stopColor="#57EDC2" />
                    <stop offset="1" stopColor="#1FDCA7" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
              </svg>
            </span>{" "}
            Are Doing.
          </h1>

          <p className="animate-fade-up mt-5 max-w-xl text-[15px] leading-relaxed text-white/60 sm:text-base [animation-delay:80ms]">
            Track whale movements, discover top traders, and uncover the personalities behind $TOAD activity.
          </p>

          <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row [animation-delay:160ms]">
            <Button asChild variant="primary" size="lg" className="group">
              <Link href="/whales">
                <Waves className="h-4 w-4" />
                Explore Whale Activity
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/traders">Analyze a Wallet</Link>
            </Button>
          </div>

          {/* Live market strip */}
          <dl className="animate-fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 [animation-delay:240ms]">
            <HeroStat
              label="Market Cap"
              value={price ? formatUsd(price.marketCapUsd) : "—"}
              accent={price ? (price.change24hPct >= 0 ? "up" : "down") : undefined}
              delta={price ? `${price.change24hPct >= 0 ? "+" : ""}${price.change24hPct.toFixed(1)}%` : undefined}
            />
            <HeroStat label="24h Volume" value={price ? formatUsd(price.volume24hUsd) : "—"} />
            <HeroStat label="Holders" value={price ? formatCompactNumber(price.holders) : "—"} />
            <HeroStat label="Liquidity" value={price ? formatUsd(price.liquidityUsd) : "—"} />
          </dl>
        </div>

        {/* Brand shot — the official $TOAD artwork, framed as the hero's visual
            anchor. Hidden on very small screens to keep the fold focused on
            the headline + CTAs; reappears from `sm` up. */}
        <div className="animate-fade-in relative order-first mx-auto hidden shrink-0 sm:order-none sm:block lg:mx-0 [animation-delay:120ms]">
          <div aria-hidden className="absolute inset-0 scale-110 rounded-full bg-toad-500/[0.18] blur-[50px]" />
          <ToadBrandImage
            shape="circle"
            priority
            sizes="(max-width: 1024px) 200px, 260px"
            className="relative h-[200px] w-[200px] border-2 border-toad-400/25 shadow-[0_20px_60px_-20px_rgba(0,200,150,0.5)] lg:h-[260px] lg:w-[260px]"
          />
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  accent?: "up" | "down";
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-white/45">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="tnum font-display text-[19px] font-bold text-white">{value}</span>
        {delta && (
          <span
            className={`tnum text-[12px] font-semibold ${
              accent === "up" ? "text-toad-400" : "text-ember-400"
            }`}
          >
            {delta}
          </span>
        )}
      </dd>
    </div>
  );
}
