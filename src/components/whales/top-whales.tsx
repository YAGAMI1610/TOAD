"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WalletBadges } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/tooltip";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { WalletAddress } from "@/components/shared/wallet-address";
import { Delta } from "@/components/shared/stat-card";
import { useAsync } from "@/lib/hooks";
import { cn, formatPct, formatTokenAmount, formatUsd } from "@/lib/utils";
import { solanaDataService } from "@/services/solanaDataService";

/**
 * Ranked holder table. Desktop gets a real table; mobile gets stacked cards,
 * because a six-column table on a phone is unreadable however you scroll it.
 */
export function TopWhales({ limit = 15 }: { limit?: number }) {
  const router = useRouter();
  const { data, status, error, reload } = useAsync(() => solanaDataService.getTopHolders(limit), [limit]);

  if (status === "error") {
    return <ErrorState title="Couldn't load top whales" description={error?.message} onRetry={reload} />;
  }

  if (!data) {
    return (
      <Card>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRowSkeleton key={i} cols={6} />
        ))}
      </Card>
    );
  }

  const open = (address: string) => router.push(`/wallet/${address}`);

  return (
    <Card className="overflow-hidden">
      {/* Desktop header */}
      <div className="hidden border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 md:grid md:grid-cols-[46px_minmax(0,1.5fr)_1fr_88px_92px_minmax(0,1.1fr)_20px] md:items-center md:gap-3">
        <HeaderCell>#</HeaderCell>
        <HeaderCell>Wallet</HeaderCell>
        <HeaderCell className="text-right">$TOAD Balance</HeaderCell>
        <HeaderCell className="text-right">
          <span className="inline-flex items-center gap-1">
            Supply
            <InfoHint>Share of the 1B total $TOAD supply held by this wallet.</InfoHint>
          </span>
        </HeaderCell>
        <HeaderCell className="text-right">24H</HeaderCell>
        <HeaderCell>Status</HeaderCell>
        <span />
      </div>

      <ul>
        {data.map(({ wallet, holding }, i) => (
          <li key={wallet.address}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => open(wallet.address)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(wallet.address);
                }
              }}
              className={cn(
                "group cursor-pointer border-b border-white/[0.04] px-4 py-3.5 transition-colors last:border-0 hover:bg-white/[0.035]",
                "md:grid md:grid-cols-[46px_minmax(0,1.5fr)_1fr_88px_92px_minmax(0,1.1fr)_20px] md:items-center md:gap-3"
              )}
            >
              {/* Rank */}
              <div className="flex items-center gap-3 md:block">
                <span
                  className={cn(
                    "tnum grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold",
                    i === 0
                      ? "bg-lily-500/15 text-lily-300"
                      : i < 3
                        ? "bg-white/[0.07] text-white/70"
                        : "bg-white/[0.04] text-white/[0.52]"
                  )}
                >
                  {wallet.holderRank ?? i + 1}
                </span>

                {/* Mobile: address sits beside the rank */}
                <div className="min-w-0 flex-1 md:hidden">
                  <WalletAddress address={wallet.address} label={wallet.label} showExplorer={false} size="sm" />
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-white/30 md:hidden" />
              </div>

              {/* Desktop wallet cell */}
              <div className="hidden min-w-0 md:block">
                <WalletAddress address={wallet.address} label={wallet.label} showExplorer={false} size="sm" />
              </div>

              {/* Mobile stats grid */}
              <dl className="mt-3 grid grid-cols-3 gap-3 md:hidden">
                <MobileStat label="Balance" value={`${formatTokenAmount(holding.amount)}`} />
                <MobileStat label="Supply" value={formatPct(holding.supplyPct, { sign: false })} />
                <MobileStat
                  label="24H"
                  value={<Delta value={holding.change24hPct} size="sm" />}
                />
              </dl>

              <div className="mt-3 md:hidden">
                <WalletBadges badges={wallet.badges} max={3} size="sm" />
              </div>

              {/* Desktop numeric cells */}
              <div className="hidden text-right md:block">
                <p className="tnum text-[14px] font-semibold text-white/90">{formatTokenAmount(holding.amount)}</p>
                <p className="tnum text-[11.5px] text-white/[0.48]">{formatUsd(holding.usdValue)}</p>
              </div>
              <div className="tnum hidden text-right text-[13.5px] text-white/70 md:block">
                {formatPct(holding.supplyPct, { sign: false })}
              </div>
              <div className="hidden justify-end md:flex">
                <Delta value={holding.change24hPct} size="sm" />
              </div>
              <div className="hidden min-w-0 md:block">
                <WalletBadges badges={wallet.badges} max={2} size="sm" />
              </div>
              <ChevronRight className="hidden h-4 w-4 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-toad-300 md:block" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.13em] text-white/45",
        className
      )}
    >
      {children}
    </span>
  );
}

function MobileStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/[0.42]">{label}</dt>
      <dd className="tnum mt-0.5 text-[13px] font-semibold text-white/85">{value}</dd>
    </div>
  );
}
