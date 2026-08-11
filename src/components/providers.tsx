"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToadSettingsProvider } from "@/components/mascot/mascot-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToadSettingsProvider>
      <TooltipProvider delayDuration={150} skipDelayDuration={300}>
        {children}
        <Toaster
          position="bottom-right"
          gap={10}
          toastOptions={{
            classNames: {
              toast:
                "!bg-ink-800/95 !border-white/10 !text-white/85 !backdrop-blur-xl !rounded-xl !shadow-lift !font-sans",
              title: "!text-[13px] !font-semibold",
              description: "!text-[12px] !text-white/60",
              actionButton: "!bg-toad-500 !text-ink-950 !font-semibold !rounded-lg",
            },
          }}
        />
      </TooltipProvider>
    </ToadSettingsProvider>
  );
}
