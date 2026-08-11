import type { Metadata } from "next";
import { AirdropChecker } from "@/components/whales/airdrop-checker";
import { WhaleFeed } from "@/components/whales/whale-feed";
import { TopWhales } from "@/components/whales/top-whales";
import { SectionHeading } from "@/components/shared/section-heading";
import { PageHeading } from "@/components/shared/page-heading";

export const metadata: Metadata = {
  title: "Whale Feed",
  description: "Every notable $TOAD buy and sell as it lands, with net whale flow over time.",
};

export default function WhalesPage() {
  return (
    <div className="container space-y-12 pt-8 sm:space-y-14 sm:pt-10">
      <PageHeading
        eyebrow="Whale feed"
        title="Watch the whales."
        subtitle="Every $TOAD trade above $1,000, streamed as it lands. Filter by side, size, or top holders."
      />

      <section>
        <SectionHeading
          title="Airdrop checker"
          subtitle="Confirm whether a wallet received $TOAD in the Dune transfer/airdrop dataset."
          showDemoTag
        />
        <AirdropChecker />
      </section>

      <section>
        <SectionHeading
          title="Live Activity"
          subtitle="Newest prints first. Pause the stream any time to read a card."
        />
        <WhaleFeed limit={40} />
      </section>

      <section>
        <SectionHeading
          title="Top Whales"
          subtitle="The largest $TOAD wallets right now. Tap any wallet to open its trader profile."
          showDemoTag
        />
        <TopWhales limit={25} />
      </section>
    </div>
  );
}
