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
  onZoomOut: (id: string) => void;
}

/**
 * "Visit the parent" pill: sits at the top of the SuggestionStack whenever
 * the camera is visiting a body that has somewhere to zoom out to. One tap
 * glides up one generation. Minimalist edition: a thin paper pill with a
 * small ink marker and quiet display type.
 */
export function ZoomOutPill({ target, onZoomOut }: ZoomOutPillProps) {
  if (!target) return null;
  return (
    <button
      type="button"
      onClick={() => onZoomOut(target.id)}
      aria-label={`Zoom out to ${target.name}`}
      title={`Zoom out to ${target.name}`}
      className="animate-pop-in flex items-center gap-2 rounded-full border border-mini-line bg-mini-paper py-1.5 pl-1.5 pr-4 transition-colors hover:border-mini-ink/60 active:scale-95"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-mini-line">
        {target.img ? (
          <ArrowUp className="h-3.5 w-3.5 text-mini-ink" strokeWidth={1.5} aria-hidden />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-mini-blue" strokeWidth={1.5} aria-hidden />
        )}
      </span>
      <span className="max-w-[38vw] truncate font-display text-xs font-normal leading-none tracking-[0.08em] text-mini-ink sm:max-w-52">
        {target.name}
      </span>
    </button>
  );
}
