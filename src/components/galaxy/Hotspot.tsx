import { useRef } from "react";
import { MAP_URL, WORLD_H, WORLD_W, type HotspotDef } from "./planets";
import { SpeechBubble } from "./SpeechBubble";

const FEATHER_MASK =
  "radial-gradient(circle at center, black 58%, transparent 72%)";

interface HotspotProps {
  def: HotspotDef;
  active: boolean;
  bouncing: boolean;
  onTap: (id: string) => void;
}

/**
 * A planet region of the map, re-rendered on top of itself via
 * background-position so it can wiggle and bounce in place while
 * looking exactly like the original picture.
 */
export function Hotspot({ def, active, bouncing, onTap }: HotspotProps) {
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);

  const cx = def.cx * WORLD_W;
  const cy = def.cy * WORLD_H;
  const r = def.r * WORLD_W;
  const d = r * 2;

  return (
    <div
      className="absolute"
      style={{
        left: cx,
        top: cy,
        width: d,
        height: d,
        transform: "translate(-50%, -50%)",
        zIndex: active ? 30 : undefined,
      }}
    >
      <button
        type="button"
        aria-label={def.name}
        className={`block h-full w-full cursor-pointer touch-manipulation select-none rounded-full ${bouncing ? "planet-bounce" : ""}`}
        style={{
          backgroundImage: `url(${MAP_URL})`,
          backgroundSize: `${WORLD_W}px ${WORLD_H}px`,
          backgroundPosition: `-${cx - r}px -${cy - r}px`,
          WebkitMaskImage: FEATHER_MASK,
          maskImage: FEATHER_MASK,
          animation: bouncing
            ? undefined
            : `planet-breathe ${def.breathe}s ease-in-out ${def.delay}s infinite`,
        }}
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
      />
      {active && <SpeechBubble text={def.line} />}
    </div>
  );
}
