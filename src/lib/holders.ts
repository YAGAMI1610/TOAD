/**
 * Simple holder-tier helper used by the live holdings UI.
 */
export type HolderTier = "mega-whale" | "whale" | "regular";

export function getHolderTier(supplyPct: number): HolderTier {
  if (supplyPct >= 3) return "mega-whale";
  if (supplyPct >= 0.4) return "whale";
  return "regular";
}

export function supplyPctToBadge(supplyPct: number) {
  const tier = getHolderTier(supplyPct);
  return tier === "mega-whale" ? "mega-whale" : tier === "whale" ? "whale" : undefined;
}
