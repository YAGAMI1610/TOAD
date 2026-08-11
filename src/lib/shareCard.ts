/**
 * Shareable card rendering.
 *
 * Cards are drawn with the Canvas 2D API rather than screenshotting the DOM, so
 * there's no html2canvas dependency and the output is a predictable 1200×675
 * PNG that looks right in an X card preview.
 */

import { formatPct, formatUsd, shortenAddress } from "./utils";
import type { JourneyState, TraderProfile } from "./types";

const W = 1200;
const H = 675;

const INK = "#040A07";
const TOAD = "#1FDCA7";
const TOAD_LIGHT = "#8FF6D9";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function baseCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable in this browser.");

  // Background
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  const wash = ctx.createRadialGradient(180, -60, 40, 180, -60, 780);
  wash.addColorStop(0, "rgba(0,200,150,0.30)");
  wash.addColorStop(1, "rgba(0,200,150,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  const wash2 = ctx.createRadialGradient(1080, 40, 30, 1080, 40, 640);
  wash2.addColorStop(0, "rgba(59,130,246,0.14)");
  wash2.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = wash2;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 28);
  ctx.stroke();

  return { canvas, ctx };
}

function drawBrand(ctx: CanvasRenderingContext2D) {
  ctx.font = "600 24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "left";
  ctx.fillText("🐸  TOAD Intelligence", 64, 84);
}

function drawDemoNote(ctx: CanvasRenderingContext2D, isDemo: boolean) {
  if (!isDemo) return;
  const label = "DEMO DATA — SIMULATED";
  ctx.font = "700 15px system-ui, -apple-system, Segoe UI, sans-serif";
  const w = ctx.measureText(label).width + 28;
  ctx.fillStyle = "rgba(255,201,77,0.14)";
  roundRect(ctx, W - 64 - w, 62, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,201,77,0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, W - 64 - w, 62, w, 30, 15);
  ctx.stroke();
  ctx.fillStyle = "#FFE293";
  ctx.textAlign = "center";
  ctx.fillText(label, W - 64 - w / 2, 83);
  ctx.textAlign = "left";
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode the card image."));
    }, "image/png");
  });
}

/* ------------------------------------------------------------------ */
/* Journey card                                                        */
/* ------------------------------------------------------------------ */

export async function renderJourneyCard(journey: JourneyState, isDemo: boolean): Promise<Blob> {
  const { canvas, ctx } = baseCanvas();
  drawBrand(ctx);
  drawDemoNote(ctx, isDemo);

  ctx.textAlign = "left";
  ctx.font = "500 20px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(143,246,217,0.75)";
  ctx.fillText("THE TOAD JOURNEY", 64, 172);

  ctx.font = "800 68px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(formatUsd(journey.marketCapUsd), 64, 250);

  ctx.font = "500 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("Current market cap", 64, 288);

  // Progress bar
  const barY = 356;
  const barW = W - 128;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRect(ctx, 64, barY, barW, 20, 10);
  ctx.fill();

  const fill = Math.max(0.02, journey.progressPct / 100) * barW;
  const grad = ctx.createLinearGradient(64, 0, 64 + fill, 0);
  grad.addColorStop(0, "#00C896");
  grad.addColorStop(1, TOAD_LIGHT);
  ctx.fillStyle = grad;
  roundRect(ctx, 64, barY, fill, 20, 10);
  ctx.fill();

  // Lily pads along the bar
  journey.milestones.forEach((m, i) => {
    const x = 64 + (barW * (i + 0.5)) / journey.milestones.length;
    const reached = i <= journey.currentIndex;
    ctx.font = `${reached ? 30 : 24}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.globalAlpha = reached ? 1 : 0.32;
    ctx.textAlign = "center";
    ctx.fillText(m.emoji, x, barY - 22);
    ctx.globalAlpha = 1;
  });
  ctx.textAlign = "left";

  ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = TOAD_LIGHT;
  ctx.fillText(`${journey.progressPct.toFixed(1)}% to the next lily pad`, 64, barY + 62);

  // Next milestone panel
  if (journey.next) {
    const panelY = 452;
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    roundRect(ctx, 64, panelY, W - 128, 140, 22);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,200,150,0.26)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 64, panelY, W - 128, 140, 22);
    ctx.stroke();

    ctx.font = "500 18px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("NEXT MILESTONE", 100, panelY + 44);

    ctx.font = "700 36px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${journey.next.emoji}  ${journey.next.label}`, 100, panelY + 92);

    ctx.textAlign = "right";
    ctx.font = "800 44px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = TOAD;
    ctx.fillText(formatUsd(journey.next.target, { decimals: 0 }), W - 100, panelY + 78);
    ctx.font = "500 20px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`${journey.multipleToNext.toFixed(1)}x from here`, W - 100, panelY + 110);
    ctx.textAlign = "left";
  }

  ctx.font = "italic 500 20px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText("Every lily pad is a milestone.", 64, H - 40);

  return toBlob(canvas);
}

/* ------------------------------------------------------------------ */
/* Personality card                                                    */
/* ------------------------------------------------------------------ */

export async function renderPersonalityCard(profile: TraderProfile, isDemo: boolean): Promise<Blob> {
  const { canvas, ctx } = baseCanvas();
  drawBrand(ctx);
  drawDemoNote(ctx, isDemo);

  const { personality, metrics, pnl } = profile;

  ctx.textAlign = "left";
  ctx.font = "500 20px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(143,246,217,0.75)";
  ctx.fillText("MY TOAD PERSONALITY", 64, 172);

  // Emoji badge
  ctx.font = "96px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(personality.emoji, 64, 288);

  ctx.font = "800 56px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(personality.name.toUpperCase(), 190, 268);

  ctx.font = "500 24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(shortenAddress(profile.wallet.address, 6, 6), 190, 306);

  // Tagline
  ctx.font = "italic 500 26px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = TOAD_LIGHT;
  ctx.fillText(`"${personality.quote}"`, 64, 380);

  // Stat tiles
  const tiles: Array<[string, string]> = [
    ["WIN RATE", `${metrics.winRatePct.toFixed(0)}%`],
    ["TRADES", metrics.totalTrades.toLocaleString()],
    ["REALIZED PNL", formatUsd(pnl.realizedUsd, { sign: true })],
    ["ROI", formatPct(pnl.roiPct)],
  ];

  const tileW = (W - 128 - 3 * 18) / 4;
  tiles.forEach(([label, value], i) => {
    const x = 64 + i * (tileW + 18);
    const y = 430;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    roundRect(ctx, x, y, tileW, 116, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, tileW, 116, 20);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "600 15px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fillText(label, x + tileW / 2, y + 40);

    const positive = value.startsWith("+");
    const negative = value.startsWith("-");
    ctx.font = "800 38px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = positive ? TOAD : negative ? "#FF7D6D" : "#FFFFFF";
    ctx.fillText(value, x + tileW / 2, y + 88);
  });

  ctx.textAlign = "left";
  ctx.font = "italic 500 20px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillText("Find your TOAD personality at TOAD Intelligence.", 64, H - 40);

  return toBlob(canvas);
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

/** Clipboard image write, with a download fallback for browsers without it. */
export async function copyImage(blob: Blob): Promise<"copied" | "downloaded"> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return "copied";
    }
  } catch {
    /* Safari rejects async clipboard writes outside a user gesture — fall through. */
  }
  downloadImage(blob, "toad-intelligence.png");
  return "downloaded";
}

export function downloadImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function tweetUrl(text: string, url?: string): string {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  return `https://x.com/intent/tweet?${params.toString()}`;
}
