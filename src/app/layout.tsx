import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import "@/components/mascot/mascot.css";
import { AppProviders } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ToadMascot } from "@/components/mascot/toad-mascot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TOAD Intelligence — On-chain intel for $TOAD",
    template: "%s · TOAD Intelligence",
  },
  description:
    "Track whale movements, discover top traders, and uncover the personalities behind $TOAD activity on Solana.",
  openGraph: {
    title: "TOAD Intelligence",
    description: "Know what the TOADs are doing. Whale flow, trader personalities, and the road to $10B.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TOAD Intelligence",
    description: "Know what the TOADs are doing.",
  },
  icons: {
    icon: [{ url: "/toad.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#040A07",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${jetbrains.variable} dark`}>
      <body className="min-h-dvh">
        <AppProviders>
          {/* Skip link — the mascot and sticky header make keyboard nav worth easing */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-toad-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="pb-10 md:pb-16">
            {children}
          </main>
          <SiteFooter />
          <MobileNav />
          <ToadMascot />
        </AppProviders>
      </body>
    </html>
  );
}
