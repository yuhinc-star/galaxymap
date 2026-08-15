import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

export interface BodyPanelChild {
  id: string;
  name: string;
  img: string;
}

export interface BodyPanelAdd {
  canAdd: boolean;
  actionLabel?: string | undefined;
  fullNote?: string | undefined;
}

export interface BodyPanelRemove {
  actionLabel: string;
  /** e.g. moons that wave goodbye together with their planet. */
  note?: string | undefined;
}

export interface BodyPanelInfo {
  id: string;
  name: string;
  img: string;
  /** "Sun", "Planet", "Moon" or "Tiny moon". */
  kindLabel: string;
  /** Personality quote, shown in a dashed bubble. */
  line?: string | undefined;
  facts: { label: string; value: string }[];
  childrenLabel: string;
  childrenCap: number;
  children: BodyPanelChild[];
  add: BodyPanelAdd;
  /** Null for the sun — the heart of the system can never leave. */
  remove: BodyPanelRemove | null;
}

interface BodyInfoPanelProps {
  info: BodyPanelInfo;
  onAdd: () => void;
  onRemove: () => void;
  /** Fly to a child body and open its own panel. */
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * The double-click information panel (generator): a screen-space card on
 * the right, styled like the Navigator — deep-space glass, hand-lettered
 * Amatic SC names in quote marks, dashed golden accents. It shows the
 * body's portrait, personality line, storybook facts and the family
 * orbiting it; the "grow this family" action lives at the bottom.
 */
export function BodyInfoPanel({
  info,
  onAdd,
  onRemove,
  onSelect,
  onClose,
}: BodyInfoPanelProps) {
  // "Say goodbye" asks for a second tap before anything is removed.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setConfirming(false), [info.id]);

  return (
    <aside
      aria-label={`About ${info.name}`}
      className="animate-panel-in fixed right-4 top-16 z-20 flex max-h-[calc(100vh-8.5rem)] w-72 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/20 bg-space-deep/90 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-start gap-3 px-4 pb-2 pt-3">
        <img
          src={info.img}
          alt=""
          draggable={false}
          className="h-14 w-14 shrink-0 select-none rounded-full bg-space/60 object-contain p-1 ring-2 ring-star/70"
        />
        <div className="min-w-0 flex-1">
          <span className="font-hand text-sm font-bold uppercase tracking-[0.28em] text-white/60">
            {info.kindLabel}
          </span>
          <h2 className="font-hand text-3xl font-bold uppercase leading-tight tracking-wider text-star">
            &ldquo;{info.name}&rdquo;
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close the info panel"
          onClick={onClose}
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4 pt-1">
        {info.line && (
          <p className="rounded-2xl border-2 border-dashed border-white/25 px-3 py-2 font-hand text-xl font-bold leading-snug text-white/90">
            &ldquo;{info.line}&rdquo;
          </p>
        )}

        <dl className="flex flex-col gap-1">
          {info.facts.map((f) => (
            <div
              key={f.label}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="shrink-0 font-hand text-lg font-bold uppercase tracking-wider text-white/55">
                {f.label}
              </dt>
              <dd className="text-right font-display text-sm font-semibold text-white">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <section>
          <h3 className="font-hand text-xl font-bold uppercase tracking-[0.18em] text-white/70">
            {info.childrenLabel}
            <span className="ml-1.5 text-star">
              {info.children.length}/{info.childrenCap}
            </span>
          </h3>
          {info.children.length > 0 ? (
            <ul className="mt-1 flex flex-col gap-0.5">
              {info.children.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="flex w-full items-center gap-2.5 rounded-2xl px-2 py-1 text-left transition-colors hover:bg-white/10"
                  >
                    <img
                      src={c.img}
                      alt=""
                      draggable={false}
                      className="h-7 w-7 shrink-0 select-none rounded-full bg-space/60 object-contain p-0.5"
                    />
                    <span className="font-hand text-lg font-bold uppercase leading-none tracking-wider text-white">
                      &ldquo;{c.name}&rdquo;
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 font-hand text-lg font-bold uppercase tracking-wider text-white/40">
              Nothing orbiting yet
            </p>
          )}
        </section>

        {/* The add-a-body action lives inside the panel */}
        <section className="rounded-2xl border-2 border-dashed border-star/60 bg-star/10 px-3 py-2.5">
          <h3 className="font-hand text-lg font-bold uppercase tracking-[0.18em] text-star">
            Grow this family
          </h3>
          {info.add.canAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-full bg-star px-4 py-1.5 font-hand text-2xl font-bold uppercase leading-none tracking-wider text-space shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              {info.add.actionLabel}
            </button>
          ) : (
            <p className="mt-1 font-hand text-xl font-bold uppercase leading-tight tracking-wider text-star">
              {info.add.fullNote}
            </p>
          )}
        </section>

        {/* Saying goodbye: two taps, then the body (and its whole moon
            family) leaves the system */}
        {info.remove && (
          <section className="rounded-2xl border-2 border-dashed border-white/20 px-3 py-2.5">
            <h3 className="font-hand text-lg font-bold uppercase tracking-[0.18em] text-white/55">
              Too crowded?
            </h3>
            <button
              type="button"
              onClick={() => {
                if (confirming) {
                  onRemove();
                } else {
                  setConfirming(true);
                }
              }}
              className={`mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-1.5 font-hand text-2xl font-bold uppercase leading-none tracking-wider shadow-md transition-transform hover:scale-105 active:scale-95 ${
                confirming
                  ? "bg-red-400 text-space-deep"
                  : "border-2 border-dashed border-white/30 text-white/75"
              }`}
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.5} />
              {confirming ? "Really? Tap again!" : info.remove.actionLabel}
            </button>
            {(confirming || info.remove.note) && (
              <p className="mt-1 font-hand text-lg font-bold uppercase leading-tight tracking-wider text-white/45">
                {confirming
                  ? "There's no bringing it back!"
                  : info.remove.note}
              </p>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
