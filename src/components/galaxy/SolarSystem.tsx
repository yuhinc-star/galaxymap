import { useCallback, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, Sparkle } from "lucide-react";
import { CENTER, MOON, PLANETS, SUN, WORLD } from "./planets";
import { Planet } from "./Planet";
import { Starfield } from "./Starfield";

export function SolarSystem() {
  const refs = useRef(new Map<string, HTMLDivElement>());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const bounceTimer = useRef<number | undefined>(undefined);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  }, []);

  const handleTap = useCallback((id: string) => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(bounceTimer.current);
    setActiveId(id);
    setBounceId(id);
    bounceTimer.current = window.setTimeout(() => setBounceId(null), 700);
    hideTimer.current = window.setTimeout(() => setActiveId(null), 2800);
  }, []);

  // Orbit loop: planets circle the sun, the moon circles Earth.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      let earthX = CENTER;
      let earthY = CENTER;
      for (const p of PLANETS) {
        const el = refs.current.get(p.id);
        if (!el) continue;
        const a = p.phase + t * p.speed;
        const x = CENTER + Math.cos(a) * p.orbit;
        const y = CENTER + Math.sin(a) * p.orbit;
        if (p.id === "earth") {
          earthX = x;
          earthY = y;
        }
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      }
      const moon = refs.current.get(MOON.id);
      if (moon) {
        const a = MOON.phase + t * MOON.speed;
        moon.style.transform = `translate(-50%, -50%) translate(${earthX + Math.cos(a) * MOON.orbit}px, ${earthY + Math.sin(a) * MOON.orbit}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-space">
      <TransformWrapper
        initialScale={0.55}
        minScale={0.3}
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
                <Starfield size={WORLD} />

                {/* Dotted orbit rings */}
                <svg
                  className="absolute inset-0"
                  width={WORLD}
                  height={WORLD}
                  aria-hidden
                >
                  {PLANETS.map((p) => (
                    <circle
                      key={p.id}
                      cx={CENTER}
                      cy={CENTER}
                      r={p.orbit}
                      fill="none"
                      stroke="var(--color-foreground)"
                      strokeOpacity={0.35}
                      strokeWidth={5}
                      strokeDasharray="0.1 24"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>

                <Planet
                  def={SUN}
                  staticPos={{ x: CENTER, y: CENTER }}
                  active={activeId === SUN.id}
                  bouncing={bounceId === SUN.id}
                  onTap={handleTap}
                  registerRef={registerRef}
                />
                {PLANETS.map((p) => (
                  <Planet
                    key={p.id}
                    def={p}
                    active={activeId === p.id}
                    bouncing={bounceId === p.id}
                    onTap={handleTap}
                    registerRef={registerRef}
                  />
                ))}
                <Planet
                  def={MOON}
                  active={activeId === MOON.id}
                  bouncing={bounceId === MOON.id}
                  onTap={handleTap}
                  registerRef={registerRef}
                />
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
