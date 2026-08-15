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
  /** Single squash-and-stretch hop, triggered from the navigator. */
  jumping?: boolean;
  /** Spinning dashed ring, shown when found via the navigator. */
  highlighted?: boolean;
}

/**
 * A celestial body floating in the world: sprite, name label, tap
 * reaction. Position comes from the parent's orbit math.
 */
export function Planet({ def, x, y, active, bouncing, onTap, spin, jumping, highlighted }: PlanetProps) {
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);

  let animation: string | undefined;
  if (jumping) {
    animation = "planet-jump 0.8s cubic-bezier(0.36, 0, 0.66, 1) 1";
  } else if (!bouncing) {
    animation = spin
      ? `sun-spin 90s linear infinite`
      : `planet-breathe ${def.breathe}s ease-in-out ${def.delay}s infinite`;
  }

  // Long generated names get a smaller, wrapping label so they read like
  // a hand-lettered caption instead of one endless line.
  const longName = def.name.length > 16;
  const labelSize = longName
    ? Math.max(22, Math.min(def.size * 0.22, 40))
    : Math.max(32, Math.min(def.size * 0.3, 72));

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: active || highlighted ? 30 : undefined,
      }}
    >
      <button
        type="button"
        aria-label={def.name}
        className={`relative block cursor-pointer touch-manipulation select-none ${bouncing ? "planet-bounce" : ""}`}
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
        {highlighted && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2"
            style={{ width: "148%", height: "148%" }}
            aria-hidden
          >
            <svg viewBox="0 0 160 160" className="navigator-ring h-full w-full">
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="white"
                strokeOpacity="0.95"
                strokeWidth="7"
                strokeDasharray="24 16"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
      </button>
      <span
        className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 font-hand font-bold uppercase tracking-[0.2em] text-orbit-label ${
          longName ? "w-max max-w-[380px] whitespace-normal text-center leading-none" : "whitespace-nowrap"
        }`}
        style={{
          fontSize: labelSize,
          textShadow: "0 2px 10px rgba(10, 6, 30, 0.9)",
        }}
      >
        {def.name}
      </span>
      {active && <SpeechBubble text={def.line} />}
    </div>
  );
}
