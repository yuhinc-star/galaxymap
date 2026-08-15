import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import {
  Dices,
  Home,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Sparkle,
} from "lucide-react";
import heroRocketImg from "@/assets/planets/hero-rocket.png";
import { BACKGROUNDS } from "./backgrounds";
import { CENTER, WORLD } from "./planets";
import { generateSystem } from "./systemGenerator";
import { Drifter } from "./Drifter";
import { HeroRocket, ROCKET_H } from "./HeroRocket";
import { Navigator, type NavigatorEntry } from "./Navigator";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";

const TAU = Math.PI * 2;
const MIN_PLANETS = 2;
const MAX_PLANETS = 8;
const DEFAULT_SEED = 20260214;
const DEFAULT_COUNT = 6;

/** Parked rocket stands on its host's upper-right shoulder. */
const PARK_ANGLE = (-80 * Math.PI) / 180;
const PARK_ROT = 10;

interface RocketFlight {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  toId: string;
  fromRot: number;
  startAt: number;
  dur: number;
}

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutCubicFn = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
/** Shortest-path angle interpolation (degrees). */
const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
};

/**
 * The Galaxy Generator: every seed assembles a brand-new solar-system-like
 * world from the sprite pool — a random sun, random planets on asymmetric
 * hand-drawn orbits, 0–2 moons each, and a few drifting friends.
 */
export function GeneratorSystem() {
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Body the camera is currently locked onto (navigator "you are here"). */
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /** Navigator "find me": dashed ring + single hop. */
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [jumpId, setJumpId] = useState<string | null>(null);
  /** Body the hero rocket is parked on (always starts on the sun). */
  const [rocketHostId, setRocketHostId] = useState<string>("sun");
  /** Navigator move mode: the next sun/planet pick is the destination. */
  const [rocketArmed, setRocketArmed] = useState(false);
  /** Live flight, or null while parked. */
  const [flight, setFlight] = useState<RocketFlight | null>(null);
  /** Destination wearing a steady golden ring while the rocket flies. */
  const [rocketInboundId, setRocketInboundId] = useState<string | null>(null);
  const [landingSquash, setLandingSquash] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [planetCount, setPlanetCount] = useState(DEFAULT_COUNT);
  const [t, setT] = useState(0);
  const hideTimer = useRef<number | undefined>(undefined);
  const highlightTimer = useRef<number | undefined>(undefined);
  const jumpTimer = useRef<number | undefined>(undefined);
  const squashTimer = useRef<number | undefined>(undefined);
  /** Live drag data — read every frame by the render loop. */
  const dragRef = useRef<{
    cur: { x: number; y: number };
    hover: string | null;
    startClient: { x: number; y: number };
    moved: boolean;
    lastX: number;
  } | null>(null);
  /** Alternates the flight arc's bend side. */
  const arcSideRef = useRef(1);
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

  const config = useMemo(() => generateSystem(seed, planetCount), [seed, planetCount]);

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
    const savedBg = Number(window.localStorage.getItem("galaxy-bg"));
    if (Number.isInteger(savedBg) && savedBg >= 0 && savedBg < BACKGROUNDS.length) {
      setBgIndex(savedBg);
    }
    const savedSeed = Number(window.localStorage.getItem("galaxy-gen-seed"));
    if (Number.isInteger(savedSeed) && savedSeed > 0) setSeed(savedSeed);
    const savedCount = Number(window.localStorage.getItem("galaxy-gen-count"));
    if (
      Number.isInteger(savedCount) &&
      savedCount >= MIN_PLANETS &&
      savedCount <= MAX_PLANETS
    ) {
      setPlanetCount(savedCount);
    }
  }, []);

  const cycleBg = useCallback(() => {
    setBgIndex((i) => {
      const next = (i + 1) % BACKGROUNDS.length;
      window.localStorage.setItem("galaxy-bg", String(next));
      return next;
    });
  }, []);

  const regenerate = useCallback(() => {
    const next = Math.floor(Math.random() * 1_000_000_000) + 1;
    window.localStorage.setItem("galaxy-gen-seed", String(next));
    setSeed(next);
    setActiveId(null);
    setHighlightId(null);
    setFocusedId(null);
    followRef.current = null;
    // The rocket always starts parked on the new sun.
    setRocketHostId("sun");
    setRocketArmed(false);
    setFlight(null);
    setRocketInboundId(null);
    setDragActive(false);
    dragRef.current = null;
  }, []);

  const changeCount = useCallback((delta: number) => {
    setPlanetCount((c) => {
      const next = Math.min(MAX_PLANETS, Math.max(MIN_PLANETS, c + delta));
      window.localStorage.setItem("galaxy-gen-count", String(next));
      return next;
    });
    setActiveId(null);
    setHighlightId(null);
    setFocusedId(null);
    followRef.current = null;
    setRocketHostId("sun");
    setRocketArmed(false);
    setFlight(null);
    setRocketInboundId(null);
    setDragActive(false);
    dragRef.current = null;
  }, []);

  /** Any manual camera move takes control back from the follow mode. */
  const stopFollow = useCallback(() => {
    followRef.current = null;
    setFocusedId(null);
  }, []);

  // Orbit math: bodies advance along their own wobbly closed curves.
  const planetPos = new Map<string, { x: number; y: number }>();
  for (const p of config.planets) {
    const q = p.orbit.pointAt(p.startAngle + (t * TAU) / p.period);
    planetPos.set(p.id, { x: CENTER + q.x, y: CENTER + q.y });
  }
  const drifterPos = new Map<string, { x: number; y: number }>();
  for (const d of config.drifters) {
    const q = d.orbit.pointAt(d.startAngle + (d.dir * t * TAU) / d.period);
    drifterPos.set(d.id, { x: CENTER + q.x, y: CENTER + q.y });
  }

  /** Navigator entries: the sun, then every planet with its moons nested. */
  const navItems: NavigatorEntry[] = [
    { id: config.sun.id, name: config.sun.name, img: config.sun.img },
    ...config.planets.map((p) => ({
      id: p.id,
      name: p.name,
      img: p.img,
      moons: p.moons.map((m) => ({ id: m.id, name: m.name, img: m.img })),
    })),
  ];

  /** Current world position of any navigator-listed body. */
  const bodyPos = (id: string): { x: number; y: number } | null => {
    if (id === config.sun.id) return { x: CENTER, y: CENTER };
    const pq = planetPos.get(id);
    if (pq) return pq;
    // Moons ride on their planet's position.
    for (const p of config.planets) {
      const m = p.moons.find((mm) => mm.id === id);
      if (m) {
        const base = planetPos.get(p.id)!;
        const a = m.startAngle + (t * TAU) / m.period;
        return {
          x: base.x + m.orbitR * Math.cos(a),
          y: base.y + m.orbitR * Math.sin(a),
        };
      }
    }
    return null;
  };

  /** Display size of a rocket-landable body (sun or planet — no moons). */
  const bodySize = (id: string): number | null => {
    if (id === config.sun.id) return config.sun.size;
    const p = config.planets.find((pp) => pp.id === id);
    return p ? p.size : null;
  };

  /** Where the parked rocket stands: the host's upper-right shoulder. */
  const parkPos = (id: string): { x: number; y: number } | null => {
    const c = bodyPos(id);
    const s = bodySize(id);
    if (!c || !s) return null;
    const r = s / 2 + ROCKET_H * 0.4;
    return {
      x: c.x + r * Math.cos(PARK_ANGLE),
      y: c.y + r * Math.sin(PARK_ANGLE),
    };
  };

  /**
   * World-pixel radius the camera should frame for a navigator pick:
   * the sun gets every planet ring (asymmetric — use the shape's maxR),
   * a planet gets its outermost moon ring (or just its own disc when
   * it has no moons), a moon its own disc.
   */
  const frameRadius = (id: string): number => {
    if (id === config.sun.id) {
      return (
        Math.max(...config.planets.map((p) => p.orbit.maxR + p.size / 2)) + 80
      );
    }
    const p = config.planets.find((pp) => pp.id === id);
    if (p) {
      const own = p.size * 1.15;
      if (p.moons.length === 0) return own;
      const moonEdge =
        Math.max(...p.moons.map((m) => m.orbitR + m.size / 2)) + 60;
      return Math.max(own, moonEdge);
    }
    for (const pp of config.planets) {
      const m = pp.moons.find((mm) => mm.id === id);
      if (m) return m.size * 1.6;
    }
    return 200;
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
   * Navigator click: zoom so the body and everything orbiting it fits
   * (the sun with all planet rings, a planet with its moon rings),
   * glide there, pop its speech bubble, hop once, flash a dashed ring.
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
      <img
        key={BACKGROUNDS[bgIndex]!.src}
        src={BACKGROUNDS[bgIndex]!.src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />
      <TransformWrapper
        key={`${seed}-${planetCount}`}
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
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div className="relative" style={{ width: WORLD, height: WORLD }}>
                <Starfield size={WORLD} />

                {/* Hand-drawn orbit rings — every planet's ring is a
                    different asymmetric closed curve */}
                <svg
                  width={WORLD}
                  height={WORLD}
                  viewBox={`0 0 ${WORLD} ${WORLD}`}
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                >
                  <g transform={`translate(${CENTER} ${CENTER})`}>
                    {config.planets.map((p) => (
                      <path
                        key={p.id}
                        d={p.orbit.d}
                        fill="none"
                        stroke="white"
                        strokeOpacity={p.ringOpacity}
                        strokeWidth={p.ringWidth}
                        strokeDasharray={p.dash}
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                  {/* Moon rings follow their planets */}
                  {config.planets.map((p) => {
                    const q = planetPos.get(p.id)!;
                    return p.moons.map((m) => (
                      <path
                        key={m.id}
                        d={m.ringD}
                        transform={`translate(${q.x} ${q.y})`}
                        fill="none"
                        stroke="white"
                        strokeOpacity={0.72}
                        strokeWidth={6.5}
                        strokeDasharray="22 17"
                        strokeLinecap="round"
                      />
                    ));
                  })}
                </svg>

                {/* Warm glow behind the Sun */}
                <div
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: CENTER,
                    top: CENTER,
                    width: config.sun.size * 1.8,
                    height: config.sun.size * 1.8,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, oklch(0.9 0.16 95 / 0.4), transparent 65%)",
                  }}
                />

                {config.drifters.map((d) => {
                  const q = drifterPos.get(d.id)!;
                  return <Drifter key={d.id} def={d} x={q.x} y={q.y} />;
                })}

                <Planet
                  def={config.sun}
                  x={CENTER}
                  y={CENTER}
                  active={activeId === config.sun.id}
                  jumping={jumpId === config.sun.id}
                  highlighted={highlightId === config.sun.id}
                  onTap={handleNavigate}
                  spin
                />

                {[...config.planets]
                  .sort((a, b) => b.size - a.size)
                  .map((p) => {
                    const q = planetPos.get(p.id)!;
                    return (
                      <Planet
                        key={p.id}
                        def={p}
                        x={q.x}
                        y={q.y}
                        active={activeId === p.id}
                        jumping={jumpId === p.id}
                        highlighted={highlightId === p.id}
                        onTap={handleNavigate}
                      />
                    );
                  })}

                {config.planets.map((p) => {
                  const q = planetPos.get(p.id)!;
                  return p.moons.map((m) => {
                    const a = m.startAngle + (t * TAU) / m.period;
                    return (
                      <Planet
                        key={m.id}
                        def={m}
                        x={q.x + m.orbitR * Math.cos(a)}
                        y={q.y + m.orbitR * Math.sin(a)}
                        active={activeId === m.id}
                        jumping={jumpId === m.id}
                        highlighted={highlightId === m.id}
                        onTap={handleNavigate}
                      />
                    );
                  });
                })}
              </div>
            </TransformComponent>

            <header className="pointer-events-none fixed left-4 top-4 flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-star" aria-hidden />
              <span className="font-display text-xl font-semibold tracking-wide text-star">
                Galaxy Generator
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
                to="/"
                aria-label="Back to the classic solar system"
                title="Back to the classic solar system"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>

            {/* Generator controls */}
            <div className="fixed bottom-5 left-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/90 px-2 py-1.5 shadow-lg">
                <button
                  type="button"
                  aria-label="Fewer planets"
                  onClick={() => changeCount(-1)}
                  disabled={planetCount <= MIN_PLANETS}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-card-foreground transition-transform hover:scale-110 active:scale-95 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-20 text-center font-display text-sm font-semibold text-card-foreground">
                  {planetCount} planets
                </span>
                <button
                  type="button"
                  aria-label="More planets"
                  onClick={() => changeCount(1)}
                  disabled={planetCount >= MAX_PLANETS}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-card-foreground transition-transform hover:scale-110 active:scale-95 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={regenerate}
                className="flex items-center justify-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2.5 font-display text-sm font-semibold text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Dices className="h-4 w-4" />
                New system
              </button>
              <p className="pointer-events-none text-center font-display text-xs text-star/70">
                seed #{seed}
              </p>
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
          </>
          );
        }}
      </TransformWrapper>
    </div>
  );
}
