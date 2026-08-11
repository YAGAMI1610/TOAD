"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyPond } from "@/components/shared/states";
import { useNow } from "@/lib/hooks";
import {
  cn,
  formatDateTime,
  formatRelativeShort,
  formatTokenAmount,
  formatUsd,
  formatPrice,
  solscanTxUrl,
} from "@/lib/utils";
import type { Trade } from "@/lib/types";

const PAGE = 12;

/**
 * Chronological trade timeline, newest first. Each entry is a node on a rail so
 * the sequence of a wallet's decisions reads top to bottom.
 */
export function TradingHistory({ trades }: { trades: Trade[] }) {
  const [shown, setShown] = useState(PAGE);
  const now = useNow(30_000);

  if (trades.length === 0) {
    return (
      <EmptyPond
        title="No $TOAD trades yet"
        description="This wallet holds $TOAD but hasn't traded it on a DEX we index."
      />
    );
  }

  const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp);
  const visible = sorted.slice(0, shown);

  return (
    <div>
      <ol className="relative">
        {/* Rail */}
        <span
          className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-white/[0.14] via-white/[0.08] to-transparent"
          aria-hidden
        />

        {visible.map((trade) => {
          const isBuy = trade.side === "buy";
          return (
            <li key={trade.id} className="relative flex gap-3.5 py-3">
              {/* Node */}
              <span
                className={cn(
                  "relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border",
                  isBuy
                    ? "border-toad-500/30 bg-toad-500/[0.12] text-toad-300"
                    : "border-ember-500/30 bg-ember-500/[0.12] text-ember-300"
                )}
              >
                {isBuy ? (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                )}
              </span>

              <div className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 transition-colors hover:border-white/[0.11] hover:bg-white/[0.04]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[13px]">
                    <span className={cn("font-semibold", isBuy ? "text-toad-300" : "text-ember-300")}>
                      {isBuy ? "Bought" : "Sold"}
                    </span>{" "}
                    <span className="tnum font-semibold text-white/85">
                      {formatTokenAmount(trade.tokenAmount)} TOAD
                    </span>
                  </p>

                  <p className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "tnum text-[14px] font-bold",
                        isBuy ? "text-white/85" : "text-white/85"
                      )}
                    >
                      {formatUsd(trade.usdValue)}
                    </span>
                    {typeof trade.realizedPnlUsd === "number" && (
                      <span
                        className={cn(
                          "tnum text-[12px] font-semibold",
                          trade.realizedPnlUsd >= 0 ? "text-toad-300" : "text-ember-300"
                        )}
                        title="Realised profit or loss booked by this sale"
                      >
                        {formatUsd(trade.realizedPnlUsd, { sign: true })}
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-white/[0.48]">
                  <time dateTime={new Date(trade.timestamp).toISOString()} title={formatDateTime(trade.timestamp)}>
                    {formatRelativeShort(trade.timestamp, now)} ago
                  </time>
                  <span>·</span>
                  <span>{trade.venue}</span>
                  <span>·</span>
                  <span className="tnum">@ {formatPrice(trade.priceUsd)}</span>
                  <Link
                    href={solscanTxUrl(trade.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-toad-300"
                  >
                    Tx
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {shown < sorted.length && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => setShown((s) => s + PAGE)}>
            Show more ({sorted.length - shown} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
