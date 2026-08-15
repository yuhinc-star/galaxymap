import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Dices, Minus, Palette, Plus, RotateCcw, Sparkle } from "lucide-react";
import { BACKGROUNDS } from "./backgrounds";
import { CENTER, DRIFTERS, MOON, PLANETS, SUN, WORLD } from "./planets";
import { Drifter } from "./Drifter";
import { Navigator, type NavigatorEntry } from "./Navigator";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";

const TAU = Math.PI * 2;

/** Deterministic pseudo-random so SSR and hydration draw identical rings. */
function seeded(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * A hand-drawn ring: a closed path whose radius wobbles on two sine
 * frequencies, like a circle painted with a brush instead of a compass.
 */
function wobblyRing(cx: number, cy: number, r: number, seed: number): string {
  const rand = seeded(seed);
  const w1 = 2 + Math.floor(rand() * 3);
  const w2 = 5 + Math.floor(rand() * 4);
  const p1 = rand() * TAU;
  const p2 = rand() * TAU;
  const a1 = r * 0.012;
  const a2 = r * 0.007;
  const N = 96;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const rr = r + a1 * Math.sin(w1 * a + p1) + a2 * Math.cos(w2 * a + p2);
    d += `${i === 0 ? "M" : "L"}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return `${d} Z`;
}

interface RingStyle {
  d: string;
  dash: string;
  width: number;
  opacity: number;
}

/**
 * Each planet's ring gets its own hand-painted character: slightly
 * off-center, uneven dash length and gap, varied stroke weight.
 */
const RING_STYLES: RingStyle[] = PLANETS.map((p, i) => {
  const rand = seeded(i * 13 + 7);
  const cx = CENTER + (rand() - 0.5) * 26;
  const cy = CENTER + (rand() - 0.5) * 26;
  return {
    d: wobblyRing(cx, cy, p.orbitR, i * 7 + 3),
    dash: `${(34 + rand() * 14).toFixed(0)} ${(22 + rand() * 10).toFixed(0)}`,
    width: 10 + rand() * 3,
    opacity: 0.76 + rand() * 0.16,
  };
});

export function SolarSystem() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);
  /** Body the camera is currently locked onto (navigator "you are here"). */
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /** Navigator "find me": dashed ring + single hop. */
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [jumpId, setJumpId] = useState<string | null>(null);
  /** Which hand-painted sky is showing; restored from localStorage after mount. */
  const [bgIndex, setBgIndex] = useState(0);
  /** Animation clock, seconds. Starts at 0 so SSR and hydration agree. */
  const [t, setT] = useState(0);
  const hideTimer = useRef<number | undefined>(undefined);
  const bounceTimer = useRef<number | undefined>(undefined);
  const highlightTimer = useRef<number | undefined>(undefined);
  const jumpTimer = useRef<number | undefined>(undefined);
  /** Camera follow: keeps the navigator-picked body centered as it orbits. */
  const followRef = useRef<{
    id: string;
    scale: number;
    from: { x: number; y: number; scale: number };
    startAt: number;
  } | null>(null);
  const setTransformRef = useRef<((x: number, y: number, s: number, ms?: number) => void) | null>(null);
  /** Latest camera state, so a glide eases from exactly where the camera
      is now — even mid-flight from a previous pick. */
  const stateRef = useRef<{ positionX: number; positionY: number; scale: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      setT((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("galaxy-bg"));
    if (Number.isInteger(saved) && saved >= 0 && saved < BACKGROUNDS.length) {
      setBgIndex(saved);
    }
  }, []);

  const cycleBg = useCallback(() => {
    setBgIndex((i) => {
      const next = (i + 1) % BACKGROUNDS.length;
      window.localStorage.setItem("galaxy-bg", String(next));
      return next;
    });
  }, []);

  /** Any manual camera move takes control back from the follow mode. */
  const stopFollow = useCallback(() => {
    followRef.current = null;
    setFocusedId(null);
  }, []);

  /** Navigator entries: the Sun, then every planet (Earth carries the Moon). */
  const navItems: NavigatorEntry[] = [
    { id: SUN.id, name: SUN.name, img: SUN.img },
    ...PLANETS.map((p) => ({
      id: p.id,
      name: p.name,
      img: p.img,
      moons:
        p.id === "earth"
          ? [{ id: MOON.id, name: MOON.name, img: MOON.img }]
          : undefined,
    })),
  ];

  // Orbit math: every planet advances along its ring at its own speed.
  const positions = new Map<string, { x: number; y: number }>();
  for (const p of PLANETS) {
    const a = p.startAngle + (t * TAU) / p.period;
    positions.set(p.id, {
      x: CENTER + p.orbitR * Math.cos(a),
      y: CENTER + p.orbitR * Math.sin(a),
    });
  }
  for (const d of DRIFTERS) {
    const a = d.startAngle + (d.dir * t * TAU) / d.period;
    positions.set(d.id, {
      x: CENTER + d.orbitR * Math.cos(a),
      y: CENTER + d.orbitR * Math.sin(a),
    });
  }
  const earth = positions.get("earth") ?? { x: CENTER, y: CENTER };
  const moonAngle = (t * TAU) / MOON.period;
  const moonPos = {
    x: earth.x + MOON.orbitR * Math.cos(moonAngle),
    y: earth.y + MOON.orbitR * Math.sin(moonAngle),
  };

  /** Current world position of any navigator-listed body. */
  const bodyPos = (id: string) =>
    id === SUN.id
      ? { x: CENTER, y: CENTER }
      : id === MOON.id
        ? moonPos
        : (positions.get(id) ?? null);

  /**
   * World-pixel radius the camera should frame for a navigator pick:
   * the sun gets every planet ring, a planet gets its moon's ring
   * (or just its own disc when it has no moons), a moon its own disc.
   */
  const frameRadius = (id: string): number => {
    if (id === SUN.id) {
      return Math.max(...PLANETS.map((p) => p.orbitR + p.size / 2)) + 80;
    }
    if (id === MOON.id) return MOON.size * 1.6;
    const p = PLANETS.find((pp) => pp.id === id);
    if (!p) return 200;
    const own = p.size * 1.15;
    return p.id === "earth"
      ? Math.max(own, MOON.orbitR + MOON.size / 2 + 60)
      : own;
  };

  // Camera follow, chase-cam style: every frame we ease from the camera
  // state captured at click time toward the body's *current* position, so
  // the glide bends with the moving body and lands exactly on it — no
  // end-of-glide snap. After the glide the body stays pinned to center.
  useEffect(() => {
    const f = followRef.current;
    const apply = setTransformRef.current;
    if (!f || !apply) return;
    const q = bodyPos(f.id);
    if (!q) {
      followRef.current = null;
      return;
    }
    const tx = window.innerWidth / 2 - q.x * f.scale;
    const ty = window.innerHeight / 2 - q.y * f.scale;
    const p = Math.min(1, (performance.now() - f.startAt) / 650);
    if (p >= 1) {
      apply(tx, ty, f.scale, 0);
      return;
    }
    // easeInOutCubic
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    apply(
      f.from.x + (tx - f.from.x) * e,
      f.from.y + (ty - f.from.y) * e,
      f.from.scale + (f.scale - f.from.scale) * e,
      0,
    );
  }, [t]);

  /**
   * Navigator click or direct planet tap: zoom so the body and everything
   * orbiting it fits (the sun with all planet rings, a planet with its
   * moon rings), glide there, keep it centered, pop its speech bubble,
   * hop once, flash a dashed ring, and mark it in the navigator.
   */
  const handleNavigate = (id: string) => {
    const q = bodyPos(id);
    if (!q) return;
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(jumpTimer.current);
    window.clearTimeout(highlightTimer.current);
    setActiveId(id);
    setJumpId(id);
    setHighlightId(id);
    setFocusedId(id);
    jumpTimer.current = window.setTimeout(() => setJumpId(null), 850);
    hideTimer.current = window.setTimeout(() => setActiveId(null), 2800);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2800);
    const fit =
      (Math.min(window.innerWidth, window.innerHeight) * 0.82) /
      (2 * frameRadius(id));
    const s = Math.min(Math.max(fit, 0.16), 1.35);
    const st = stateRef.current;
    followRef.current = {
      id,
      scale: s,
      from: st
        ? { x: st.positionX, y: st.positionY, scale: st.scale }
        : {
            x: window.innerWidth / 2 - q.x * s,
            y: window.innerHeight / 2 - q.y * s,
            scale: s,
          },
      startAt: performance.now(),
    };
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-space">
      {/* Hand-painted gouache sky, fixed to the viewport so it stays
          full-bleed and crisp at every zoom level */}
      <img
        key={BACKGROUNDS[bgIndex]!.src}
        src={BACKGROUNDS[bgIndex]!.src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />
      <TransformWrapper
        initialScale={0.36}
        minScale={0.12}
        maxScale={2.5}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.15 }}
        panning={{ velocityDisabled: true }}
        onPanningStart={stopFollow}
        onWheel={stopFollow}
        onPinchStart={stopFollow}
      >
        {({ zoomIn, zoomOut, resetTransform, setTransform, state }) => {
          setTransformRef.current = setTransform;
          stateRef.current = state;
          return (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
            >
              <div
                className="relative"
                style={{ width: WORLD, height: WORLD }}
              >
                {/* Twinkling stars and comets */}
                <Starfield size={WORLD} />

                {/* Dashed orbit rings, like the reference drawing */}
                <svg
                  width={WORLD}
                  height={WORLD}
                  viewBox={`0 0 ${WORLD} ${WORLD}`}
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                >
                  {PLANETS.map((p, i) => {
                    const ring = RING_STYLES[i]!;
                    return (
                      <path
                        key={p.id}
                        d={ring.d}
                        fill="none"
                        stroke="white"
                        strokeOpacity={ring.opacity}
                        strokeWidth={ring.width}
                        strokeDasharray={ring.dash}
                        strokeLinecap="round"
                      />
                    );
                  })}
                  <path
                    d={wobblyRing(earth.x, earth.y, MOON.orbitR, 99)}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.72}
                    strokeWidth={6.5}
                    strokeDasharray="22 17"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Warm glow behind the Sun */}
                <div
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: CENTER,
                    top: CENTER,
                    width: SUN.size * 1.8,
                    height: SUN.size * 1.8,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, oklch(0.9 0.16 95 / 0.4), transparent 65%)",
                  }}
                />

                {/* Drifting characters fly behind the planets, like the
                    rocket and astronaut floating between the posters' rings */}
                {DRIFTERS.map((d) => {
                  const q = positions.get(d.id)!;
                  return <Drifter key={d.id} def={d} x={q.x} y={q.y} />;
                })}

                <Planet
                  def={SUN}
                  x={CENTER}
                  y={CENTER}
                  active={activeId === SUN.id}
                  bouncing={bounceId === SUN.id}
                  jumping={jumpId === SUN.id}
                  highlighted={highlightId === SUN.id}
                  onTap={handleNavigate}
                  spin
                />

                {/* Biggest first so small planets pass in front at
                    conjunction and never disappear behind a giant */}
                {[...PLANETS]
                  .sort((a, b) => b.size - a.size)
                  .map((p) => {
                    const q = positions.get(p.id)!;
                    return (
                      <Planet
                        key={p.id}
                        def={p}
                        x={q.x}
                        y={q.y}
                        active={activeId === p.id}
                        bouncing={bounceId === p.id}
                        jumping={jumpId === p.id}
                        highlighted={highlightId === p.id}
                        onTap={handleNavigate}
                      />
                    );
                  })}

                <Planet
                  def={MOON}
                  x={moonPos.x}
                  y={moonPos.y}
                  active={activeId === MOON.id}
                  bouncing={bounceId === MOON.id}
                  jumping={jumpId === MOON.id}
                  highlighted={highlightId === MOON.id}
                  onTap={handleNavigate}
                />
              </div>
            </TransformComponent>

            <header className="pointer-events-none fixed left-4 top-4 flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-star" aria-hidden />
              <span className="font-display text-xl font-semibold tracking-wide text-star">
                Pocket Galaxy
              </span>
            </header>

            <Navigator
              items={navItems}
              activeId={activeId}
              focusedId={focusedId}
              onSelect={handleNavigate}
            />

            <div className="fixed right-4 top-4">
              <Link
                to="/generator"
                aria-label="Open the Galaxy Generator"
                title="Galaxy Generator — roll a random solar system"
                className="flex h-11 items-center gap-2 rounded-full border border-border bg-card/90 px-4 font-display text-sm font-semibold text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Dices className="h-4 w-4" />
                Make your own
              </Link>
            </div>

            <div className="fixed bottom-5 right-4 flex flex-col gap-2">
              <button
                type="button"
                aria-label={`Change background (now: ${BACKGROUNDS[bgIndex]!.name})`}
                title={`Sky: ${BACKGROUNDS[bgIndex]!.name}`}
                onClick={cycleBg}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Palette className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => {
                  stopFollow();
                  zoomIn();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => {
                  stopFollow();
                  zoomOut();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Recenter"
                onClick={() => {
                  stopFollow();
                  resetTransform();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2">
              <p
                className="animate-fade-out whitespace-nowrap rounded-full bg-card/90 px-4 py-2 font-display text-sm font-medium text-card-foreground shadow-lg"
                style={{ animationDelay: "4.5s", animationFillMode: "both" }}
              >
                Drag to explore · pinch to zoom · tap a planet
              </p>
            </div>
          </>
          );
        }}
      </TransformWrapper>
    </div>
  );
}
