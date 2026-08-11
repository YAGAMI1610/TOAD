"use client";

/**
 * Scroll-triggered entrance wrapper.
 *
 * Children start translated + transparent and rise into place the first time the
 * element enters the viewport. Reduced-motion users skip straight to the final
 * state, and if IntersectionObserver is missing the content renders immediately
 * rather than staying hidden.
 */

import { cn } from "@/lib/utils";
import { useInView, usePrefersReducedMotion } from "@/lib/hooks";

export function Reveal({
  children,
  className,
  delay = 0,
  /** Reveal a little earlier/later than the default -60px margin. */
  rootMargin,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  rootMargin?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(rootMargin ? { rootMargin } : undefined);
  const show = inView || reducedMotion;

  return (
    <div
      ref={ref}
      className={cn(show ? "animate-rise-in" : "opacity-0", className)}
      style={show && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Like `Reveal`, but hands the in-view flag to the child instead of animating a
 * wrapper — used for charts, where the library runs its own draw animation and
 * only needs to know when to start.
 */
export function RevealOnView({
  children,
  className,
  rootMargin,
}: {
  children: (inView: boolean) => React.ReactNode;
  className?: string;
  rootMargin?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(rootMargin ? { rootMargin } : undefined);

  return (
    <div ref={ref} className={className}>
      {children(inView || reducedMotion)}
    </div>
  );
}
