import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base glass surface.
 *
 * Three layers stack so it reads as real frosted glass rather than a
 * translucent rectangle:
 *   1. low-alpha fill + saturated backdrop blur (`glass`)
 *   2. a 1px accent gradient ring (`glass-ring`) that brightens on hover
 *   3. a hairline top sheen (`card-sheen`) implying a light source above
 *
 * `interactive` adds the lift-and-glow treatment used by every clickable card.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    sheen?: boolean;
    /** Drop the accent ring — for cards that carry their own tinted border. */
    ring?: boolean;
  }
>(({ className, interactive, sheen = true, ring = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "glass relative overflow-hidden rounded-2xl shadow-pond",
      ring && "glass-ring",
      sheen && "card-sheen",
      interactive &&
        "transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-toad-500/20 hover:bg-white/[0.052] hover:shadow-lift",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/** Generous by default — cramped padding was the biggest tell of a cheap card. */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-5 pb-3.5 sm:p-6 sm:pb-4", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-label", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5 sm:px-6", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
