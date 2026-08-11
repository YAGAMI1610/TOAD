"use client";

import { Users, ShoppingCart, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { ContractAddress } from "@/components/shared/contract-address";
import { TipTheDev } from "@/components/shared/tip-the-dev";
import { ToadBrandImage } from "@/components/shared/toad-brand-image";
import { Button } from "@/components/ui/button";
import { externalLinks } from "@/lib/links";

/**
 * The token + community hub: contract address, where to buy/join, and the
 * (optional) dev tip. Grouped in one section so the two wallet addresses on
 * the page sit far apart visually and are each clearly labelled — nobody
 * should be able to mistake one for the other.
 */
export function TokenHub() {
  return (
    <section aria-labelledby="token-hub" className="relative isolate overflow-hidden">
      <div aria-hidden className="pond-texture absolute inset-0 opacity-[0.3]" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink-975/60 to-transparent"
      />

      <div className="container relative py-4">
        <SectionHeading
          eyebrow="Get $TOAD"
          title="Contract, Community &amp; Support"
          subtitle="Verify the contract before every swap, join the community, and — if you feel like it — buy the dev a coffee."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
          {/* Brand card */}
          <Reveal>
            <div className="glass glass-ring card-sheen relative flex h-full flex-col justify-end overflow-hidden rounded-2xl p-5 sm:p-6">
              <ToadBrandImage
                shape="square"
                sizes="(max-width: 1024px) 100vw, 480px"
                className="absolute inset-0 h-full w-full rounded-2xl"
              />
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-gradient-to-t from-ink-975 via-ink-975/55 to-transparent"
              />
              <div className="relative">
                <p className="font-display text-lg font-bold text-white">$TOAD</p>
                <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-white/70">
                  The official $TOAD mascot — patient, adaptable, always watching the chart.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-5">
            <Reveal delay={80}>
              <ContractAddress />
            </Reveal>

            <Reveal delay={140}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <BuyOrJoinButton
                  href={externalLinks.dex.url}
                  variant="primary"
                  icon={<ShoppingCart className="h-4 w-4" />}
                  pendingLabel="Trading link coming soon"
                >
                  Buy $TOAD
                </BuyOrJoinButton>
                <BuyOrJoinButton
                  href={externalLinks.x.url}
                  variant="outline"
                  icon={<Users className="h-4 w-4" />}
                  pendingLabel="Community link coming soon"
                >
                  Join the community
                </BuyOrJoinButton>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={200} className="mt-5">
          <TipTheDev />
        </Reveal>
      </div>
    </section>
  );
}

function BuyOrJoinButton({
  href,
  variant,
  icon,
  pendingLabel,
  children,
}: {
  href?: string;
  variant: "primary" | "outline";
  icon: React.ReactNode;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <Button variant={variant} size="lg" disabled title={pendingLabel} className="w-full sm:flex-1">
        {icon}
        {children}
        <span className="text-[11px] font-normal opacity-70">(soon)</span>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size="lg" className="group w-full sm:flex-1">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {icon}
        {children}
        <ExternalLink className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:-translate-y-0.5" />
      </a>
    </Button>
  );
}
