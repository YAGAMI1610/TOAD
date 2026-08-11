import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToadSprite } from "@/components/mascot/toad-sprite";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="opacity-70">
        <ToadSprite size={84} pose="idle" />
      </div>
      <p className="mt-6 font-display text-[28px] font-extrabold tracking-tight text-white sm:text-[34px]">
        Wrong lily pad.
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-white/[0.56]">
        This page hopped off somewhere. Try the dashboard, or paste a wallet address to read its TOAD
        personality.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
        <Button asChild variant="primary" size="md">
          <Link href="/">Back to dashboard</Link>
        </Button>
        <Button asChild variant="secondary" size="md">
          <Link href="/traders">Analyze a wallet</Link>
        </Button>
      </div>
    </div>
  );
}
