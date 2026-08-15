import type { PointerEvent as ReactPointerEvent } from "react";
import heroRocketImg from "@/assets/planets/hero-rocket.png";
import heroFlameImg from "@/assets/planets/hero-flame.png";

/** Display height in world px — a slim classic tin-toy rocket. */
export const ROCKET_H = 132;
/** Sprite aspect is 407x1067 after alpha-trimming. */
export const ROCKET_W = Math.round((ROCKET_H * 407) / 1067);
const FLAME_H = 84;
const FLAME_W = 46;

interface HeroRocketProps {
  /** Center position in world px. */
  x: number;
  y: number;
  /** Degrees; 0 = nose up. */
  rotation: number;
  /** Flame size, 0 (parked) to 1 (full thrust). */
  flame: number;
  /** Touchdown squash-and-settle. */
  squash: boolean;
  dragging: boolean;
  /** False while flying — the rocket can't be grabbed mid-flight. */
  interactive: boolean;
  onDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * The hero rocket: a classic red-and-cream toy rocket the user flies
 * between bodies. Parked, it stands on its host's shoulder with a gentle
 * sway; in flight a brushy flame flickers underneath. Drag it onto a
 * planet or the sun — or send it via the navigator — to move it.
 */
export function HeroRocket({
  x,
  y,
  rotation,
  flame,
  squash,
  dragging,
  interactive,
  onDown,
}: HeroRocketProps) {
  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      <div
        role="button"
        aria-label="Rocket — drag me onto a planet or the sun"
        className={`relative touch-none select-none ${
          interactive || dragging ? "pointer-events-auto" : "pointer-events-none"
        } ${dragging ? "cursor-grabbing" : interactive ? "cursor-grab" : ""}`}
        style={{
          width: ROCKET_W,
          height: ROCKET_H,
          transform: `rotate(${rotation}deg)`,
        }}
        onPointerDownCapture={interactive ? onDown : undefined}
      >
        <img
          src={heroRocketImg}
          alt=""
          width={ROCKET_W}
          height={ROCKET_H}
          draggable={false}
          className={`h-full w-full object-contain ${
            squash
              ? "rocket-land"
              : flame > 0.02 || dragging
                ? ""
                : "rocket-parked"
          }`}
        />
        {flame > 0.02 && (
          <div
            className="pointer-events-none absolute left-1/2"
            aria-hidden
            style={{
              top: ROCKET_H - 8,
              width: FLAME_W,
              height: FLAME_H,
              transform: `translateX(-50%) scale(${flame})`,
              transformOrigin: "top center",
            }}
          >
            <img
              src={heroFlameImg}
              alt=""
              width={FLAME_W}
              height={FLAME_H}
              draggable={false}
              className="rocket-flame h-full w-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
