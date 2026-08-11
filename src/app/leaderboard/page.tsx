import type { Metadata } from "next";
import { PageHeading } from "@/components/shared/page-heading";
import { Leaderboard } from "@/components/traders/leaderboard";
import { DemoTag } from "@/components/layout/network-indicator";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The best and worst $TOAD traders, ranked by PnL, win rate, single trades, and activity.",
};

export default function LeaderboardPage() {
  return (
    <div className="container space-y-8 pt-8 sm:pt-10">
      <PageHeading
        eyebrow="Leaderboard"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Know who&apos;s winning.
            <DemoTag />
          </span>
        }
        subtitle="Ranked $TOAD traders across five leaderboards. Every row opens a full personality profile."
      />

      <Leaderboard limit={25} />
    </div>
  );
}
