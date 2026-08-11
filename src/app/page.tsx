import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/home/hero";
import { WhyToad } from "@/components/home/why-toad";
import { TokenHub } from "@/components/home/token-hub";
import { DashboardStats } from "@/components/home/dashboard-stats";
import { WhaleFeed } from "@/components/whales/whale-feed";
import { AirdropChecker } from "@/components/whales/airdrop-checker";
import { TopWhales } from "@/components/whales/top-whales";
import { ToadJourney } from "@/components/journey/toad-journey";
import { PersonalityTeaser } from "@/components/traders/personality-teaser";
import { SectionHeading } from "@/components/shared/section-heading";

export default function DashboardPage() {
  return (
    <>
      <Hero />

      {/* Story first: the hero states what the tool does, this states why the
          token exists, then the data sections below back it up with numbers. */}
      <WhyToad />

      <div className="container space-y-14 pb-16 pt-14 sm:space-y-16 sm:pt-16">
        <section aria-labelledby="whale-overview">
          <h2 id="whale-overview" className="sr-only">
            Whale activity overview
          </h2>
          <DashboardStats />
        </section>

        {/* Flow + live feed side by side on desktop, stacked on mobile */}
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6">
          <div className="min-w-0">
            <SectionHeading
              eyebrow="Airdrop checker"
              title="Was this wallet airdropped $TOAD?"
              subtitle="Paste a wallet to verify whether it appears in the Dune TOAD transfer/airdrop table."
              showDemoTag
            />
            <AirdropChecker />
          </div>

          <div className="min-w-0">
            <SectionHeading
              eyebrow="Live feed"
              title="Latest whale prints"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/whales">
                    Full feed
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              }
            />
            <WhaleFeed limit={6} showFilters={false} />
          </div>
        </section>

        <ToadJourney />

        <section>
          <SectionHeading
            eyebrow="Holders"
            title="Top Whales"
            subtitle="The largest $TOAD wallets, ranked by balance. Tap any wallet to read its trading personality."
            showDemoTag
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/leaderboard">
                  <Trophy className="h-3.5 w-3.5" />
                  Leaderboard
                </Link>
              </Button>
            }
          />
          <TopWhales limit={10} />
        </section>

        <PersonalityTeaser />
      </div>

      <TokenHub />
    </>
  );
}
