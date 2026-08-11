"use client";

/**
 * The TOAD mascot — a physics-driven frog that lives across the whole app.
 *
 * How it works:
 *  - Any element tagged `data-toad-perch` registers itself as a landing target.
 *    A MutationObserver + scroll/resize listeners keep the target list fresh, so
 *    the toad naturally follows whatever page you're on.
 *  - Targets carry a `data-toad-reaction` hint ("whale" | "number" | "plain")
 *    that determines what the toad does on landing.
 *  - Motion is a real projectile arc integrated per frame (gravity + horizontal
 *    velocity) rather than a CSS keyframe, so every hop is slightly different
 *    and the shadow can scale with true altitude.
 *  - Everything is a single fixed-position SVG at pointer-events:none, except
 *    the toad body itself which is clickable.
 *
 * Guardrails: never lands on targets marked `data-toad-no-perch`, keeps a
 * safety margin from viewport edges, sits *above* perches rather than over
 * their content, and disables itself entirely under prefers-reduced-motion.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useToadSettings } from "./mascot-context";
import { ToadSprite, type ToadPose } from "./toad-sprite";

/* ------------------------------------------------------------------ */
/* Tuning                                                              */
/* ------------------------------------------------------------------ */

const GRAVITY = 2100; // px/s² — snappier than earth, reads as cartoon-weighty
const DESKTOP_SIZE = 46;
const MOBILE_SIZE = 34;
const EDGE_MARGIN = 12;
/** Vertical offset so the toad's feet sit on the perch's top edge. */
const FOOT_OFFSET = 3;
/**
 * Height of the fixed mobile bottom nav. The toad renders above it in the stack,
 * so its ground line has to clear the nav or it would swallow nav taps.
 */
const MOBILE_NAV_HEIGHT = 62;

type Phase = "idle" | "crouch" | "air" | "land" | "react" | "trick";

interface Vec {
  x: number;
  y: number;
}

interface Perch {
  /** Landing point in viewport coordinates (toad centre-bottom). */
  x: number;
  y: number;
  reaction: ReactionKind;
  /** Element width, used to bias toward wide, stable perches. */
  width: number;
  key: string;
}

type ReactionKind = "whale" | "number" | "plain" | "nav";

interface ToadState {
  pos: Vec;
  vel: Vec;
  phase: Phase;
  /** Height above the current ground line — drives shadow scale. */
  altitude: number;
  facing: 1 | -1;
  ground: number;
}

/* ------------------------------------------------------------------ */
/* Perch discovery                                                     */
/* ------------------------------------------------------------------ */

function collectPerches(isMobile: boolean, size: number): Perch[] {
  if (typeof document === "undefined") return [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-toad-perch]"));

  const perches: Perch[] = [];
  for (const node of nodes) {
    if (node.hasAttribute("data-toad-no-perch")) continue;
    const rect = node.getBoundingClientRect();

    // Only perch on things comfortably inside the viewport — and, on mobile,
    // above the fixed bottom nav so the toad never covers a nav button.
    const lowestPerch = vh - (isMobile ? MOBILE_NAV_HEIGHT + 34 : 90);
    if (rect.width < 40 || rect.height < 12) continue;
    if (rect.top < 56 || rect.top > lowestPerch) continue;
    if (rect.right < 0 || rect.left > vw) continue;

    const reaction = (node.dataset.toadReaction as ReactionKind) || "plain";

    // On mobile, prefer the lower half of the screen so the toad stays out of
    // the way of whatever the user is reading at the top.
    if (isMobile && rect.top < vh * 0.42) continue;

    const clampedLeft = Math.max(EDGE_MARGIN + size / 2, rect.left + size * 0.6);
    const clampedRight = Math.min(vw - EDGE_MARGIN - size / 2, rect.right - size * 0.6);
    if (clampedRight <= clampedLeft) continue;

    // Bias toward the edges of a card rather than dead centre over content.
    const t = Math.random();
    const x = t < 0.45 ? clampedLeft : t < 0.9 ? clampedRight : clampedLeft + (clampedRight - clampedLeft) * Math.random();

    perches.push({
      x,
      y: rect.top - FOOT_OFFSET,
      reaction,
      width: rect.width,
      key: `${node.dataset.toadKey ?? node.className}-${Math.round(rect.top)}`,
    });
  }
  return perches;
}

/** Fallback perch line when a page has no registered targets in view. */
function floorPerch(size: number, isMobile: boolean): Perch {
  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  return {
    x: Math.max(EDGE_MARGIN + size, Math.min(vw - EDGE_MARGIN - size, vw * (0.15 + Math.random() * 0.7))),
    y: vh - (isMobile ? MOBILE_NAV_HEIGHT + 10 : 28),
    reaction: "plain",
    width: 200,
    key: "floor",
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ToadMascot() {
  const reducedMotion = usePrefersReducedMotion();
  const { enabled } = useToadSettings();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const size = isMobile ? MOBILE_SIZE : DESKTOP_SIZE;

  const [pose, setPose] = useState<ToadPose>("idle");
  const [reaction, setReaction] = useState<ReactionKind | null>(null);
  const [croak, setCroak] = useState<string | null>(null);

  // Rendering is driven by direct DOM writes in the rAF loop — React state
  // updates at 60fps would thrash the whole tree.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef<ToadState>({
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    phase: "idle",
    altitude: 0,
    facing: 1,
    ground: 0,
  });
  const perchesRef = useRef<Perch[]>([]);
  const nextHopAtRef = useRef(0);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef(0);
  const trickUntilRef = useRef(0);
  const offscreenRef = useRef(false);

  const active = mounted && enabled && !reducedMotion;

  /* --- perch bookkeeping ------------------------------------------- */

  const refreshPerches = useCallback(() => {
    perchesRef.current = collectPerches(isMobile, size);
  }, [isMobile, size]);

  useEffect(() => {
    if (!active) return;
    refreshPerches();

    // Collecting perches reads layout for every target, so coalesce bursts of
    // scroll events into one read per frame rather than one read per event.
    let queued = 0;
    const onChange = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        refreshPerches();
      });
    };

    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);

    // Catch route changes and feed items appearing without polling.
    let debounce = 0;
    const observer = new MutationObserver(() => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(onChange, 220);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (queued) cancelAnimationFrame(queued);
      window.clearTimeout(debounce);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      observer.disconnect();
    };
  }, [active, refreshPerches]);

  /* --- initial placement -------------------------------------------- */

  useEffect(() => {
    if (!active) return;
    const s = stateRef.current;
    if (s.pos.x === 0 && s.pos.y === 0) {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      s.pos = { x: vw * (isMobile ? 0.78 : 0.86), y: vh - (isMobile ? MOBILE_NAV_HEIGHT + 20 : 40) };
      s.ground = s.pos.y;
      // Let the page paint and perches register before the first hop, otherwise
      // the toad leaps along the floor while the real targets are still mounting.
      nextHopAtRef.current = performance.now() + 1400;
    }
  }, [active, isMobile]);

  /* --- jump planning ------------------------------------------------- */

  const planHop = useCallback(() => {
    const s = stateRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let target: Perch;
    const perches = perchesRef.current;

    // 8% of hops: leap off-screen and re-enter from the other side.
    const goOffscreen = !offscreenRef.current && perches.length > 0 && Math.random() < 0.08;

    if (offscreenRef.current) {
      // Coming back in — aim for any perch, entering from the opposite edge.
      target = perches.length
        ? perches[Math.floor(Math.random() * perches.length)]
        : floorPerch(size, isMobile);
      s.pos = {
        x: s.pos.x < vw / 2 ? -size : vw + size,
        y: Math.min(vh - 80, Math.max(120, target.y - 120)),
      };
      offscreenRef.current = false;
    } else if (goOffscreen) {
      const exitLeft = s.pos.x > vw / 2;
      target = {
        x: exitLeft ? -size * 2 : vw + size * 2,
        y: Math.max(120, s.pos.y - 40 + Math.random() * 80),
        reaction: "plain",
        width: 100,
        key: "offscreen",
      };
      offscreenRef.current = true;
    } else if (perches.length === 0) {
      target = floorPerch(size, isMobile);
    } else {
      // Prefer perches that require a reasonable hop — avoids twitchy micro-jumps
      // and impossible cross-screen leaps.
      const scored = perches
        .map((p) => {
          const dx = Math.abs(p.x - s.pos.x);
          const dy = Math.abs(p.y - s.pos.y);
          const dist = Math.hypot(dx, dy);
          const ideal = isMobile ? 130 : 240;
          const distanceScore = 1 / (1 + Math.abs(dist - ideal) / ideal);
          const interest = p.reaction === "whale" ? 1.35 : p.reaction === "number" ? 1.5 : 1;
          const sameSpot = dist < 30 ? 0.02 : 1;
          return { p, score: distanceScore * interest * sameSpot * (0.6 + Math.random() * 0.8) };
        })
        .sort((a, b) => b.score - a.score);
      target = scored[0].p;
    }

    // Solve the projectile: pick a flight time, derive the launch velocity.
    const dx = target.x - s.pos.x;
    const dy = target.y - s.pos.y;
    const distance = Math.hypot(dx, dy);
    const flightTime = Math.min(1.5, Math.max(0.52, distance / (isMobile ? 320 : 420)));

    s.vel = {
      x: dx / flightTime,
      // Standard kinematics: vy such that we arrive exactly at dy after t.
      y: dy / flightTime - 0.5 * GRAVITY * flightTime,
    };
    s.ground = target.y;
    s.facing = dx >= 0 ? 1 : -1;
    s.phase = "air";
    setPose("jump");
    setReaction(null);

    // Stash the landing reaction for when we touch down.
    landingReactionRef.current = target.reaction;
  }, [isMobile, size]);

  const landingReactionRef = useRef<ReactionKind>("plain");

  /* --- main loop ------------------------------------------------------ */

  useEffect(() => {
    if (!active) return;

    const step = (time: number) => {
      const s = stateRef.current;
      const dt = lastTimeRef.current ? Math.min(0.05, (time - lastTimeRef.current) / 1000) : 0.016;
      lastTimeRef.current = time;

      if (s.phase === "air") {
        s.vel.y += GRAVITY * dt;
        s.pos.x += s.vel.x * dt;
        s.pos.y += s.vel.y * dt;
        s.altitude = Math.max(0, s.ground - s.pos.y);

        const landed = s.vel.y > 0 && s.pos.y >= s.ground;
        const wentOffscreen =
          offscreenRef.current && (s.pos.x < -size * 1.5 || s.pos.x > window.innerWidth + size * 1.5);

        if (wentOffscreen) {
          s.phase = "idle";
          s.altitude = 0;
          // Re-enter after a beat.
          nextHopAtRef.current = time + 900 + Math.random() * 900;
          setPose("idle");
        } else if (landed) {
          s.pos.y = s.ground;
          s.vel = { x: 0, y: 0 };
          s.altitude = 0;
          s.phase = "land";
          setPose("land");

          const kind = landingReactionRef.current;
          window.setTimeout(() => {
            if (kind === "number") {
              setPose("dance");
              setReaction("number");
              window.setTimeout(() => {
                setPose("idle");
                setReaction(null);
              }, 1500);
            } else if (kind === "whale") {
              setPose("surprised");
              setReaction("whale");
              window.setTimeout(() => {
                setPose("idle");
                setReaction(null);
              }, 1200);
            } else {
              setPose("idle");
            }
          }, 150);

          // Longer dwell after a reaction so the animation can play out.
          const dwell = kind === "number" ? 3400 : kind === "whale" ? 3000 : 2200;
          nextHopAtRef.current = time + dwell + Math.random() * 2600;
        }
      } else if (s.phase === "idle" || s.phase === "land" || s.phase === "react") {
        if (time >= nextHopAtRef.current && time >= trickUntilRef.current) {
          planHop();
        }
      } else if (s.phase === "trick") {
        if (time >= trickUntilRef.current) {
          s.phase = "idle";
          setPose("idle");
          nextHopAtRef.current = time + 700;
        }
      }

      // Commit to the DOM.
      const wrapper = wrapperRef.current;
      if (wrapper) {
        wrapper.style.transform = `translate3d(${Math.round(s.pos.x - size / 2)}px, ${Math.round(
          s.pos.y - size
        )}px, 0)`;
      }
      const body = bodyRef.current;
      if (body) {
        // Squash on launch, stretch at apex — classic anticipation/follow-through.
        const speed = Math.min(1, Math.abs(s.vel.y) / 900);
        const stretch = s.phase === "air" ? 1 + speed * 0.16 : 1;
        const squash = s.phase === "air" ? 1 - speed * 0.1 : 1;
        body.style.transform = `scaleX(${(s.facing * squash).toFixed(3)}) scaleY(${stretch.toFixed(3)})`;
      }
      const shadow = shadowRef.current;
      if (shadow) {
        // Shadow shrinks and fades as altitude grows.
        const alt = Math.min(1, s.altitude / 220);
        shadow.style.transform = `translateX(-50%) scale(${(1 - alt * 0.55).toFixed(3)})`;
        shadow.style.opacity = `${(0.34 - alt * 0.26).toFixed(3)}`;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [active, planHop, size]);

  /* --- interaction ----------------------------------------------------- */

  const CROAKS = useMemo(
    () => ["ribbit", "croak!", "*blorp*", "hop hop", "🐸", "ribbit ribbit"],
    []
  );

  const handlePoke = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "air") return;

    const trick = Math.random() < 0.55 ? "backflip" : "croak";
    s.phase = "trick";
    trickUntilRef.current = performance.now() + (trick === "backflip" ? 900 : 1400);
    setPose(trick === "backflip" ? "backflip" : "croak");
    if (trick === "croak") setCroak(CROAKS[Math.floor(Math.random() * CROAKS.length)]);
    window.setTimeout(() => setCroak(null), 1300);
  }, [CROAKS]);

  if (!active) return null;

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed left-0 top-0 z-[60] will-change-transform"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Shadow sits on the ground line, independent of the body's hop */}
      <div
        ref={shadowRef}
        className="absolute left-1/2 rounded-[50%] bg-black blur-[3px]"
        style={{ bottom: -4, width: size * 0.78, height: size * 0.2, opacity: 0.3 }}
      />

      {croak && (
        <div className="animate-fade-up absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-toad-500/30 bg-ink-850/90 px-2 py-0.5 text-[10px] font-semibold text-toad-200 backdrop-blur">
          {croak}
        </div>
      )}

      {reaction === "number" && (
        <div className="animate-fade-up absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm">
          ✨
        </div>
      )}
      {reaction === "whale" && (
        <div className="animate-fade-up absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs">
          👀
        </div>
      )}

      <div
        ref={bodyRef}
        className="pointer-events-auto h-full w-full cursor-pointer origin-bottom"
        onClick={handlePoke}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handlePoke();
        }}
        role="button"
        tabIndex={-1}
      >
        <ToadSprite pose={pose} size={size} />
      </div>
    </div>
  );
}
