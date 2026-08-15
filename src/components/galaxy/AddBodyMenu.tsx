import { useState } from "react";
import { useTransformEffect } from "react-zoom-pan-pinch";
import { Plus, X } from "lucide-react";

interface AddBodyMenuProps {
  /** World coords of the body's center. */
  x: number;
  y: number;
  /** Body display radius in world px — the bubble floats above it. */
  bodyR: number;
  canAdd: boolean;
  actionLabel?: string | undefined;
  fullNote?: string | undefined;
  onAdd: () => void;
  onClose: () => void;
}

/**
 * The double-tap "grow this family" bubble. It lives in world coordinates
 * above the body but counter-scales against the zoom (like the speech
 * bubble) so the hand-lettered button stays readable at any magnification.
 */
export function AddBodyMenu({
  x,
  y,
  bodyR,
  canAdd,
  actionLabel,
  fullNote,
  onAdd,
  onClose,
}: AddBodyMenuProps) {
  const [scale, setScale] = useState(1);

  useTransformEffect(({ state }) => {
    setScale(state.scale);
  });

  return (
    <div
      className="absolute z-40"
      style={{ left: x, top: y - bodyR - 16 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          transform: `translate(-50%, -100%) scale(${1 / scale})`,
          transformOrigin: "bottom center",
        }}
      >
        <div className="animate-pop-in relative flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-star/70 bg-space-deep/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-space-deep text-white/80 shadow transition-transform hover:scale-110 hover:text-white active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="font-hand text-lg font-bold uppercase tracking-[0.18em] text-white/70">
            Grow this family?
          </span>
          {canAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-full bg-star px-4 py-1.5 font-hand text-2xl font-bold uppercase leading-none tracking-wider text-space shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              {actionLabel}
            </button>
          ) : (
            <span className="max-w-52 text-center font-hand text-xl font-bold uppercase leading-tight tracking-wider text-star">
              {fullNote}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
