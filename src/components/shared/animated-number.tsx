"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
  /** Start from 0 on mount rather than snapping to the first value. */
  animateOnMount?: boolean;
}

/**
 * Counts to `value` with an ease-out curve. Respects reduced-motion by
 * snapping. Uses tabular numerals so the width doesn't jitter mid-count.
 */
export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString(),
  durationMs = 900,
  className,
  animateOnMount = true,
}: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(animateOnMount && !reduced ? 0 : value);
  const fromRef = useRef(animateOnMount && !reduced ? 0 : value);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = display;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs, reduced]);

  return <span className={cn("tnum", className)}>{format(display)}</span>;
}
