import { ArrowUp, Sparkles } from "lucide-react";

export interface ZoomOutTarget {
  /** Parent body id — "" means "the whole sky" (zoom all the way out). */
  id: string;
  name: string;
  /** The parent's face; null for the whole-sky target. */
  img: string | null;
}

interface ZoomOutPillProps {
  target: ZoomOutTarget | null;
  /** Chat mode docks the pill centered on the sky strip instead of the screen. */
  chatMode: boolean;
  onZoomOut: (id: string) => void;
}

/**
 * "Visit the parent" pill: floats at the top of the sky whenever the
 * camera is visiting a body that has somewhere to zoom out to. It shows
 * the parent's face and hand-lettered name so the landing spot is never a
 * surprise — one tap glides up one generation with the usual navigation
 * ceremony (hop, golden ring, speech bubble). At the root sun (outside
 * chat) it offers the whole-sky view instead; in chat mode it disappears
 * once the fan sits on the chat's root star, since the family is the
 * boundary there.
 */
export function ZoomOutPill({ target, chatMode, onZoomOut }: ZoomOutPillProps) {
  if (!target) return null;
  return (
    <button
      type="button"
      onClick={() => onZoomOut(target.id)}
      aria-label={`Zoom out to ${target.name}`}
      title={`Zoom out to ${target.name}`}
      className={`animate-pop-in fixed z-10 flex items-center gap-2.5 rounded-full border border-white/20 bg-space-deep/90 py-1.5 pl-2 pr-4 shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 ${
        chatMode
          ? // Centered on the galaxy strip, on the navigator-toggle row.
            "left-[calc(clamp(290px,33vw,460px)/2)] top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] hidden -translate-x-1/2 sm:flex"
          : // Centered on the screen; phones drop it a row so the title stays clear.
            "left-1/2 top-[max(4rem,calc(env(safe-area-inset-top)+3rem))] -translate-x-1/2 sm:top-[max(1rem,env(safe-area-inset-top))]"
      }`}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
        {target.img ? (
          <img
            src={target.img}
            alt=""
            draggable={false}
            className="h-9 w-9 select-none rounded-full bg-space/60 object-contain p-0.5 ring-1 ring-white/25"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-space/60 ring-1 ring-white/25">
            <Sparkles className="h-5 w-5 text-star" aria-hidden />
          </span>
        )}
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-star shadow">
          <ArrowUp className="h-3 w-3 text-space-deep" strokeWidth={3} aria-hidden />
        </span>
      </span>
      <span className="max-w-[38vw] truncate font-hand text-2xl font-bold uppercase leading-none tracking-wider text-white sm:max-w-52">
        {target.name}
      </span>
    </button>
  );
}
