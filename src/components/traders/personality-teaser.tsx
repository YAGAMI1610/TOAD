"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/shared/section-heading";
import { ARCHETYPES } from "@/lib/personality";
import { cn, isValidSolanaAddress } from "@/lib/utils";
import { FEATURED_WALLETS } from "@/lib/mockData";
import { shortenAddress } from "@/lib/utils";
import { PERSONALITY_ACCENT } from "./personality-accent";

/**
 * Analyzer entry point. Used on the dashboard and at the top of /traders —
 * `variant="page"` drops the section heading since the page supplies its own.
 */
export function PersonalityTeaser({ variant = "section" }: { variant?: "section" | "page" }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const valid = isValidSolanaAddress(trimmed);
  const showError = touched && trimmed.length > 0 && !valid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    router.push(`/wallet/${trimmed}`);
  };

  return (
    <section>
      {variant === "section" && (
        <SectionHeading
          eyebrow="Trader personality"
          title="Discover Your TOAD Personality"
          subtitle="Paste any Solana wallet. We read its $TOAD trading history and assign the archetype that fits."
          showDemoTag
        />
      )}

      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-toad-500/[0.13] blur-3xl"
          aria-hidden
        />

        <form onSubmit={submit} className="relative">
          <label htmlFor="personality-wallet" className="sr-only">
            Solana wallet address
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                id="personality-wallet"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Paste a Solana wallet address"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={showError}
                aria-describedby={showError ? "personality-wallet-error" : undefined}
                className={cn("h-12 pl-10 font-mono text-[13px]", showError && "border-ember-500/50")}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="shrink-0" disabled={!trimmed}>
              <Sparkles className="h-4 w-4" />
              Analyze Wallet
            </Button>
          </div>

          {showError ? (
            <p id="personality-wallet-error" className="mt-2 text-[12.5px] text-ember-300">
              That doesn&apos;t look like a Solana address — they&apos;re 32–44 base58 characters.
            </p>
          ) : (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] text-white/[0.48]">
              <span>Try one:</span>
              {FEATURED_WALLETS.slice(0, 3).map((address) => (
                <button
                  key={address}
                  type="button"
                  onClick={() => router.push(`/wallet/${address}`)}
                  className="inline-flex h-12 items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 font-mono text-[11.5px] text-white/65 transition-colors active:scale-[0.96] hover:border-toad-500/30 hover:text-toad-200 sm:h-7 sm:rounded-md sm:px-2"
                >
                  {shortenAddress(address, 4, 4)}
                </button>
              ))}
            </p>
          )}
        </form>

        {/* Archetype gallery */}
        <div className="relative mt-7">
          <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/[0.48]">
            {ARCHETYPES.length} personalities in the pond
          </p>
          <div className="no-scrollbar snap-row -mx-5 flex gap-2.5 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {ARCHETYPES.slice(0, 8).map((a) => {
              const accent = PERSONALITY_ACCENT[a.accent];
              return (
                <div
                  key={a.id}
                  className={cn(
                    "w-[210px] shrink-0 rounded-xl border p-3.5 transition-colors sm:w-auto",
                    accent.border,
                    accent.bg
                  )}
                >
                  <p className="text-[19px] leading-none" aria-hidden>
                    {a.emoji}
                  </p>
                  <p className={cn("mt-2 text-[13px] font-bold", accent.text)}>{a.name}</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-white/[0.52]">{a.tagline}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
