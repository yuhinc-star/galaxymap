import { useState } from "react";
import { ChevronDown, List } from "lucide-react";

export interface NavigatorEntry {
  id: string;
  name: string;
  img: string;
  moons?: { id: string; name: string; img: string }[] | undefined;
}

interface NavigatorProps {
  items: NavigatorEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Top-left navigator: every body in the system listed as a small circular
 * "profile picture" plus its hand-lettered name in quote marks (Amatic SC,
 * the reference poster's lettering). Clicking an entry pans the camera to
 * the body, which hops once and flashes a dashed ring so you can spot it.
 */
export function Navigator({ items, activeId, onSelect }: NavigatorProps) {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Open the navigator"
        title="Navigator"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-16 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-card-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <List className="h-5 w-5" />
      </button>
    );
  }

  const renderEntry = (
    entry: { id: string; name: string; img: string },
    moon: boolean,
  ) => (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 text-left transition-colors hover:bg-accent/70 ${
        activeId === entry.id ? "bg-accent" : ""
      } ${moon ? "py-1" : "py-1.5"}`}
    >
      <img
        src={entry.img}
        alt=""
        draggable={false}
        className={`shrink-0 select-none rounded-full bg-space/60 object-contain p-0.5 ${
          moon ? "h-7 w-7" : "h-9 w-9"
        }`}
      />
      <span
        className={`font-hand font-bold uppercase leading-none tracking-wider text-orbit-label ${
          moon ? "text-lg" : "text-2xl"
        }`}
      >
        &ldquo;{entry.name}&rdquo;
      </span>
    </button>
  );

  return (
    <nav
      aria-label="System navigator"
      className="animate-pop-in fixed left-4 top-16 z-20 flex max-h-[62vh] w-60 flex-col overflow-hidden rounded-3xl border border-border bg-card/85 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="font-hand text-2xl font-bold uppercase tracking-[0.2em] text-orbit-label">
          Navigator
        </span>
        <button
          type="button"
          aria-label="Collapse the navigator"
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-card-foreground/70 transition-colors hover:bg-accent hover:text-card-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-0.5 overflow-y-auto px-2 pb-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-0.5">
            {renderEntry(item, false)}
            {item.moons && item.moons.length > 0 && (
              <ul className="ml-6 flex flex-col gap-0.5 border-l-2 border-dashed border-orbit-label/40 pl-2">
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
