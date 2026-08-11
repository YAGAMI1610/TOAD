"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Ambient blockchain/network backdrop for the hero.
 *
 * A sparse constellation of nodes with edges that light up as a "transaction"
 * travels between them. Deliberately slow and low-contrast — it should read as
 * texture, not as an animation demanding attention.
 */
export function NetworkBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf: number | undefined;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }
    interface Pulse {
      from: number;
      to: number;
      t: number;
      speed: number;
    }

    let nodes: Node[] = [];
    let pulses: Pulse[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Node count scales with area, capped so phones stay smooth.
      const count = Math.min(34, Math.max(12, Math.round((width * height) / 34000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 1 + Math.random() * 1.6,
      }));
      pulses = [];
    };

    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    // Static render for reduced motion: draw once, no loop.
    const LINK_DISTANCE = 168;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DISTANCE) continue;
          const alpha = (1 - dist / LINK_DISTANCE) * 0.16;
          ctx.strokeStyle = `rgba(111, 224, 162, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      // Travelling pulses
      for (const p of pulses) {
        const a = nodes[p.from];
        const b = nodes[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const fade = Math.sin(p.t * Math.PI);
        ctx.fillStyle = `rgba(140, 233, 174, ${0.75 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(140, 233, 174, ${0.14 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nodes
      for (const n of nodes) {
        ctx.fillStyle = "rgba(160, 235, 190, 0.42)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reduced) {
      draw();
      return () => window.removeEventListener("resize", onResize);
    }

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        // Wrap rather than bounce — no visible turning points.
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      }

      // Occasionally fire a pulse between two nearby nodes.
      if (pulses.length < 4 && Math.random() < 0.014 && nodes.length > 2) {
        const from = Math.floor(Math.random() * nodes.length);
        let to = -1;
        let best = LINK_DISTANCE;
        for (let j = 0; j < nodes.length; j++) {
          if (j === from) continue;
          const d = Math.hypot(nodes[from].x - nodes[j].x, nodes[from].y - nodes[j].y);
          if (d < best) {
            best = d;
            to = j;
          }
        }
        if (to >= 0) pulses.push({ from, to, t: 0, speed: 0.006 + Math.random() * 0.008 });
      }

      pulses = pulses.filter((p) => {
        p.t += p.speed;
        return p.t < 1;
      });

      draw();
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="grid-bg absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />
      {/* Bottom fade so the hero dissolves into the page */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-ink-950" />
    </div>
  );
}
