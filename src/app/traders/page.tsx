import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { SectionHeading } from "@/components/shared/section-heading";
import { PersonalityTeaser } from "@/components/traders/personality-teaser";
import { Leaderboard } from "@/components/traders/leaderboard";

export const metadata: Metadata = {
  title: "Trader Profiles",
  description: "Paste a Solana wallet to discover its $TOAD trading personality, PnL, and full history.",
};

export default function TradersPage() {
  return (
    <div className="container space-y-12 pt-8 sm:space-y-14 sm:pt-10">
      <PageHeading
        eyebrow="Trader personality"
        title="Discover Your TOAD Personality"
        subtitle="Paste any Solana wallet address. We read its $TOAD trading history — entries, exits, hold times, realised PnL — and assign the archetype that fits."
      />

      <PersonalityTeaser variant="page" />

      <section>
        <SectionHeading
          title="Traders worth reading"
          subtitle="A slice of the leaderboard. Open any wallet to see the full personality breakdown."
          showDemoTag
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/leaderboard">
                Full leaderboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        />
        <Leaderboard limit={10} />
      </section>
    </div>
  );
}
