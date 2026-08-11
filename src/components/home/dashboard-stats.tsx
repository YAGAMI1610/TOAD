"use client";

import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Crown, Waves } from "lucide-react";
import { StatCard, StatCardRow, StatRow, Delta } from "@/components/shared/stat-card";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { WalletAddress } from "@/components/shared/wallet-address";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { WalletBadges } from "@/components/ui/badge";
import { useAsync, useNow } from "@/lib/hooks";
import { formatRelativeTime, formatTokenAmount, formatUsd, formatPct } from "@/lib/utils";
import { solanaDataService } from "@/services/solanaDataService";
import type { WhaleActivity } from "@/lib/types";

/**
 * The four cards at the top of the dashboard: 24h whale activity, top holder,
 * biggest buy, biggest sell. Everything comes from `getDashboard()` — no
 * component here knows whether the numbers are mocked or live.
 */
export function DashboardStats() {
  const { data, status, error, reload } = useAsync(() => solanaDataService.getDashboard(), []);
  const now = useNow(20_000);
  const router = useRouter();

  if (status === "error") {
    return <ErrorState title="Couldn't load whale stats" description={error?.message} onRetry={reload} />;
  }

  if (!data) {
    return (
      <StatCardRow>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </StatCardRow>
    );
  }

  const { whales24h, topHolder, biggestBuy, biggestSell } = data;

  return (
    <StatCardRow>
      <StatCard
        label="Whale Activity 24h"
        hint="Buys and sells above $1,000 in notional value over the last 24 hours. Net flow is buys minus sells."
        icon={<Waves className="h-3.5 w-3.5" />}
        accent={whales24h.netFlowUsd >= 0 ? "toad" : "ember"}
        celebrate
        perchKey="stat-whales"
        value={
          <span className={whales24h.netFlowUsd >= 0 ? "text-toad-300" : "text-ember-300"}>
            <AnimatedNumber
              value={whales24h.netFlowUsd}
              format={(n) => formatUsd(n, { sign: true })}
            />
          </span>
        }
        sub={
          <span className="flex items-center gap-2">
            Net whale flow
            {whales24h.netFlowChangePct !== 0 && <Delta value={whales24h.netFlowChangePct} size="sm" />}
          </span>
        }
        footer={
          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            <StatRow
              label={`Large buys (${whales24h.largeBuyCount})`}
              value={formatUsd(whales24h.largeBuysUsd)}
              tone="up"
            />
            <StatRow
              label={`Large sells (${whales24h.largeSellCount})`}
              value={formatUsd(whales24h.largeSellsUsd)}
              tone="down"
            />
          </div>
        }
      />

      <StatCard
        label="Top Holder"
        hint="Largest known non-exchange $TOAD wallet by balance, with its share of total supply."
        icon={<Crown className="h-3.5 w-3.5" />}
        accent="lily"
        perchKey="stat-top-holder"
        onClick={() => router.push(`/wallet/${topHolder.wallet.address}`)}
        value={
          <span className="tnum">
            {formatTokenAmount(topHolder.holding.amount)} <span className="text-[15px] text-white/[0.52]">TOAD</span>
          </span>
        }
        sub={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <WalletAddress address={topHolder.wallet.address} size="sm" showExplorer={false} />
            <WalletBadges badges={topHolder.wallet.badges} max={1} size="sm" />
          </span>
        }
        footer={
          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            <StatRow label="Share of supply" value={formatPct(topHolder.holding.supplyPct, { sign: false })} />
            <StatRow label="Position value" value={formatUsd(topHolder.holding.usdValue)} />
          </div>
        }
      />

      <BiggestTradeCard trade={biggestBuy} side="buy" now={now} />
      <BiggestTradeCard trade={biggestSell} side="sell" now={now} />
    </StatCardRow>
  );
}

function BiggestTradeCard({
  trade,
  side,
  now,
}: {
  trade: WhaleActivity;
  side: "buy" | "sell";
  now: number;
}) {
  const router = useRouter();
  const isBuy = side === "buy";

  return (
    <StatCard
      label={isBuy ? "Biggest Buy 24h" : "Biggest Sell 24h"}
      hint={
        isBuy
          ? "Largest single $TOAD purchase in the last 24 hours by USD value."
          : "Largest single $TOAD sale in the last 24 hours by USD value."
      }
      icon={isBuy ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      accent={isBuy ? "toad" : "ember"}
      celebrate
      perchKey={isBuy ? "stat-biggest-buy" : "stat-biggest-sell"}
      onClick={() => router.push(`/wallet/${trade.wallet}`)}
      value={
        <span className={isBuy ? "text-toad-300" : "text-ember-300"}>
          <AnimatedNumber value={trade.usdValue} format={(n) => formatUsd(n)} />
        </span>
      }
      sub={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <WalletAddress address={trade.wallet} size="sm" showExplorer={false} />
          <span className="text-white/[0.42]">·</span>
          <span className="tnum">{formatRelativeTime(trade.timestamp, now)}</span>
        </span>
      }
      footer={
        <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
          <StatRow label="Amount" value={`${formatTokenAmount(trade.tokenAmount)} TOAD`} />
          <StatRow label="Venue" value={trade.venue} />
        </div>
      }
    />
  );
}
