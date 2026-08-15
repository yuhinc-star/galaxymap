import { useRef } from "react";
import type { BodyDef } from "./planets";
import { SpeechBubble } from "./SpeechBubble";

interface PlanetProps {
  def: BodyDef;
  active: boolean;
  bouncing: boolean;
  onTap: (id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  /** Fixed position (used by the Sun); orbiting bodies are moved by rAF. */
  staticPos?: { x: number; y: number };
}

export function Planet({
  def,
  active,
  bouncing,
  onTap,
  registerRef,
  staticPos,
}: PlanetProps) {
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);

  return (
    <div
      ref={(el) => registerRef(def.id, el)}
      className="absolute left-0 top-0 will-change-transform"
      style={{
        width: def.size,
        height: def.size,
        zIndex: active ? 30 : undefined,
        ...(staticPos
          ? {
              transform: `translate(-50%, -50%) translate(${staticPos.x}px, ${staticPos.y}px)`,
            }
          : {}),
      }}
    >
      <button
        type="button"
        aria-label={def.name}
        className="relative block h-full w-full cursor-pointer touch-manipulation select-none"
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        }}
        onPointerUp={(e) => {
          const d = downAt.current;
          downAt.current = null;
          if (!d) return;
          const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
          if (moved < 12 && Date.now() - d.t < 600) onTap(def.id);
        }}
      >
        <img
          src={def.img}
          alt={def.name}
          draggable={false}
          loading="lazy"
          width={512}
          height={512}
          className={`h-full w-full object-contain ${bouncing ? "planet-bounce" : ""}`}
        />
        <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-display text-sm font-medium uppercase tracking-[0.25em] text-orbit-label">
          {def.name}
        </span>
        {active && <SpeechBubble text={def.line} />}
      </button>
    </div>
  );
}
