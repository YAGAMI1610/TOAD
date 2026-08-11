import Image from "next/image";
import { cn } from "@/lib/utils";

interface ToadBrandImageProps {
  className?: string;
  /** Controls corner rounding + aspect treatment for the slot it's dropped into. */
  shape?: "circle" | "rounded" | "square";
  priority?: boolean;
  sizes?: string;
  alt?: string;
}

/**
 * The official $TOAD artwork, reused across the site instead of duplicated
 * verbatim in every slot — callers control shape/size via className + shape,
 * next/image handles responsive srcset so it stays crisp on mobile and desktop.
 */
export function ToadBrandImage({
  className,
  shape = "rounded",
  priority = false,
  sizes = "(max-width: 640px) 60vw, 320px",
  alt = "$TOAD mascot — a green Pepe-style toad character",
}: ToadBrandImageProps) {
  const radius = shape === "circle" ? "rounded-full" : shape === "rounded" ? "rounded-3xl" : "rounded-none";

  return (
    <div className={cn("relative aspect-square overflow-hidden", radius, className)}>
      <Image
        src="/brand/toad-pepe.png"
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
