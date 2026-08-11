"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useDebounced } from "@/lib/hooks";
import { cn, isValidSolanaAddress, shortenAddress } from "@/lib/utils";
import { solanaDataService } from "@/services/solanaDataService";
import type { Wallet } from "@/lib/types";
import { WalletBadges } from "@/components/ui/badge";

interface WalletSearchProps {
  compact?: boolean;
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}

/**
 * Typeahead over known holders, with a direct "analyze this address" path for
 * any valid base58 string that isn't in the indexed set.
 */
export function WalletSearch({ compact, autoFocus, onNavigate, className }: WalletSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const debounced = useDebounced(query, 220);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAddress = isValidSolanaAddress(query);

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    solanaDataService
      .searchWallets(debounced)
      .then((r) => {
        if (!cancelled) {
          setResults(r);
          setHighlight(0);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // Dismiss on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (address: string) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`/wallet/${address}`);
  };

  const options = [
    ...(isAddress && !results.some((r) => r.address === query.trim())
      ? [{ address: query.trim(), badges: [], firstSeen: 0, lastActive: 0, isRaw: true } as Wallet & { isRaw?: boolean }]
      : []),
    ...results,
  ];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = options[highlight];
      if (target) go(target.address);
      else if (isAddress) go(query.trim());
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="wallet-search-results"
          aria-label="Search wallets"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={compact ? "Search wallet…" : "Search a wallet address…"}
          spellCheck={false}
          className={cn(
            "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-9 text-white/90 backdrop-blur-xl transition-all placeholder:text-white/40",
            "focus:border-toad-500/40 focus:bg-ink-850/80 focus:outline-none focus:ring-2 focus:ring-toad-500/[0.18]",
            // ≥48px on touch, tightened to chrome proportions from `sm` up.
            compact ? "h-12 text-sm sm:h-9 sm:text-[13px]" : "h-[52px] text-base sm:h-11 sm:text-sm"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-white/[0.42]" />
        )}
      </div>

      {open && query.trim().length > 0 && (
        <div
          id="wallet-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-ink-850/[0.97] shadow-lift backdrop-blur-2xl"
        >
          {options.length === 0 && !loading && (
            <div className="px-3 py-4 text-center">
              <p className="text-[13px] text-white/[0.56]">No wallets found</p>
              <p className="mt-1 text-[11px] text-white/35">
                {query.length < 32
                  ? "Paste a full Solana address to analyze any wallet"
                  : "That doesn't look like a valid Solana address"}
              </p>
            </div>
          )}
          {options.map((wallet, i) => {
            const raw = (wallet as Wallet & { isRaw?: boolean }).isRaw;
            return (
              <button
                key={wallet.address + i}
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => go(wallet.address)}
                className={cn(
                  "flex min-h-[52px] w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors sm:min-h-[44px]",
                  i === highlight ? "bg-toad-500/[0.1]" : "hover:bg-white/[0.04]"
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-[11px]">
                  {raw ? "🔍" : wallet.holderRank ? `#${wallet.holderRank}` : "🐸"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[12.5px] text-white/85">
                    {wallet.label ?? shortenAddress(wallet.address, 6, 6)}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-white/[0.48]">
                    {raw ? "Analyze this wallet" : wallet.label ? shortenAddress(wallet.address, 5, 5) : "Ranked holder"}
                  </span>
                </span>
                {!raw && wallet.badges.length > 0 && (
                  <WalletBadges badges={wallet.badges} max={1} size="sm" className="hidden sm:inline-flex" />
                )}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/35" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
