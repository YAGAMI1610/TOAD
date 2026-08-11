"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { InfoHint } from "@/components/ui/tooltip";
import { RevealOnView } from "@/components/shared/reveal";
import type { PersonalityScores, TraderPersonality } from "@/lib/types";
import { PERSONALITY_ACCENT } from "./personality-accent";

const AXES: Array<{ key: keyof PersonalityScores; label: string; hint: string }> = [
  {
    key: "conviction",
    label: "Conviction",
    hint: "How strongly the wallet holds: buy/sell ratio, how rarely it fully exits, and position size relative to its trading.",
  },
  {
    key: "risk",
    label: "Risk",
    hint: "Appetite for volatility: trade sizing versus balance, and how concentrated single entries are.",
  },
  {
    key: "patience",
    label: "Patience",
    hint: "Average and maximum holding period. Longer holds score higher.",
  },
  {
    key: "activity",
    label: "Activity",
    hint: "Trade count and trades per active day.",
  },
  {
    key: "profitability",
    label: "Profitability",
    hint: "Realised win rate combined with return on invested capital.",
  },
];

export function PersonalityRadar({
  scores,
  accent,
}: {
  scores: PersonalityScores;
  accent: TraderPersonality["accent"];
}) {
  const colour = PERSONALITY_ACCENT[accent].hex;
  const data = AXES.map((a) => ({ axis: a.label, value: Math.round(scores[a.key]) }));
  /** Scoped so two radars with different accents can share a page. */
  const fillId = `radarFill-${accent}`;

  return (
    /* One observer drives both the radar sweep and the meter bars, so the whole
       block animates together the first time it scrolls into view. */
    <RevealOnView>
      {(inView) => (
        <div>
          <div className="h-[260px] w-full sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="72%">
                <defs>
                  <radialGradient id={fillId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={colour} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={colour} stopOpacity={0.12} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11.5 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke={colour}
                  strokeWidth={2}
                  fill={`url(#${fillId})`}
                  fillOpacity={1}
                  dot={{ r: 2.5, fill: colour, strokeWidth: 0 }}
                  isAnimationActive={inView}
                  animationDuration={760}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* The chart alone isn't accessible — the values are also listed. */}
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {AXES.map((a, i) => (
              <div key={a.key} className="flex items-center gap-2">
                <dt className="flex flex-1 items-center gap-1 text-[12.5px] text-white/[0.56]">
                  {a.label}
                  <InfoHint>{a.hint}</InfoHint>
                </dt>
                <dd className="flex items-center gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.07]">
                    <span
                      className="block h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: inView ? `${scores[a.key]}%` : 0,
                        backgroundColor: colour,
                        transitionDelay: `${i * 70}ms`,
                      }}
                    />
                  </span>
                  <span className="metric w-7 text-right text-[12.5px] font-semibold text-white/80">
                    {Math.round(scores[a.key])}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </RevealOnView>
  );
}
