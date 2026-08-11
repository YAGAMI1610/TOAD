import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, SearchX } from "lucide-react";
import { ToadSprite } from "@/components/mascot/toad-sprite";

/**
 * Empty and error surfaces.
 *
 * Both share one frame — a dashed glass panel with a lily-pad glow underneath —
 * so a screen that swaps between them doesn't jump. The error variant is
 * deliberately *not* red-on-red: a nothing-happened state and a fetch that
 * failed are both recoverable, and shouting about the second one just makes the
 * app feel fragile. The ember accent is confined to the icon.
 */

/** The shared lily-pad glow that sits under the illustration. */
function PadGlow({ tone = "toad" }: { tone?: "toad" | "ember" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-8 mx-auto h-24 w-48 rounded-full blur-3xl",
        tone === "toad" ? "bg-toad-500/[0.07]" : "bg-ember-500/[0.06]"
      )}
    />
  );
}

const FRAME =
  "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.012] px-6 py-14 text-center";

/** Shown when a filter or query returns nothing. Always offers a way out. */
export function EmptyState({
  title = "Nothing in the pond",
  description = "Nothing matches these filters. The toad is patient — but you can widen the net.",
  action,
  icon,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  /** Replaces the mascot when a glyph fits the context better. */
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(FRAME, className)}>
      <PadGlow />
      <div className="relative mb-4">
        {icon ?? <ToadSprite size={60} pose="idle" className="opacity-60" />}
      </div>
      <p className="relative font-display text-[15.5px] font-semibold text-white/85">{title}</p>
      <p className="text-body relative mt-2 max-w-sm">{description}</p>
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

/**
 * Feed-flavoured empty state. Same frame, wittier copy — the feed is the
 * surface people stare at longest, so it earns a little personality.
 */
export function EmptyPond({
  title = "Quiet in the pond",
  description = "No whales at this size yet. Toads wait. Toads watch. Something always surfaces.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(FRAME, className)}>
      <PadGlow />
      {/* Lily pad the toad is sitting on — a flat ellipse, no extra assets. */}
      <div className="relative mb-3">
        <ToadSprite size={64} pose="idle" className="relative z-10 opacity-70" />
        <span
          aria-hidden
          className="absolute -bottom-1 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-[100%] bg-toad-500/[0.18] blur-[2px]"
        />
      </div>
      <p className="relative font-display text-[15.5px] font-semibold text-white/85">{title}</p>
      <p className="text-body relative mt-2 max-w-sm">{description}</p>
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  );
}

/**
 * Recoverable failure — always paired with a retry.
 *
 * Clear, not alarming: neutral panel, ember reserved for the icon ring, and
 * copy that says what to do next rather than what broke.
 */
export function ErrorState({
  title = "That didn't load",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(FRAME, "border-solid border-white/[0.08]", className)}>
      <PadGlow tone="ember" />
      <div className="relative mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-ember-500/25 bg-ember-500/[0.09] text-ember-300">
        <SearchX className="h-5 w-5" strokeWidth={1.9} />
      </div>
      <p className="relative font-display text-[15.5px] font-semibold text-white/85">{title}</p>
      <p className="text-body relative mt-2 max-w-sm">
        {description ?? "The request didn't come back. Nothing is broken on your side — give it another go."}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="relative mt-5">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
