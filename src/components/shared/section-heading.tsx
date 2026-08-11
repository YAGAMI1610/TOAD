import { cn } from "@/lib/utils";
import { DemoTag } from "@/components/layout/network-indicator";

interface SectionHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  showDemoTag?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  action,
  showDemoTag,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-toad-400/80">
            {eyebrow}
          </p>
        )}
        <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
          {title}
          {showDemoTag && <DemoTag />}
        </h2>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-white/[0.56]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
