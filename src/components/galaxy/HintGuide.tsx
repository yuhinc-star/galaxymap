import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Sparkle, X } from "lucide-react";

interface HintGuideProps {
  /** Persistence key — the tour auto-plays once per page. */
  pageId: string;
  /** Hand-lettered tips, shown in order. */
  hints: string[];
}

const AUTO_ADVANCE_MS = 7000;
const LAST_LINGER_MS = 9000;

/**
 * The exploration guide: a bottom-center, hand-lettered hint bubble that
 * walks through the gestures one tip at a time — auto-advancing, "Got
 * it!" hurries along, the X skips the rest. Styled like the Navigator
 * and info panel (deep-space glass, dashed golden border, Amatic SC).
 * It plays once per page (remembered in localStorage); the little
 * lightbulb button next to the zoom controls replays it anytime.
 */
export function HintGuide({ pageId, hints }: HintGuideProps) {
  const storageKey = `galaxy-hints-${pageId}`;
  const [step, setStep] = useState<number | null>(null);

  const finish = useCallback(() => {
    setStep(null);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* private mode — the tour simply plays again next visit */
    }
  }, [storageKey]);

  // First visit: start the tour once the scene has settled.
  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(storageKey);
    } catch {
      /* ignore */
    }
    if (seen) return;
    const t = window.setTimeout(() => setStep(0), 1400);
    return () => window.clearTimeout(t);
  }, [storageKey]);

  // Auto-advance; the last tip lingers a little longer, then fades away.
  useEffect(() => {
    if (step === null) return;
    const last = step >= hints.length - 1;
    const t = window.setTimeout(
      () => (last ? finish() : setStep((s) => (s === null ? null : s + 1))),
      last ? LAST_LINGER_MS : AUTO_ADVANCE_MS,
    );
    return () => window.clearTimeout(t);
  }, [step, hints.length, finish]);

  return (
    <>
      {step !== null && hints[step] && (
        <div
          key={step}
          role="status"
          className="animate-panel-in fixed left-1/2 top-[max(7rem,calc(env(safe-area-inset-top)+6rem))] z-30 w-[26rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 sm:bottom-5 sm:top-auto"
        >
          <div className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-star/70 bg-space-deep/90 px-4 py-2.5 shadow-xl backdrop-blur-sm">
            <Sparkle
              className="h-5 w-5 shrink-0 animate-pulse text-star"
              aria-hidden
            />
            <p className="flex-1 font-hand text-xl font-bold uppercase leading-tight tracking-wider text-white">
              {hints[step]}
            </p>
            <span className="shrink-0 font-display text-xs font-semibold text-white/50">
              {step + 1}/{hints.length}
            </span>
            <button
              type="button"
              onClick={() =>
                step >= hints.length - 1 ? finish() : setStep(step + 1)
              }
              className="shrink-0 rounded-full bg-star px-3 py-1 font-hand text-lg font-bold uppercase leading-none tracking-wider text-space shadow transition-transform hover:scale-105 active:scale-95"
            >
              {step >= hints.length - 1 ? "Off you go!" : "Got it!"}
            </button>
            <button
              type="button"
              aria-label="Skip the hints"
              onClick={finish}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white sm:h-6 sm:w-6"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-label="Show the exploration hints"
        title="Hints"
        onClick={() => setStep(0)}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(4.5rem,calc(env(safe-area-inset-right)+3.5rem))] z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Lightbulb className="h-5 w-5" />
      </button>
    </>
  );
}
