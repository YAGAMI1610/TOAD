/**
 * Community and trading links.
 *
 * Every one of these is an unset placeholder until the corresponding env var is
 * provided, and the UI reflects that honestly: an unconfigured link renders as a
 * disabled "coming soon" control rather than a button that goes nowhere. Same
 * principle as the data layer — never present a placeholder as the real thing.
 *
 *   NEXT_PUBLIC_TOAD_X_URL       https://x.com/…
 *   NEXT_PUBLIC_TOAD_DEX_URL     Jupiter / Raydium / DexScreener swap page
 *   NEXT_PUBLIC_TOAD_EXCHANGE    Human-readable exchange or DEX name
 */

export interface ExternalLink {
  /** Absolute URL, or undefined while unconfigured. */
  url?: string;
  /** True once a real destination is set. */
  configured: boolean;
}

function link(url?: string): ExternalLink {
  const trimmed = url?.trim();
  return { url: trimmed || undefined, configured: Boolean(trimmed) };
}

export const externalLinks = {
  /** X / Twitter community. */
  x: link(process.env.NEXT_PUBLIC_TOAD_X_URL),
  /** Where to buy $TOAD. */
  dex: link(process.env.NEXT_PUBLIC_TOAD_DEX_URL),
};

/**
 * Where $TOAD trades. Falls back to the chain-level truth — Solana DEXs — which
 * is accurate for any SPL token, rather than naming an exchange we can't verify.
 */
export const listedOn = process.env.NEXT_PUBLIC_TOAD_EXCHANGE?.trim() || "Solana DEXs";

/** True when the exchange name is still the generic fallback. */
export const hasExchangeName = Boolean(process.env.NEXT_PUBLIC_TOAD_EXCHANGE?.trim());
