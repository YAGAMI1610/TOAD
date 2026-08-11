"use client";

/**
 * The toad itself: a single inline SVG whose parts are animated with CSS.
 * No raster assets — every pose is driven by class names on the group elements
 * so the character can breathe, blink and react at any size.
 */

import { cn } from "@/lib/utils";

export type ToadPose = "idle" | "jump" | "land" | "dance" | "surprised" | "backflip" | "croak";

interface ToadSpriteProps {
  pose?: ToadPose;
  size?: number;
  className?: string;
  /** Disables idle loops — used by the static logo/share renderings. */
  frozen?: boolean;
}

export function ToadSprite({ pose = "idle", size = 46, className, frozen }: ToadSpriteProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("toad-root overflow-visible", `toad-pose-${pose}`, frozen && "toad-frozen", className)}
      role="img"
      aria-label="TOAD mascot"
    >
      <defs>
        <radialGradient id="toadBody" cx="38%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#8CE9AE" />
          <stop offset="46%" stopColor="#43C480" />
          <stop offset="100%" stopColor="#1C7C4C" />
        </radialGradient>
        <linearGradient id="toadBelly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8FBEF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#A7E9C4" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id="toadEye" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDF3E6" />
        </radialGradient>
        <linearGradient id="toadSac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#63D897" />
          <stop offset="100%" stopColor="#2E9C64" />
        </linearGradient>
      </defs>

      {/* Everything rotates as one for the backflip */}
      <g className="toad-flip" style={{ transformOrigin: "32px 40px" }}>
        {/* Back legs — kick out during a jump */}
        <g className="toad-legs-back">
          <ellipse cx="15" cy="47" rx="8.5" ry="5.4" fill="#2A9A61" />
          <ellipse cx="49" cy="47" rx="8.5" ry="5.4" fill="#2A9A61" />
          <ellipse cx="11" cy="50.5" rx="6" ry="3.2" fill="#238A55" />
          <ellipse cx="53" cy="50.5" rx="6" ry="3.2" fill="#238A55" />
        </g>

        {/* Body — the breathing group */}
        <g className="toad-body" style={{ transformOrigin: "32px 46px" }}>
          <ellipse cx="32" cy="38" rx="21" ry="17.5" fill="url(#toadBody)" />
          {/* Belly */}
          <ellipse cx="32" cy="43.5" rx="13" ry="10" fill="url(#toadBelly)" opacity="0.9" />
          {/* Back spots */}
          <ellipse cx="20" cy="30" rx="3.1" ry="2.2" fill="#1F8752" opacity="0.5" />
          <ellipse cx="44.5" cy="31" rx="2.6" ry="1.9" fill="#1F8752" opacity="0.45" />
          <ellipse cx="32" cy="26.5" rx="2.2" ry="1.6" fill="#1F8752" opacity="0.4" />

          {/* Throat sac — inflates on croak */}
          <ellipse className="toad-sac" cx="32" cy="49" rx="7" ry="4.6" fill="url(#toadSac)" opacity="0.92" />

          {/* Mouth */}
          <path
            className="toad-mouth"
            d="M23.5 41.5 Q32 47.5 40.5 41.5"
            stroke="#175E3A"
            strokeWidth="1.9"
            strokeLinecap="round"
            fill="none"
          />
          {/* Nostrils */}
          <circle cx="28.5" cy="35.5" r="1" fill="#175E3A" opacity="0.7" />
          <circle cx="35.5" cy="35.5" r="1" fill="#175E3A" opacity="0.7" />
        </g>

        {/* Front feet */}
        <g className="toad-feet">
          <ellipse cx="24" cy="53.5" rx="5.4" ry="2.9" fill="#37B073" />
          <ellipse cx="40" cy="53.5" rx="5.4" ry="2.9" fill="#37B073" />
        </g>

        {/* Eyes — sit on top of the head, widen when surprised */}
        <g className="toad-eyes">
          <g className="toad-eye toad-eye-left">
            <ellipse cx="22" cy="20.5" rx="8.2" ry="8.6" fill="url(#toadBody)" />
            <ellipse className="toad-eye-white" cx="22" cy="19.5" rx="5.9" ry="6.2" fill="url(#toadEye)" />
            <ellipse className="toad-pupil" cx="23" cy="20" rx="2.7" ry="3.1" fill="#0C2A1B" />
            <circle className="toad-glint" cx="24.4" cy="17.8" r="1.25" fill="#FFFFFF" opacity="0.95" />
            <ellipse className="toad-lid" cx="22" cy="19.5" rx="6.2" ry="6.5" fill="#3FBE7C" />
          </g>
          <g className="toad-eye toad-eye-right">
            <ellipse cx="42" cy="20.5" rx="8.2" ry="8.6" fill="url(#toadBody)" />
            <ellipse className="toad-eye-white" cx="42" cy="19.5" rx="5.9" ry="6.2" fill="url(#toadEye)" />
            <ellipse className="toad-pupil" cx="43" cy="20" rx="2.7" ry="3.1" fill="#0C2A1B" />
            <circle className="toad-glint" cx="44.4" cy="17.8" r="1.25" fill="#FFFFFF" opacity="0.95" />
            <ellipse className="toad-lid" cx="42" cy="19.5" rx="6.2" ry="6.5" fill="#3FBE7C" />
          </g>
        </g>
      </g>
    </svg>
  );
}
