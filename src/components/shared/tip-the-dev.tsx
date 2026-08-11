"use client";

import { useState } from "react";
import { Copy, Check, Coffee } from "lucide-react";
import { toast } from "sonner";
import { cn, copyToClipboard } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Developer tip wallet — deliberately a completely separate constant from
 * `TOAD_CONTRACT_ADDRESS` so the two can never be confused in code, even
 * though they happen to be similar-looking base58 strings.
 */
export const DEV_TIP_WALLET = "CNYRLbwny2iu9DNCx65Rh3W5Lik7oXUD3Gps6ABVua8b";

interface TipTheDevProps {
  className?: string;
}

export function TipTheDev({ className }: TipTheDevProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(DEV_TIP_WALLET);
    if (ok) {
      setCopied(true);
      toast.success("Tip wallet copied", { description: "Thank you for supporting the build 🐸" });
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy address");
    }
  };

  // Rendered client-side via a public QR image service — no extra dependency,
  // and the payload is just a public wallet address, so there's nothing
  // sensitive in the request.
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&color=0-201-150&bgcolor=4-10-7&data=${encodeURIComponent(
    DEV_TIP_WALLET
  )}`;

  return (
    <div
      className={cn(
        "glass glass-ring card-sheen relative overflow-hidden rounded-2xl p-5 sm:p-6",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-lily-400/[0.1] blur-[60px]"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-label text-lily-300/90">
            <Coffee className="h-3.5 w-3.5" />
            Tip the Dev
          </p>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/[0.62]">
            This site is built and kept running by one dev. If TOAD Intelligence has been useful, a small
            tip helps cover the RPC bill and keeps new features coming — completely optional.
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-lily-400/25 bg-lily-400/[0.06] px-2.5 py-1 text-[10.5px] font-medium text-lily-300/85">
            This is the developer tip wallet — not the $TOAD contract address.
          </div>

          <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-white/[0.08] bg-ink-950/60 p-3 sm:flex-row sm:items-center sm:gap-3">
            <code className="min-w-0 flex-1 break-all font-mono text-[12px] leading-relaxed text-white/80 sm:whitespace-nowrap sm:truncate">
              {DEV_TIP_WALLET}
            </code>
            <Button
              type="button"
              onClick={handleCopy}
              variant={copied ? "outline" : "lily"}
              size="sm"
              className="w-full shrink-0 sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Address
                </>
              )}
            </Button>
          </div>
        </div>

        {/* QR code */}
        <div className="flex shrink-0 flex-col items-center gap-2 self-center">
          <div className="rounded-xl border border-lily-400/20 bg-ink-950/70 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- external QR service, not a static asset */}
            <img
              src={qrSrc}
              alt="QR code for the developer tip wallet address"
              width={112}
              height={112}
              className="h-28 w-28 rounded-lg"
              loading="lazy"
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">Scan to tip</span>
        </div>
      </div>
    </div>
  );
}
