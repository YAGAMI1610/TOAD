"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Waves, UserSearch, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/whales", label: "Whales", icon: Waves },
  { href: "/traders", label: "Analyze", icon: UserSearch },
  { href: "/leaderboard", label: "Ranks", icon: Trophy },
] as const;

/**
 * Thumb-reachable bottom bar on mobile only.
 *
 * Frosted rather than flat: the pond gradient behind it shows through a heavy
 * blur, and the whole bar sits above the safe-area inset so it clears the iOS
 * home indicator. The active item gets three cues at once — a lit top rail, a
 * glowing icon pill, and full-opacity text — so it reads without relying on the
 * accent hue alone.
 */
export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-50 border-x-0 border-b-0 border-t border-white/[0.09] bg-ink-950/70 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.8)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      {/* Hairline of accent light along the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-toad-500/35 to-transparent"
      />

      <div className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-[60px] flex-col items-center justify-center gap-1 transition-colors duration-300 active:scale-[0.96]",
                active ? "text-toad-200" : "text-white/[0.52]"
              )}
            >
              {/* Glowing indicator for the active tab */}
              {active && (
                <>
                  <span
                    aria-hidden
                    className="absolute top-0 h-[2.5px] w-9 rounded-b-full bg-toad-400 shadow-[0_0_14px_1px_rgba(31,220,167,0.85)]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-x-3 inset-y-1 rounded-2xl bg-toad-500/[0.09]"
                  />
                </>
              )}

              <Icon
                className={cn(
                  "relative h-[19px] w-[19px] transition-transform duration-300",
                  active && "drop-shadow-[0_0_8px_rgba(31,220,167,0.55)]"
                )}
                strokeWidth={active ? 2.4 : 1.9}
              />
              <span
                className={cn(
                  "relative text-[10.5px] tracking-wide transition-all duration-300",
                  active ? "font-bold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
