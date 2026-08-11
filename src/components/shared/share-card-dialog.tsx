"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Download, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { copyImage, downloadImage, tweetUrl } from "@/lib/shareCard";
import { isDemoMode } from "@/services/config";

interface ShareCardDialogProps {
  /** Draws the PNG. Called when the dialog opens, not on every render. */
  render: () => Promise<Blob>;
  /** Pre-filled tweet text. */
  tweetText: string;
  /** Trigger button label. */
  triggerLabel: string;
  title: string;
  description: string;
  filename: string;
  /** Optional secondary action rendered next to Share on X (e.g. copy link). */
  extraAction?: React.ReactNode;
}

/**
 * Generates a shareable card image and offers Share on X / Copy Image /
 * Download. The preview is a real render of what gets copied, so nobody shares
 * something they haven't seen.
 */
export function ShareCardDialog({
  render,
  tweetText,
  triggerLabel,
  title,
  description,
  filename,
  extraAction,
}: ShareCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const build = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await render();
      setBlob(result);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(result);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't render the card.");
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [render]);

  useEffect(() => {
    if (open && !blob && !busy && !error) void build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Release the preview URL when the component goes away.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCopy = async () => {
    if (!blob) return;
    const result = await copyImage(blob);
    toast.success(
      result === "copied" ? "Card copied to your clipboard" : "Card downloaded — your browser blocks image copy"
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-950">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-[13px] text-ember-300">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => void build()}>
                Try again
              </Button>
            </div>
          ) : previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={previewUrl} alt={`${title} preview`} className="block w-full" width={1200} height={675} />
          ) : (
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
          )}
        </div>

        {isDemoMode && (
          <p className="mt-3 text-[11.5px] text-lily-300/70">
            The card is watermarked as demo data — these numbers are simulated, not live on-chain values.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="primary" size="sm">
            <a href={tweetUrl(tweetText)} target="_blank" rel="noopener noreferrer">
              <Twitter className="h-3.5 w-3.5" />
              Share on X
            </a>
          </Button>
          <Button variant="secondary" size="sm" onClick={onCopy} disabled={!blob}>
            <Copy className="h-3.5 w-3.5" />
            Copy Image
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => blob && downloadImage(blob, filename)}
            disabled={!blob}
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          {extraAction}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-white/[0.42]">
          X can&apos;t attach an image automatically — copy the card first, then paste it into the post.
        </p>
      </DialogContent>
    </Dialog>
  );
}
