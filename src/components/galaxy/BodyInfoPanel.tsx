import { useState } from "react";
import { Plus, Rocket, X } from "lucide-react";

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

export interface BodyPanelRocket {
  /** Parked on this body — or inbound to it while flying. */
  here: boolean;
  flying: boolean;
  onSummon: () => void;
}

export interface BodyPanelInfo {
  id: string;
  name: string;
  img: string;
  /** "Sun", "Planet", "Moon" or "Tiny moon". */
  kindLabel: string;
  /** Personality quote, shown in a dashed bubble. */
  line?: string | undefined;
  childrenLabel: string;
  childrenCap: number;
  children: BodyPanelChild[];
  add: BodyPanelAdd;
}

interface BodyInfoPanelProps {
  info: BodyPanelInfo;
  onAdd: () => void;
  /** Fly to a child body and open its own panel. */
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Summon the hero rocket to this body. */
  rocket?: BodyPanelRocket | undefined;
}

/**
 * The double-click information panel (generator): a screen-space card on
 * the right, styled like the Navigator — deep-space glass, hand-lettered
 * Amatic SC names in quote marks, dashed golden accents. For the skeleton
 * UI it keeps only the portrait, the story, the children list, and the
 * single "grow this family" primary action.
 */
export function BodyInfoPanel({
  info,
  onAdd,
  onSelect,
  onClose,
  rocket,
}: BodyInfoPanelProps) {
  return (
    <aside
      aria-label={`About ${info.name}`}
      className="animate-panel-in fixed right-3 top-14 z-20 flex max-h-[calc(100vh-7rem)] w-72 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-3xl border border-white/20 bg-space-deep/90 shadow-xl backdrop-blur-sm sm:right-4 sm:top-16 sm:w-72 sm:max-w-[calc(100vw-2rem)]"
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

        {/* Summon the hero rocket — kept as a compact secondary action */}
        {rocket && !rocket.here && (
          <button
            type="button"
            onClick={rocket.onSummon}
            disabled={rocket.flying}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-star/60 px-4 py-1.5 font-hand text-xl font-bold uppercase leading-none tracking-wider text-star transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            <Rocket className="h-5 w-5" strokeWidth={2.5} />
            {rocket.flying ? "Rocket is flying…" : "Summon rocket"}
          </button>
        )}
        {rocket && rocket.here && (
          <p className="rounded-2xl border-2 border-dashed border-white/15 px-3 py-2 text-center font-hand text-lg font-bold uppercase leading-tight tracking-wider text-star">
            {rocket.flying ? "The rocket is on its way!" : "The rocket is parked here!"}
          </p>
        )}

        {/* The single primary action: grow this family */}
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
      </div>
    </aside>
  );
}
