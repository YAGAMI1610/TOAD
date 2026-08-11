"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Sizes are responsive on purpose: every variant clears a 44–48px touch target
 * on mobile and tightens to desktop chrome proportions at `sm`. That's cheaper
 * and more reliable than remembering to pad tap areas at each call site.
 *
 * The press feel comes from a fast scale-down plus a shadow that collapses —
 * so the button appears to physically sink rather than just shrink.
 */
const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out",
    "active:scale-[0.97] active:duration-75",
    "disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100",
  ],
  {
    variants: {
      variant: {
        /** Solid emerald, glows warmer and lifts on hover, sinks flat on press. */
        primary:
          "bg-toad-500 font-semibold text-ink-975 shadow-btn-toad hover:-translate-y-px hover:bg-toad-400 hover:shadow-btn-toad-hover active:translate-y-0 active:shadow-[0_2px_10px_-6px_rgba(0,200,150,0.7)]",
        /** Ghost glass — the neutral partner to primary. */
        secondary:
          "glass text-white/85 hover:border-toad-500/25 hover:bg-white/[0.06] hover:text-white hover:shadow-[0_0_24px_-14px_rgba(0,200,150,0.6)]",
        ghost: "text-white/[0.68] hover:bg-white/[0.06] hover:text-white",
        /** Ghost with an accent border — the spec's "secondary" treatment. */
        outline:
          "border border-toad-500/35 bg-toad-500/[0.05] text-toad-200 hover:border-toad-400/60 hover:bg-toad-500/[0.12] hover:text-toad-100 hover:shadow-[0_0_26px_-12px_rgba(0,200,150,0.55)]",
        lily:
          "border border-lily-400/35 bg-lily-400/[0.07] text-lily-300 hover:border-lily-400/60 hover:bg-lily-400/[0.14] hover:text-lily-200 hover:shadow-[0_0_26px_-12px_rgba(255,201,77,0.55)]",
        danger: "bg-ember-500/90 text-white hover:bg-ember-500",
      },
      // Every size clears a 48px touch target on mobile, then tightens to
      // chrome proportions from `sm` up so desktop density isn't sacrificed.
      size: {
        sm: "h-12 px-3.5 text-[13px] sm:h-8 sm:px-3",
        md: "h-12 px-[18px] sm:h-10 sm:px-4",
        lg: "h-[52px] px-6 text-[15px] sm:h-12",
        icon: "h-12 w-12 sm:h-9 sm:w-9",
        "icon-sm": "h-12 w-12 sm:h-8 sm:w-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
