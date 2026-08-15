import { useState } from "react";
import { ChevronDown, List, Sparkle, X } from "lucide-react";

export interface NavigatorEntry {
  id: string;
  name: string;
  img: string;
  moons?: { id: string; name: string; img: string }[] | undefined;
}

export interface NavigatorRocket {
  img: string;
  /** Entry the chip sits on — the destination while the rocket flies. */
  hostId: string | null;
  flying: boolean;
  /** Move mode: the next sun/planet pick becomes the rocket's destination. */
  armed: boolean;
  onChip: () => void;
  onDestination: (id: string) => void;
}

interface NavigatorProps {
  items: NavigatorEntry[];
  activeId: string | null;
  /** Body the camera is following right now — the "you are here" marker. */
  focusedId?: string | null;
  onSelect: (id: string) => void;
  rocket?: NavigatorRocket;
}

/**
 * Top-left navigator: every body in the system listed as a small circular
 * "profile picture" plus its hand-lettered name in quote marks (Amatic SC,
 * the reference poster's lettering). Clicking an entry pans the camera to
 * the body, which hops once and flashes a dashed ring so you can spot it.
 *
 * The hero rocket appears as a small chip on the entry it's parked at.
 * Clicking the chip arms "move mode": the next sun or planet picked here
 * becomes the rocket's destination instead of a camera target. (Rockets
 * land on suns and planets — moons are too small, so they dim out.)
 */
export function Navigator({ items, activeId, focusedId, onSelect, rocket }: NavigatorProps) {
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

  const armed = rocket?.armed ?? false;

  const renderEntry = (
    entry: { id: string; name: string; img: string },
    moon: boolean,
  ) => {
    const focused = focusedId === entry.id;
    const rocketHere = !moon && rocket?.hostId === entry.id;
    const dimmed = armed && moon;
    const handleClick = () => {
      if (armed) {
        if (!moon) rocket!.onDestination(entry.id);
        return;
      }
      onSelect(entry.id);
    };
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          aria-current={focused ? "true" : undefined}
          disabled={dimmed}
          className={`flex w-full items-center gap-2.5 rounded-2xl px-2.5 text-left transition-colors ${
            dimmed
              ? "opacity-35"
              : armed
                ? "cursor-pointer hover:bg-star/20 hover:ring-1 hover:ring-star/50"
                : "hover:bg-white/10"
          } ${
            focused
              ? "bg-star/15 ring-1 ring-star/60"
              : activeId === entry.id
                ? "bg-white/20"
                : ""
          } ${moon ? "py-1" : "py-1.5"} ${rocketHere ? "pr-10" : ""}`}
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
        {rocketHere && rocket && (
          <button
            type="button"
            aria-label={
              armed
                ? "Cancel rocket move"
                : `Move the rocket (parked at ${entry.name})`
            }
            title={armed ? "Cancel rocket move" : "Move the rocket"}
            onClick={rocket.onChip}
            className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-transform hover:scale-110 active:scale-95 ${
              armed ? "border-star bg-star/40" : "border-star/60 bg-star/15"
            } ${rocket.flying ? "animate-pulse" : ""}`}
          >
            <img
              src={rocket.img}
              alt=""
              draggable={false}
              className="h-4 w-4 rotate-45 object-contain"
            />
          </button>
        )}
      </div>
    );
  };

  return (
    <nav
      aria-label="System navigator"
      className="animate-pop-in fixed left-4 top-16 z-20 flex max-h-[62vh] w-60 flex-col overflow-hidden rounded-3xl border border-white/20 bg-space-deep/90 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="font-hand text-2xl font-bold uppercase tracking-[0.2em] text-white">
          {armed ? "Fly the rocket to…" : "Navigator"}
        </span>
        <div className="flex items-center gap-1">
          {armed && (
            <button
              type="button"
              aria-label="Cancel rocket move"
              onClick={rocket!.onChip}
              className="flex h-7 w-7 items-center justify-center rounded-full text-star transition-colors hover:bg-star/20"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Collapse the navigator"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
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
