import { useCallback, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, Sparkle } from "lucide-react";
import { HOTSPOTS, MAP_URL, WORLD_H, WORLD_W } from "./planets";
import { Hotspot } from "./Hotspot";
import { Starfield } from "./Starfield";

export function SolarSystem() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const bounceTimer = useRef<number | undefined>(undefined);

  const handleTap = useCallback((id: string) => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(bounceTimer.current);
    setActiveId(id);
    setBounceId(id);
    bounceTimer.current = window.setTimeout(() => setBounceId(null), 700);
    hideTimer.current = window.setTimeout(() => setActiveId(null), 2800);
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
                style={{ width: WORLD_W, height: WORLD_H }}
              >
                <img
                  src={MAP_URL}
                  alt="Cartoon solar system map with smiling planets"
                  width={WORLD_W}
                  height={WORLD_H}
                  draggable={false}
                  className="absolute inset-0 select-none"
                />

                {/* Twinkling stars and comets over the picture */}
                <Starfield size={Math.max(WORLD_W, WORLD_H)} width={WORLD_W} height={WORLD_H} />

                {HOTSPOTS.map((h) => (
                  <Hotspot
                    key={h.id}
                    def={h}
                    active={activeId === h.id}
                    bouncing={bounceId === h.id}
                    onTap={handleTap}
                  />
                ))}
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
