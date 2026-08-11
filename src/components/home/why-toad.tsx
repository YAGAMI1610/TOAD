"use client";

import { ExternalLink, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { ToadSprite } from "@/components/mascot/toad-sprite";
import { ToadBrandImage } from "@/components/shared/toad-brand-image";
import { externalLinks, listedOn } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * "Why $TOAD?" — the story section between the hero and the dashboard.
 *
 * Full-bleed so it breaks the container rhythm of the data sections below and
 * reads as editorial rather than another card. The pond texture and the lily pad
 * are pure CSS/SVG — no image assets, and no extra network cost on the landing
 * page's critical path.
 *
 * The whole visual column is marked `data-toad-no-perch` so the roaming mascot
 * never lands here: two toads in one frame reads as a bug, and the pad toad is
 * meant to be the still one.
 */

interface StoryStat {
  emoji: string;
  label: string;
  value: string;
  /** Secondary figure shown next to the value, e.g. $PEPE's peak market cap. */
  note?: string;
  tone: "toad" | "lily";
}

const STATS: StoryStat[] = [
  { emoji: "🔥", label: "Chain", value: "Solana", tone: "toad" },
  { emoji: "🐸", label: "Inspired By", value: "$PEPE", note: "$10B+ MC", tone: "toad" },
  { emoji: "🚀", label: "Listed On", value: listedOn, tone: "lily" },
];

export function WhyToad() {
  return (
    <section
      aria-labelledby="why-toad"
      className="relative isolate overflow-hidden border-y border-white/[0.06] bg-ink-975/70"
    >
      {/* Pond floor: texture, then a soft green wash, then edge fades that let
          the section melt into the hero above and the stats below. */}
      <div aria-hidden className="pond-texture absolute inset-0 opacity-[0.55]" />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_75%_40%,rgba(0,200,150,0.09),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-975 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink-975 to-transparent"
      />

      <div className="container relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* ---------------- Text column ---------------- */}
          <div>
            <Reveal>
              <p className="text-label text-toad-400/85">Why $TOAD?</p>
              <h2
                id="why-toad"
                className="mt-3 font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em] text-white sm:text-[42px] lg:text-[46px]"
              >
                The Next Chapter of{" "}
                <span className="text-gradient-toad">Meme Coin History.</span>
              </h2>
              <p className="mt-5 max-w-xl font-display text-[17px] font-semibold leading-[1.5] text-white/[0.78] sm:text-[19px]">
                $PEPE proved a meme could become a movement. $TOAD is writing the next story.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-7 max-w-xl space-y-4">
                <p className="text-body-lg">
                  In 2023, $PEPE launched as a joke and became a multi-billion dollar phenomenon — reaching a
                  $10B+ market cap and proving that internet culture is one of the most powerful forces in
                  crypto.
                </p>

                <p className="font-display text-[17px] font-bold text-toad-300 sm:text-[18px]">
                  $TOAD is the next evolution.
                </p>

                <p className="text-body-lg">
                  Built on Solana — the fastest, cheapest, most memecoin-native blockchain — $TOAD combines the
                  cultural energy of $PEPE with the speed and community of the Solana ecosystem.
                </p>

                {/* Pulled out as a quote: it's the line that carries the brand. */}
                <blockquote className="relative border-l-2 border-toad-500/35 pl-4 sm:pl-5">
                  <p className="text-[15px] italic leading-[1.7] text-white/[0.72] sm:text-[16px]">
                    The toad is a symbol older than the internet. Patient. Adaptable. Always watching. Always
                    waiting. And when the moment comes — it strikes.
                  </p>
                </blockquote>

                <p className="text-body-lg">
                  The $PEPE playbook is simple: a recognizable meme, a passionate community, viral momentum, and
                  the right chain at the right time.
                </p>

                <p className="font-display text-[17px] font-bold text-white sm:text-[18px]">
                  $TOAD has all four.
                </p>
              </div>
            </Reveal>

            {/* ---------------- Stats row ---------------- */}
            <Reveal delay={180}>
              <dl className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "glass group rounded-2xl p-4 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5",
                      s.tone === "lily"
                        ? "hover:border-lily-400/25 hover:shadow-[0_0_30px_-16px_rgba(255,201,77,0.55)]"
                        : "hover:border-toad-500/25 hover:shadow-[0_0_30px_-16px_rgba(0,200,150,0.6)]"
                    )}
                  >
                    <dt className="flex items-center gap-2">
                      <span className="text-[15px] leading-none" aria-hidden>
                        {s.emoji}
                      </span>
                      <span className="text-label">{s.label}</span>
                    </dt>
                    <dd className="mt-2 flex flex-wrap items-baseline gap-x-2">
                      <span
                        className={cn(
                          "font-display text-[19px] font-bold tracking-tight sm:text-[20px]",
                          s.tone === "lily" ? "text-lily-300" : "text-white"
                        )}
                      >
                        {s.value}
                      </span>
                      {s.note && <span className="metric text-[12.5px] font-semibold text-toad-300">{s.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {/* ---------------- CTAs ---------------- */}
            <Reveal delay={240}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CtaButton
                  href={externalLinks.x.url}
                  variant="primary"
                  icon={<Users className="h-4 w-4" />}
                  pendingLabel="Community link coming soon"
                >
                  Join the TOAD community
                </CtaButton>

                <CtaButton
                  href={externalLinks.dex.url}
                  variant="outline"
                  icon={<ShoppingCart className="h-4 w-4" />}
                  pendingLabel="Trading link coming soon"
                >
                  Buy $TOAD
                </CtaButton>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <p className="mt-8 max-w-xl text-[11.5px] italic leading-[1.6] text-white/[0.38]">
                This is not financial advice. $TOAD is a memecoin for entertainment purposes. Always do your own
                research.
              </p>
            </Reveal>
          </div>

          {/* ---------------- Visual column ---------------- */}
          {/* Ordered first on mobile so the mascot isn't buried under a wall of
              copy, but second on desktop where the split layout puts it right. */}
          <Reveal
            delay={120}
            className="order-first flex items-center justify-center lg:order-none"
          >
            <LilyPadToad />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * A CTA that degrades honestly. With no destination configured it renders as a
 * disabled button that says so, instead of a link into the void.
 */
function CtaButton({
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
      <Button variant={variant} size="lg" disabled title={pendingLabel} className="w-full sm:w-auto">
        {icon}
        {children}
        <span className="text-[11px] font-normal opacity-70">(soon)</span>
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} size="lg" className="group w-full sm:w-auto">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {icon}
        {children}
        <ExternalLink className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:-translate-y-0.5" />
      </a>
    </Button>
  );
}

/**
 * The toad on its lily pad. Everything drifts on a slow bob with staggered
 * ripples underneath, so it reads as floating water rather than a static badge.
 * `prefers-reduced-motion` flattens all of it via the global media query.
 */
function LilyPadToad() {
  return (
    <div
      data-toad-no-perch
      className="relative grid h-[280px] w-full max-w-[380px] place-items-center sm:h-[340px]"
    >
      {/* Ambient pond light behind the pad */}
      <div
        aria-hidden
        className="absolute h-56 w-56 rounded-full bg-toad-500/[0.13] blur-[64px] sm:h-64 sm:w-64"
      />

      {/* Expanding ripples on the water surface */}
      <div aria-hidden className="absolute inset-0 grid place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-ripple absolute h-40 w-40 rounded-full border border-toad-400/20 sm:h-48 sm:w-48"
            style={{ animationDelay: `${i * 1130}ms` }}
          />
        ))}
      </div>

      {/* Real $TOAD artwork, framed as a polaroid pinned to the pad — pairs the
          illustrated mascot with the official brand shot without the two
          fighting for the same spot. */}
      <ToadBrandImage
        shape="circle"
        sizes="88px"
        className="absolute -right-1 top-0 z-20 h-[76px] w-[76px] rotate-6 border-2 border-lily-400/40 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.6)] sm:h-[92px] sm:w-[92px]"
      />

      {/* Pad + toad share one bob so the toad never slides off its pad */}
      <div className="animate-bob relative grid place-items-center">
        <ToadSprite size={104} pose="idle" className="relative z-10 -mb-3 drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]" />

        <svg
          viewBox="0 0 240 84"
          className="relative w-[220px] sm:w-[260px]"
          aria-hidden
          role="presentation"
        >
          <defs>
            <radialGradient id="padFill" cx="45%" cy="32%" r="72%">
              <stop offset="0%" stopColor="#1FDCA7" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#00A87E" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#05553F" stopOpacity="0.5" />
            </radialGradient>
            <linearGradient id="padRim" x1="0" y1="0" x2="240" y2="84">
              <stop offset="0%" stopColor="#57EDC2" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#00C896" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Pad body — an ellipse with the classic wedge notch cut out */}
          <path
            d="M120 4 C186 4 236 22 236 42 C236 62 186 80 120 80 C54 80 4 62 4 42 C4 22 54 4 120 4 Z
               M120 42 L206 26 A92 92 0 0 0 120 42 Z"
            fill="url(#padFill)"
            stroke="url(#padRim)"
            strokeWidth="1.5"
          />

          {/* Radiating veins */}
          <g stroke="#8FF6D9" strokeOpacity="0.22" strokeWidth="1" strokeLinecap="round">
            <path d="M120 42 L30 30" />
            <path d="M120 42 L34 52" />
            <path d="M120 42 L74 70" />
            <path d="M120 42 L142 76" />
            <path d="M120 42 L206 60" />
            <path d="M120 42 L212 34" />
          </g>

          {/* Waterline highlight along the front edge */}
          <path
            d="M22 56 C58 74 182 74 218 56"
            fill="none"
            stroke="#C4FCEC"
            strokeOpacity="0.14"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Reflection under the pad */}
      <span
        aria-hidden
        className="absolute bottom-8 h-4 w-48 rounded-[100%] bg-toad-500/[0.16] blur-md sm:w-56"
      />
    </div>
  );
}
