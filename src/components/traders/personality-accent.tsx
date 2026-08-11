import type { TraderPersonality } from "@/lib/types";

/**
 * Maps a personality's accent token to concrete classes. Kept in one place so a
 * new archetype only needs an accent name, not a design pass.
 *
 * `hex` mirrors the Tailwind `*-400` step of each ramp — Recharts can't read
 * Tailwind classes, so the two have to be kept in sync by hand.
 */
export const PERSONALITY_ACCENT: Record<
  TraderPersonality["accent"],
  {
    text: string;
    border: string;
    bg: string;
    glow: string;
    /** Hex used by the radar chart, which can't read Tailwind classes. */
    hex: string;
    badge: "toad" | "ember" | "foam" | "lily" | "orchid";
  }
> = {
  toad: {
    text: "text-toad-200",
    border: "border-toad-500/25",
    bg: "bg-toad-500/[0.07]",
    glow: "shadow-[0_0_70px_-22px_rgba(0,200,150,0.75)]",
    hex: "#1FDCA7",
    badge: "toad",
  },
  ember: {
    text: "text-ember-300",
    border: "border-ember-500/25",
    bg: "bg-ember-500/[0.07]",
    glow: "shadow-[0_0_70px_-22px_rgba(238,90,75,0.65)]",
    hex: "#FF7D6D",
    badge: "ember",
  },
  foam: {
    text: "text-foam-300",
    border: "border-foam-500/25",
    bg: "bg-foam-500/[0.07]",
    glow: "shadow-[0_0_70px_-22px_rgba(59,130,246,0.65)]",
    hex: "#6BA6FA",
    badge: "foam",
  },
  lily: {
    text: "text-lily-300",
    border: "border-lily-400/25",
    bg: "bg-lily-400/[0.07]",
    glow: "shadow-[0_0_70px_-22px_rgba(255,201,77,0.65)]",
    hex: "#FFC94D",
    badge: "lily",
  },
  orchid: {
    text: "text-orchid-300",
    border: "border-orchid-500/25",
    bg: "bg-orchid-500/[0.07]",
    glow: "shadow-[0_0_70px_-22px_rgba(159,95,238,0.65)]",
    hex: "#B889F7",
    badge: "orchid",
  },
};
