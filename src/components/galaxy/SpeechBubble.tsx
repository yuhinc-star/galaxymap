import { useState } from "react";
import { useTransformEffect } from "react-zoom-pan-pinch";

interface SpeechBubbleProps {
  text: string;
  minimal?: boolean;
}

/**
 * Comic speech bubble that counter-scales against the map zoom so it
 * stays the same readable size on screen no matter how far you zoom.
 */
export function SpeechBubble({ text, minimal = false }: SpeechBubbleProps) {
  const [scale, setScale] = useState(1);

  useTransformEffect(({ state }) => {
    setScale(state.scale);
  });

  return (
    <div
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2"
      style={{
        transform: `translateX(-50%) scale(${1 / scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <div className={minimal
        ? "animate-fade-in whitespace-nowrap rounded-full border border-mini-line bg-mini-paper px-3 py-1 font-display text-[11px] font-normal leading-none tracking-[0.08em] text-mini-ink"
        : "animate-pop-in rounded-2xl rounded-bl-sm border-2 border-space bg-star px-3 py-1.5 font-display text-sm font-semibold whitespace-nowrap text-space shadow-xl"
      }>
        {text}
      </div>
    </div>
  );
}
