import { useRef } from "react";
import type { BodyDef } from "./planets";
import { SpeechBubble } from "./SpeechBubble";

interface PlanetProps {
  def: BodyDef;
  /** Center position in world px. */
  x: number;
  y: number;
  active: boolean;
  bouncing: boolean;
  onTap: (id: string) => void;
  /** Slowly rotate the sprite (used for the Sun's rays). */
  spin?: boolean;
}

/**
 * A celestial body floating in the world: sprite, name label, tap
 * reaction. Position comes from the parent's orbit math.
 */
export function Planet({ def, x, y, active, bouncing, onTap, spin }: PlanetProps) {
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);

  let animation: string | undefined;
  if (!bouncing) {
    animation = spin
      ? `sun-spin 90s linear infinite`
      : `planet-breathe ${def.breathe}s ease-in-out ${def.delay}s infinite`;
  }

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: active ? 30 : undefined,
      }}
    >
      <button
        type="button"
        aria-label={def.name}
        className={`block cursor-pointer touch-manipulation select-none ${bouncing ? "planet-bounce" : ""}`}
        style={{ width: def.size, height: def.size }}
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        }}
        onPointerUp={(e) => {
          const pd = downAt.current;
          downAt.current = null;
          if (!pd) return;
          const moved = Math.hypot(e.clientX - pd.x, e.clientY - pd.y);
          if (moved < 12 && Date.now() - pd.t < 600) onTap(def.id);
        }}
      >
        <img
          src={def.img}
          alt=""
          width={def.size}
          height={def.size}
          draggable={false}
          className="h-full w-full object-contain"
          style={{ animation }}
        />
      </button>
      <span
        className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-display font-medium tracking-wide text-white/85"
        style={{
          fontSize: Math.max(30, def.size * 0.32),
          textShadow: "0 2px 10px rgba(10, 6, 30, 0.9)",
        }}
      >
        {def.name}
      </span>
      {active && <SpeechBubble text={def.line} />}
    </div>
  );
}
