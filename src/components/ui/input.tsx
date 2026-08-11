"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders a red ring + wires aria-invalid for validation messaging. */
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        // 52px on mobile: comfortably tappable, and tall enough that a pasted
        // 44-character wallet address doesn't feel crammed.
        "h-[52px] w-full rounded-xl border border-white/[0.09] bg-ink-900/70 px-4 text-sm text-white/90 sm:h-12",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-xl placeholder:text-white/[0.48]",
        "transition-[border-color,box-shadow,background-color] duration-200",
        "hover:border-white/[0.14]",
        "focus:border-toad-500/55 focus:bg-ink-900 focus:outline-none focus:ring-2 focus:ring-toad-500/25 focus:ring-offset-0",
        invalid && "border-ember-500/50 focus:border-ember-500/60 focus:ring-ember-500/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
