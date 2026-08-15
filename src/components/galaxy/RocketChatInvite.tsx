import { useState } from "react";
import { MessagesSquare, X } from "lucide-react";
import { useTransformEffect } from "react-zoom-pan-pinch";

interface RocketChatInviteProps {
  /** Rocket's park spot, world px. */
  x: number;
  y: number;
  /** Host body's display name. */
  name: string;
  onChat: () => void;
  onDismiss: () => void;
}

/**
 * Post-landing invite: a storybook speech bubble that pops over the
 * freshly parked rocket offering "Chat with <name>?" — the rocket
 * decides who we talk to, and this bubble is its handshake. Rendered
 * inside the transformed world and counter-scaled against the camera
 * (clamped, like the rocket itself) so it stays readable when zoomed
 * in without looming over the whole sky when zoomed out.
 */
export function RocketChatInvite({
  x,
  y,
  name,
  onChat,
  onDismiss,
}: RocketChatInviteProps) {
  const [scale, setScale] = useState(1);

  useTransformEffect(({ state }) => {
    setScale(state.scale);
  });

  // Fixed screen size when zoomed in; below 0.75x the bubble starts
  // shrinking with the world instead of growing without bound.
  const inv = 1 / Math.max(0.75, scale);

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left: x, top: y }}
    >
      <div
        className="absolute bottom-[54px] left-0 flex items-start gap-1.5"
        style={{
          transform: `translateX(-50%) scale(${inv})`,
          transformOrigin: "bottom center",
        }}
      >
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
          className="pointer-events-auto flex animate-pop-in items-center gap-2 rounded-2xl rounded-bl-sm border-2 border-space bg-star px-3 py-1.5 font-display text-sm font-semibold whitespace-nowrap text-space shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          <MessagesSquare className="h-4 w-4 shrink-0" aria-hidden />
          <span className="max-w-[200px] truncate">Chat with {name}?</span>
        </button>
        <button
          type="button"
          aria-label="Dismiss chat invite"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-space bg-card text-card-foreground shadow-md transition-transform hover:scale-110 active:scale-95"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
