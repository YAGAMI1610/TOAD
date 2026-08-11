"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        "z-[70] max-w-[260px] rounded-lg border border-white/10 bg-ink-800/95 px-3 py-2 text-xs leading-relaxed text-white/75 shadow-lift backdrop-blur-xl",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * The metric-explainer affordance used across every stat.
 * Tap-friendly: Radix opens tooltips on touch via the trigger's focus.
 */
export function InfoHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="What does this mean?"
          className={cn(
            // 16px glyph, 48px tap target: the overlay grows the hit area without
            // pushing the surrounding label around.
            "relative inline-grid h-4 w-4 shrink-0 place-items-center rounded-full text-white/35 transition-colors hover:text-white/[0.68]",
            "before:absolute before:left-1/2 before:top-1/2 before:h-12 before:w-12 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] sm:before:hidden",
            className
          )}
        >
          <Info className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
