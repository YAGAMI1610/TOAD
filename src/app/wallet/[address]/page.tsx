import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WalletProfile } from "@/components/traders/wallet-profile";
import { shortenAddress } from "@/lib/utils";

interface PageProps {
  params: { address: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const short = shortenAddress(decodeURIComponent(params.address), 6, 6);
  return {
    title: `${short} — TOAD personality`,
    description: `$TOAD trading personality, PnL, and full trade history for ${short}.`,
  };
}

export default function WalletPage({ params }: PageProps) {
  const address = decodeURIComponent(params.address);

  return (
    <div className="container pt-6 sm:pt-8">
      <Link
        href="/traders"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-white/[0.52] transition-colors hover:text-toad-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Analyze another wallet
      </Link>

      <h1 className="mt-3 font-display text-[22px] font-extrabold tracking-tight text-white sm:text-[26px]">
        Your TOAD Personality
      </h1>
      <p className="mt-1 text-[13px] text-white/[0.56]">
        Everything we can read about this wallet&apos;s $TOAD trading, from first buy to last exit.
      </p>

      <div className="mt-6">
        <WalletProfile address={address} />
      </div>
    </div>
  );
}
