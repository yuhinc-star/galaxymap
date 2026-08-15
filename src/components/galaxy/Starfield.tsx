import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  speed: number;
  phase: number;
  color: string;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#ffe066", "#7de2d1", "#ff9de2", "#ffd6a5"];
const SPARKLE_COLORS = ["#ffffff", "#ffe066", "#7de2d1", "#ff9de2"];

/**
 * Dense twinkling starfield with 4-point sparkle crosses and occasional
 * shooting comets, drawn on canvas — like the packed sky of the reference.
 */
export function Starfield({
  size,
  width,
  height,
}: {
  size: number;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = width ?? size;
  const h = height ?? size;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Cap backing-store pixels so huge worlds stay cheap on mobile GPUs.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, 2048 / Math.max(w, h));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Dense field of small dots packed across the whole sky.
    const stars: Star[] = Array.from({ length: 1250 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 3,
      base: 0.35 + Math.random() * 0.65,
      speed: 0.6 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] ?? "#ffffff",
    }));

    // Bigger plus-shaped sparkles scattered between the dots.
    const sparkles: Sparkle[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 7 + Math.random() * 9,
      speed: 0.8 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)] ?? "#ffffff",
    }));

    const comets: Comet[] = [];
    let nextCometIn = 2000 + Math.random() * 2500;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        ctx.globalAlpha = s.base * (0.55 + 0.45 * Math.sin(t * s.speed + s.phase));
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Plus-shaped sparkle crosses that pulse in and out.
      ctx.lineCap = "round";
      ctx.lineWidth = 3.5;
      for (const sp of sparkles) {
        const pulse = 0.5 + 0.5 * Math.sin(t * sp.speed + sp.phase);
        const len = sp.size * (0.55 + 0.45 * pulse);
        ctx.globalAlpha = 0.25 + 0.75 * pulse;
        ctx.strokeStyle = sp.color;
        ctx.beginPath();
        ctx.moveTo(sp.x - len, sp.y);
        ctx.lineTo(sp.x + len, sp.y);
        ctx.moveTo(sp.x, sp.y - len);
        ctx.lineTo(sp.x, sp.y + len);
        ctx.stroke();
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      nextCometIn -= dt;
      if (nextCometIn <= 0) {
        nextCometIn = 3500 + Math.random() * 4500;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.7 + Math.random() * 0.6; // px per ms
        comets.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.6,
          vx: Math.cos(angle) * speed,
          vy: Math.abs(Math.sin(angle)) * speed * 0.6 + 0.2,
          life: 0,
          maxLife: 1100 + Math.random() * 500,
        });
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        if (!c) continue;
        c.life += dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.life > c.maxLife) {
          comets.splice(i, 1);
          continue;
        }
        const fade = 1 - c.life / c.maxLife;
        const tailX = c.x - c.vx * 130;
        const tailY = c.y - c.vy * 130;
        const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 240, 180, ${0.9 * fade})`);
        grad.addColorStop(1, "rgba(255, 240, 180, 0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 250, 220, ${fade})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size, w, h]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: w, height: h }}
      aria-hidden
    />
  );
}
