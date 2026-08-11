import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

/** $18.4K / $1.42M / $2.5B — compact money for cards and feeds. */
export function formatUsd(value: number, opts?: { decimals?: number; sign?: boolean }): string {
  const { decimals, sign = false } = opts ?? {};
  const abs = Math.abs(value);
  const prefix = sign && value > 0 ? "+" : value < 0 ? "-" : "";

  let body: string;
  if (abs >= 1_000_000_000) body = `${trim(abs / 1_000_000_000, decimals ?? 2)}B`;
  else if (abs >= 1_000_000) body = `${trim(abs / 1_000_000, decimals ?? 2)}M`;
  else if (abs >= 1_000) body = `${trim(abs / 1_000, decimals ?? abs >= 100_000 ? 0 : 1)}K`;
  else body = trim(abs, decimals ?? (abs < 10 ? 2 : 0));

  return `${prefix}$${body}`;
}

/** Full precision money with separators: $18,420. */
export function formatUsdExact(value: number, decimals = 0): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 8.4M TOAD style token amounts. */
export function formatTokenAmount(value: number, opts?: { decimals?: number }): string {
  const abs = Math.abs(value);
  const d = opts?.decimals;
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000, d ?? 2)}B`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000, d ?? 2)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000, d ?? 1)}K`;
  return trim(value, d ?? 0);
}

/** Sub-cent token prices need significant digits, not fixed decimals. */
export function formatPrice(value: number): string {
  if (value >= 1) return `$${trim(value, 4)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toExponential(2)}`;
}

export function formatPct(value: number, opts?: { decimals?: number; sign?: boolean }): string {
  const { decimals = 1, sign = true } = opts ?? {};
  const prefix = sign && value > 0 ? "+" : "";
  return `${prefix}${trim(value, decimals)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Drops trailing zeros so 8.40M reads as 8.4M. */
function trim(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  if (!fixed.includes(".")) return Number(fixed).toLocaleString("en-US");
  const [whole, frac] = fixed.split(".");
  const trimmedFrac = frac.replace(/0+$/, "");
  const wholeFormatted = Number(whole).toLocaleString("en-US");
  return trimmedFrac ? `${wholeFormatted}.${trimmedFrac}` : wholeFormatted;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ */
/* Time                                                               */
/* ------------------------------------------------------------------ */

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Tight variant for dense tables: 4m, 3h, 6d. */
export function formatRelativeShort(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 365) return `${days}d`;
  return `${Math.floor(days / 365)}y`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** 74 days / 2.7 days / 18 minutes — used for holding periods. */
export function formatDuration(hours: number): string {
  if (hours < 1 / 60) return "< 1 minute";
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  if (hours < 48) {
    const h = hours < 10 ? trim(hours, 1) : Math.round(hours).toString();
    return `${h} hour${hours === 1 ? "" : "s"}`;
  }
  const days = hours / 24;
  if (days < 60) return `${trim(days, days < 10 ? 1 : 0)} days`;
  const months = days / 30.44;
  return `${trim(months, 1)} months`;
}

/* ------------------------------------------------------------------ */
/* Addresses                                                          */
/* ------------------------------------------------------------------ */

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Structural validation only — length + alphabet, no curve check. */
export function isValidSolanaAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 32 && trimmed.length <= 44 && BASE58.test(trimmed);
}

export function shortenAddress(address: string, head = 4, tail = 4): string {
  if (!address) return "";
  if (address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export function solscanAddressUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

export function solscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}

/** Best-effort clipboard write that also works on older iOS Safari. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
