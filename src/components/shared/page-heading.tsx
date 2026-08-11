import { cn } from "@/lib/utils";

/**
 * The h1 block at the top of a route. Kept separate from SectionHeading so
 * there's exactly one h1 per page and the type scale stays consistent.
 */
export function PageHeading({
  title,
  subtitle,
  eyebrow,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-toad-400/80">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-white sm:text-[34px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/[0.56] sm:text-sm">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
