"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Wallet2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToadSprite } from "@/components/mascot/toad-sprite";
import { NetworkIndicator } from "./network-indicator";
import { WalletSearch } from "@/components/shared/wallet-search";
import { ConnectWalletButton } from "@/components/shared/connect-wallet-button";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/whales", label: "Whale Feed" },
  { href: "/traders", label: "Trader Profiles" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-lg"
          aria-label="TOAD Intelligence home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-toad-500/25 bg-toad-500/10 transition-colors group-hover:border-toad-400/45 group-hover:bg-toad-500/[0.16]">
            <ToadSprite size={22} frozen className="translate-y-[1px]" />
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-white">
            TOAD<span className="text-toad-400"> Intelligence</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="ml-4 hidden items-center gap-1 lg:flex"
          data-toad-perch
          data-toad-reaction="nav"
          data-toad-key="navbar"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors",
                isActive(item.href) ? "text-white" : "text-white/60 hover:text-white/85"
              )}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-toad-400/80" />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Desktop search */}
          <div className="hidden w-56 xl:block">
            <WalletSearch compact />
          </div>

          {/* Tablet/mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label="Search wallets"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-4 w-4" />
          </Button>

          <NetworkIndicator className="hidden sm:flex" />
          <ConnectWalletButton />

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Collapsible search bar for small screens */}
      {searchOpen && (
        <div className="animate-fade-in border-t border-white/[0.06] bg-ink-950/95 px-4 py-3 backdrop-blur-xl xl:hidden">
          <div className="container px-0">
            <WalletSearch autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="animate-fade-in border-t border-white/[0.06] bg-ink-950/95 backdrop-blur-xl lg:hidden">
          <nav className="container flex flex-col py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  isActive(item.href) ? "bg-toad-500/10 text-toad-200" : "text-white/[0.68] hover:bg-white/5"
                )}
              >
                {item.label}
                {isActive(item.href) && <span className="h-1.5 w-1.5 rounded-full bg-toad-400" />}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-3 py-3">
              <NetworkIndicator />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
