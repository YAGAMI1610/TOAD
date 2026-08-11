"use client";

/**
 * Wraps any element as a landing target for the mascot.
 *
 * `reaction` tells the toad how to behave when it lands here:
 *   - "number" → happy dance (big buy/sell figures, market cap)
 *   - "whale"  → eyes widen (whale activity cards)
 *   - "plain"  → just sits and breathes
 *
 * Rendered as a plain wrapper with `display: contents` semantics avoided —
 * we keep a real element so getBoundingClientRect is meaningful.
 */

import { cn } from "@/lib/utils";

interface PerchProps extends React.HTMLAttributes<HTMLDivElement> {
  reaction?: "plain" | "whale" | "number" | "nav";
  /** Stable identity so the toad doesn't treat re-renders as new perches. */
  perchKey?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Perch({ reaction = "plain", perchKey, disabled, className, children, ...props }: PerchProps) {
  return (
    <div
      {...(disabled ? {} : { "data-toad-perch": "", "data-toad-reaction": reaction })}
      data-toad-key={perchKey}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  );
}
