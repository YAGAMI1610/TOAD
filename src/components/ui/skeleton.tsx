import { cn } from "@/lib/utils";

/**
 * Accent-tinted loading block. The pulse + shimmer live in `.skeleton`
 * (globals.css) so every placeholder in the app breathes in the same emerald
 * rather than a grey that reads as broken.
 *
 * `delay` staggers a stack of skeletons so they ripple instead of strobing in
 * unison — a small thing that makes loading feel deliberate.
 */
export function Skeleton({
  className,
  delay,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <div
      className={cn("skeleton", className)}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
      {...props}
    />
  );
}

/** Matches the footprint of a stat card so the layout doesn't jump on load. */
export function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="glass glass-ring rounded-2xl p-5 shadow-pond sm:p-6">
      <Skeleton className="h-3 w-24" delay={delay} />
      <Skeleton className="mt-4 h-9 w-32" delay={delay + 90} />
      <Skeleton className="mt-3.5 h-3 w-40" delay={delay + 180} />
      <Skeleton className="mt-2 h-3 w-28" delay={delay + 260} />
    </div>
  );
}

export function FeedCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="glass glass-ring relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 pl-5 shadow-pond">
      {/* Mirrors the side rail on a real feed card so the row doesn't shift. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-toad-500/25" />
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" delay={delay} />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-28" delay={delay + 80} />
        <Skeleton className="mt-2.5 h-3 w-20" delay={delay + 150} />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-20" delay={delay + 120} />
        <Skeleton className="h-3 w-14" delay={delay + 200} />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5, delay = 0 }: { cols?: number; delay?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-white/[0.04] px-4 py-4 last:border-0">
      <Skeleton className="h-7 w-7 shrink-0 rounded-lg" delay={delay} />
      <Skeleton className="h-3 w-28 shrink-0" delay={delay + 80} />
      <div className="flex flex-1 justify-end gap-6">
        {Array.from({ length: Math.max(1, cols - 2) }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" delay={delay + 140 + i * 70} />
        ))}
      </div>
    </div>
  );
}

/** Chart-shaped placeholder: bars of varying height read as "a chart is coming". */
export function ChartSkeleton({ className }: { className?: string }) {
  const heights = [42, 68, 30, 84, 56, 74, 38, 62, 48, 78, 34, 58];
  return (
    <div className={cn("flex items-end gap-1.5 px-1", className)} aria-hidden>
      {heights.map((h, i) => (
        <Skeleton
          key={i}
          className="min-w-0 flex-1 rounded-t-md"
          style={{ height: `${h}%` }}
          delay={i * 70}
        />
      ))}
    </div>
  );
}
