import { useCallback, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, Sparkle } from "lucide-react";
import { CENTER, DRIFTERS, MOON, PLANETS, SUN, WORLD } from "./planets";
import { Drifter } from "./Drifter";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";

const TAU = Math.PI * 2;

export function SolarSystem() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);
  /** Animation clock, seconds. Starts at 0 so SSR and hydration agree. */
  const [t, setT] = useState(0);
  const hideTimer = useRef<number | undefined>(undefined);
  const bounceTimer = useRef<number | undefined>(undefined);

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

  const handleTap = useCallback((id: string) => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(bounceTimer.current);
    setActiveId(id);
    setBounceId(id);
    bounceTimer.current = window.setTimeout(() => setBounceId(null), 700);
    hideTimer.current = window.setTimeout(() => setActiveId(null), 2800);
  }, []);

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

  return (
    <div className="fixed inset-0 overflow-hidden bg-space">
      <TransformWrapper
        initialScale={0.34}
        minScale={0.12}
        maxScale={2.5}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.15 }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
            >
              <div
                className="relative"
                style={{ width: WORLD, height: WORLD }}
              >
                {/* Soft nebula glow behind the whole system */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at center, oklch(0.34 0.09 300 / 0.5), transparent 62%)",
                  }}
                />

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
                  {PLANETS.map((p) => (
                    <circle
                      key={p.id}
                      cx={CENTER}
                      cy={CENTER}
                      r={p.orbitR}
                      fill="none"
                      stroke="white"
                      strokeOpacity={0.85}
                      strokeWidth={10}
                      strokeDasharray="36 26"
                      strokeLinecap="round"
                    />
                  ))}
                  <circle
                    cx={earth.x}
                    cy={earth.y}
                    r={MOON.orbitR}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.75}
                    strokeWidth={6}
                    strokeDasharray="22 16"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Warm glow behind the Sun */}
                <div
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: CENTER,
                    top: CENTER,
                    width: SUN.size * 2.1,
                    height: SUN.size * 2.1,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, oklch(0.9 0.16 95 / 0.4), transparent 65%)",
                  }}
                />

                <Planet
                  def={SUN}
                  x={CENTER}
                  y={CENTER}
                  active={activeId === SUN.id}
                  bouncing={bounceId === SUN.id}
                  onTap={handleTap}
                  spin
                />

                {PLANETS.map((p) => {
                  const q = positions.get(p.id)!;
                  return (
                    <Planet
                      key={p.id}
                      def={p}
                      x={q.x}
                      y={q.y}
                      active={activeId === p.id}
                      bouncing={bounceId === p.id}
                      onTap={handleTap}
                    />
                  );
                })}

                <Planet
                  def={MOON}
                  x={moonPos.x}
                  y={moonPos.y}
                  active={activeId === MOON.id}
                  bouncing={bounceId === MOON.id}
                  onTap={handleTap}
                />

                {DRIFTERS.map((d) => {
                  const q = positions.get(d.id)!;
                  return <Drifter key={d.id} def={d} x={q.x} y={q.y} />;
                })}
              </div>
            </TransformComponent>

            <header className="pointer-events-none fixed left-4 top-4 flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-star" aria-hidden />
              <span className="font-display text-xl font-semibold tracking-wide text-star">
                Pocket Galaxy
              </span>
            </header>

            <div className="fixed bottom-5 right-4 flex flex-col gap-2">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => zoomIn()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => zoomOut()}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Recenter"
                onClick={() => resetTransform()}
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
        )}
      </TransformWrapper>
    </div>
  );
}
