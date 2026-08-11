"use client";

import Link from "next/link";
import { ToadBrandImage } from "@/components/shared/toad-brand-image";
import { ContractAddress } from "@/components/shared/contract-address";
import { NAV_ITEMS } from "./site-header";
import { useToadSettings } from "@/components/mascot/mascot-context";
import { isDemoMode } from "@/services/config";

export function SiteFooter() {
  const { enabled, toggle } = useToadSettings();

  return (
    <footer className="mt-8 border-t border-white/[0.06] bg-ink-950/40">
      {/* Extra bottom padding clears the fixed mobile nav, which sits outside <main>. */}
      <div className="container pb-[calc(env(safe-area-inset-bottom)+84px)] pt-10 md:pb-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <ToadBrandImage
                shape="circle"
                sizes="30px"
                className="h-[30px] w-[30px] border border-toad-500/25"
              />
              <span className="font-display text-[15px] font-bold tracking-tight text-white">
                TOAD<span className="text-toad-400"> Intelligence</span>
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/[0.52]">
              On-chain intelligence for the $TOAD community. Track the whales, read the wallets, watch the
              journey.
            </p>
            <ContractAddress variant="compact" className="mt-4 max-w-[240px]" />
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8">
            <div>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.48]">
                Product
              </p>
              <ul className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="-mx-1 inline-flex min-h-12 items-center px-1 text-[13px] text-white/65 transition-colors hover:text-toad-300 sm:min-h-0"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.48]">
                Settings
              </p>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={toggle}
                    className="-mx-1 inline-flex min-h-12 items-center px-1 text-left text-[13px] text-white/65 transition-colors hover:text-toad-300 sm:min-h-0"
                  >
                    {enabled ? "Hide the toad 🐸" : "Bring the toad back 🐸"}
                  </button>
                </li>
                <li>
                  <a
                    href="https://solscan.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mx-1 inline-flex min-h-12 items-center px-1 text-[13px] text-white/65 transition-colors hover:text-toad-300 sm:min-h-0"
                  >
                    Solscan
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.05] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-white/[0.42]">
            Not financial advice. $TOAD is a memecoin — do your own research.
          </p>
          {isDemoMode && (
            <p className="text-[11.5px] text-lily-300/70">
              Running on simulated data. Connect an RPC + price API for live on-chain numbers.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
