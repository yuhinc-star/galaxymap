import { useState } from "react";
import { ChevronDown, List, Sparkle } from "lucide-react";

export interface NavigatorEntry {
  id: string;
  name: string;
  img: string;
  moons?: { id: string; name: string; img: string }[] | undefined;
}

interface NavigatorProps {
  items: NavigatorEntry[];
  activeId: string | null;
  /** Body the camera is following right now — the "you are here" marker. */
  focusedId?: string | null;
  onSelect: (id: string) => void;
}

/**
 * Top-left navigator: every body in the system listed as a small circular
 * "profile picture" plus its hand-lettered name in quote marks (Amatic SC,
 * the reference poster's lettering). Clicking an entry pans the camera to
 * the body, which hops once and flashes a dashed ring so you can spot it.
 */
export function Navigator({ items, activeId, focusedId, onSelect }: NavigatorProps) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open the navigator"
        title="Navigator"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-16 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-space-deep/90 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
      >
        <List className="h-5 w-5" />
      </button>
    );
  }

  const renderEntry = (
    entry: { id: string; name: string; img: string },
    moon: boolean,
  ) => {
    const focused = focusedId === entry.id;
    return (
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        aria-current={focused ? "true" : undefined}
        className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 text-left transition-colors hover:bg-white/10 ${
          focused
            ? "bg-star/15 ring-1 ring-star/60"
            : activeId === entry.id
              ? "bg-white/20"
              : ""
        } ${moon ? "py-1" : "py-1.5"}`}
      >
        <img
          src={entry.img}
          alt=""
          draggable={false}
          className={`shrink-0 select-none rounded-full bg-space/60 object-contain p-0.5 ${
            moon ? "h-7 w-7" : "h-9 w-9"
          } ${focused ? "ring-2 ring-star" : ""}`}
        />
        <span
          className={`font-hand font-bold uppercase leading-none tracking-wider ${
            focused ? "text-star" : "text-white"
          } ${moon ? "text-lg" : "text-2xl"}`}
        >
          &ldquo;{entry.name}&rdquo;
        </span>
        {focused && (
          <Sparkle
            className="ml-auto h-4 w-4 shrink-0 animate-pulse text-star"
            aria-label="Camera is following"
          />
        )}
      </button>
    );
  };

  return (
    <nav
      aria-label="System navigator"
      className="animate-pop-in fixed left-4 top-16 z-20 flex max-h-[62vh] w-60 flex-col overflow-hidden rounded-3xl border border-white/20 bg-space-deep/90 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="font-hand text-2xl font-bold uppercase tracking-[0.2em] text-white">
          Navigator
        </span>
        <button
          type="button"
          aria-label="Collapse the navigator"
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-0.5 overflow-y-auto px-2 pb-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-0.5">
            {renderEntry(item, false)}
            {item.moons && item.moons.length > 0 && (
              <ul className="ml-6 flex flex-col gap-0.5 border-l-2 border-dashed border-white/40 pl-2">
                {item.moons.map((m) => (
                  <li key={m.id}>{renderEntry(m, true)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
