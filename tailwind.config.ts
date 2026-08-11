import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        /**
         * Near-black with an emerald undertone — "the pond at night".
         * Green channel runs a touch hot and blue trails it, so large fills read
         * as deep water rather than neutral grey or dead black.
         */
        ink: {
          975: "#020604",
          950: "#040A07",
          900: "#061009",
          850: "#09160F",
          800: "#0C1D14",
          750: "#10261A",
          700: "#152F21",
          600: "#1C3A2A",
          500: "#264836",
          400: "#375C48",
        },
        /** Primary accent: rich pond emerald, centred on #00C896. */
        toad: {
          50: "#E8FFF9",
          100: "#C4FCEC",
          200: "#8FF6D9",
          300: "#57EDC2",
          400: "#1FDCA7",
          500: "#00C896",
          600: "#00A87E",
          700: "#008865",
          800: "#036B51",
          900: "#05553F",
        },
        /** Secondary accent: warm lily-pad gold, used for highlights + milestones. */
        lily: {
          200: "#FFF2CC",
          300: "#FFE293",
          400: "#FFC94D",
          500: "#F2B01A",
          600: "#CE900B",
        },
        /** Sells / losses / risk — warm brick red, deliberately not neon. */
        ember: {
          300: "#FFA79C",
          400: "#FF7D6D",
          500: "#EE5A4B",
          600: "#CE3F32",
        },
        foam: {
          300: "#A5CDFF",
          400: "#6BA6FA",
          500: "#3B82F6",
        },
        orchid: {
          300: "#DCBBFE",
          400: "#B889F7",
          500: "#9F5FEE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        /** Resting glass surface: inner top highlight + a deep, soft drop. */
        pond: "inset 0 1px 0 0 rgba(255,255,255,0.045), 0 22px 55px -30px rgba(0,0,0,0.95)",
        /** Hover state: same but lifted, with the accent ring bleeding outward. */
        lift: "inset 0 1px 0 0 rgba(255,255,255,0.07), 0 34px 72px -34px rgba(0,0,0,1), 0 0 0 1px rgba(0,200,150,0.20), 0 0 44px -14px rgba(0,200,150,0.30)",
        /** Standalone accent glow for focused/active chrome. */
        glow: "0 0 0 1px rgba(0,200,150,0.30), 0 0 30px -10px rgba(0,200,150,0.45)",
        "glow-lily": "0 0 0 1px rgba(255,201,77,0.30), 0 0 30px -10px rgba(255,201,77,0.42)",
        "glow-ember": "0 0 0 1px rgba(238,90,75,0.28), 0 0 30px -10px rgba(238,90,75,0.40)",
        /** Button glows. */
        "btn-toad": "0 8px 26px -12px rgba(0,200,150,0.75), inset 0 1px 0 0 rgba(255,255,255,0.22)",
        "btn-toad-hover": "0 14px 34px -12px rgba(31,220,167,0.85), inset 0 1px 0 0 rgba(255,255,255,0.28)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-feed": {
          from: { opacity: "0", transform: "translateY(-14px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "70%": { transform: "scale(1.45)", opacity: "0" },
          "100%": { transform: "scale(1.45)", opacity: "0" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-120" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        /** Accent-tinted breathing used by skeletons instead of a grey pulse. */
        "pulse-accent": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        /** Lily pad bobbing on the water in the story section. */
        bob: {
          "0%, 100%": { transform: "translateY(0) rotate(-0.6deg)" },
          "50%": { transform: "translateY(-7px) rotate(0.6deg)" },
        },
        /** Expanding ripple rings under the lily pad. */
        ripple: {
          "0%": { transform: "scale(0.55)", opacity: "0.5" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        /** Chart / section reveal driven by an in-view observer. */
        "rise-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.4s ease both",
        "slide-in-feed": "slide-in-feed 0.45s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.8s infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
        "dash-flow": "dash-flow 3s linear infinite",
        float: "float 5s ease-in-out infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        "pulse-accent": "pulse-accent 2.1s cubic-bezier(0.4,0,0.6,1) infinite",
        bob: "bob 6s ease-in-out infinite",
        ripple: "ripple 3.4s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "rise-in": "rise-in 0.7s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
