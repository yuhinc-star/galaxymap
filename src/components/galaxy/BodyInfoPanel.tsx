import { useEffect, useRef, useState } from "react";
import { Check, Circle, LocateFixed, Pencil, Plus, Trash2, X } from "lucide-react";
import { MAX_BODY_NAME } from "./systemGenerator";
import { sleepingSpriteFor } from "./sleepSprites";

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
  asleep?: boolean;
}

interface BodyInfoPanelProps {
  info: BodyPanelInfo;
  onAdd: () => void;
  /** Fly to a child body and open its own panel. */
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Summon the hero rocket to this body. */
  rocket?: BodyPanelRocket | undefined;
  /** Chat mode: the panel floats over the chat sheet instead of the galaxy. */
  chatMode?: boolean;
  /** "Say goodbye" — omitted for the sun and for the chat subject. */
  onDelete?: (() => void) | undefined;
  /** Pencil by the name: hand the body a new one (capped, never empty). */
  onRename?: ((name: string) => void) | undefined;
  onToggleSleep?: (() => void) | undefined;
}

/**
 * The double-tap information panel: a card docked right on desktop, a
 * bottom sheet on phones, styled like the Navigator — deep-space glass, hand-lettered
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
  chatMode = false,
  onDelete,
  onRename,
  onToggleSleep,
}: BodyInfoPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Another body (or a rename landing) closes the editor.
  useEffect(() => setEditing(false), [info.id, info.name]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    setDraft(info.name);
    setEditing(true);
  };
  const commitEdit = () => {
    // Tidy the input: no empty names, no double spaces, no head/tail
    // padding — the cap itself is enforced by the input's maxLength.
    const name = draft.trim().replace(/\s+/g, " ");
    setEditing(false);
    if (name && name !== info.name) onRename?.(name);
  };

  return (
    <aside
      aria-label={`About ${info.name}`}
      className={
        chatMode
          ? "minimal-panel animate-sheet-in fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] flex max-h-[52vh] flex-col overflow-hidden border bg-space-deep/90 backdrop-blur-sm sm:animate-panel-in sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:max-h-none sm:w-80"
          : "minimal-panel animate-sheet-in fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex max-h-[52vh] flex-col overflow-hidden border bg-space-deep/90 backdrop-blur-sm sm:animate-panel-in sm:bottom-auto sm:left-auto sm:right-4 sm:top-16 sm:max-h-[calc(100vh-7rem)] sm:w-72 sm:max-w-[calc(100vw-2rem)]"
      }
    >
      <div className="flex items-start gap-3 px-4 pb-2 pt-3">
        <img
          src={info.asleep ? sleepingSpriteFor(info.img) : info.img}
          alt=""
          draggable={false}
          className="h-14 w-14 shrink-0 select-none rounded-full object-contain p-1 ring-1 ring-mini-line"
        />
        <div className="min-w-0 flex-1">
          <span className="font-display text-sm font-bold uppercase tracking-[0.28em] text-mini-ink/60">
            {info.kindLabel}
          </span>
          {editing ? (
            <div className="mt-0.5 flex flex-col gap-1.5">
              <input
                ref={inputRef}
                value={draft}
                maxLength={MAX_BODY_NAME}
                aria-label={`Rename this ${info.kindLabel.toLowerCase()}`}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-full min-w-0 rounded-lg border border-mini-line bg-mini-paper px-2 py-0.5 font-display text-base font-normal leading-tight tracking-[0.06em] text-mini-ink outline-none placeholder:text-mini-ink/30 focus:border-mini-blue"
                placeholder="Name it…"
              />
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-display text-base font-bold uppercase tracking-widest ${
                    draft.length >= MAX_BODY_NAME ? "text-mini-blue" : "text-mini-ink/45"
                  }`}
                >
                  {draft.length}/{MAX_BODY_NAME}
                </span>
                <span className="flex-1" />
                <button
                  type="button"
                  aria-label="Save the new name"
                  title="Save name"
                  onClick={commitEdit}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-mini-ink bg-mini-ink text-mini-paper transition-colors hover:bg-mini-ink/85 active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Keep the old name"
                  title="Cancel"
                  onClick={() => setEditing(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-mini-ink/70 transition-colors hover:bg-mini-ink/5 hover:text-mini-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              {/* Long names wrap whole words; an unbroken string still
                  breaks anywhere instead of flooding the panel. */}
              <h2 className="min-w-0 font-display text-3xl font-bold uppercase leading-tight tracking-wider text-mini-blue [overflow-wrap:anywhere]">
                &ldquo;{info.name}&rdquo;
              </h2>
              {onRename && (
                <button
                  type="button"
                  aria-label={`Rename ${info.name}`}
                  title="Give it a new name"
                  onClick={startEdit}
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mini-ink/55 transition-colors hover:bg-mini-ink/5 hover:text-mini-blue"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Close the info panel"
          onClick={onClose}
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mini-ink/80 transition-colors hover:bg-mini-ink/5 hover:text-mini-ink sm:h-7 sm:w-7"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-4 pt-1 [touch-action:pan-y]">
        {info.line && (
          <p className="rounded-2xl border border-mini-line px-3 py-2 font-display text-xs font-normal tracking-[0.08em] leading-snug text-mini-ink/80">
            {info.line}
          </p>
        )}

        {onToggleSleep && (
          <button
            type="button"
            onClick={onToggleSleep}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-mini-line bg-mini-paper px-4 py-1.5 font-display text-xs font-normal leading-none tracking-[0.08em] text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
          >
            <Circle className={`h-3.5 w-3.5 ${info.asleep ? "fill-current" : ""}`} strokeWidth={1.5} />
            {info.asleep ? `Wake ${info.name}` : `Let ${info.name} sleep`}
          </button>
        )}

        <section>
          <h3 className="font-display text-xs font-normal tracking-[0.08em] text-mini-ink/60">
            {info.childrenLabel}
            <span className="ml-1.5 text-mini-blue">
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
                    className="flex w-full items-center gap-2.5 rounded-full px-2 py-1.5 text-left transition-colors hover:bg-mini-ink/5 sm:py-1"
                  >
                    <img
                      src={c.img}
                      alt=""
                      draggable={false}
                      className="h-7 w-7 shrink-0 select-none rounded-full object-contain p-0.5"
                    />
                    <span
                      title={c.name}
                      className="min-w-0 flex-1 truncate font-display text-sm font-normal leading-none tracking-[0.06em] text-mini-ink"
                    >
                      &ldquo;{c.name}&rdquo;
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 font-display text-xs font-normal tracking-[0.08em] text-mini-ink/40">
               No child nodes
            </p>
          )}
        </section>

        {/* Summon the hero rocket — kept as a compact secondary action */}
        {rocket && !rocket.here && (
          <button
            type="button"
            onClick={rocket.onSummon}
            disabled={rocket.flying}
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-mini-blue/70 px-4 py-1.5 font-display text-xs font-normal leading-none tracking-[0.08em] text-mini-blue transition-colors hover:border-mini-blue active:scale-95 disabled:opacity-40"
          >
             <LocateFixed className="h-3.5 w-3.5" strokeWidth={1.5} />
            {rocket.flying ? "Changing focus…" : "Set as focus"}
          </button>
        )}
        {rocket && rocket.here && (
          <p className="rounded-full border border-mini-line px-3 py-1.5 text-center font-display text-xs font-normal leading-tight tracking-[0.08em] text-mini-ink/60">
            {rocket.flying ? "Focus changing" : "Current focus"}
          </p>
        )}

        {/* The single primary action: grow this family */}
        <section className="rounded-2xl border border-mini-line px-3 py-2.5">
          <h3 className="font-display text-xs font-normal tracking-[0.08em] text-mini-ink/60">
             Add node
          </h3>
          {info.add.canAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-mini-ink bg-mini-ink px-4 py-1.5 font-display text-xs font-normal leading-none tracking-[0.08em] text-mini-paper transition-colors hover:bg-mini-ink/85 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              {info.add.actionLabel}
            </button>
          ) : (
            <p className="mt-1 font-display text-xs font-normal leading-tight tracking-[0.08em] text-mini-ink/60">
              {info.add.fullNote}
            </p>
          )}
        </section>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-mini-line px-3 py-1.5 font-display text-xs font-normal tracking-[0.08em] text-mini-ink/50 transition-colors hover:border-mini-ink/40 hover:text-mini-ink active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
             Remove node
          </button>
        )}
      </div>
    </aside>
  );
}
