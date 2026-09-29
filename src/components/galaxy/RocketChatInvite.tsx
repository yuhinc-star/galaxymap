import { PanelRightOpen, X } from "lucide-react";

/**
 * Post-landing handshake: after the focus arrives at a node, offer to open
 * its notes. Wears the same thin paper pill as the other suggestions, with
 * a small dismiss cross since this offer stands until answered.
 */
export function RocketChatInvite({
  name,
  onChat,
  onDismiss,
}: {
  name: string;
  img: string;
  onChat: () => void;
  onDismiss: () => void;
}) {
  const label = `Open ${name}`;
  return (
    <div
      role="status"
      aria-label={label}
      className="pointer-events-auto animate-pop-in"
    >
      <div
        className="flex items-center gap-2 rounded-full border border-mini-line bg-mini-paper py-1.5 pl-1.5 pr-2"
        title={label}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-mini-line">
          <PanelRightOpen className="h-3.5 w-3.5 text-mini-ink" strokeWidth={1.5} aria-hidden />
        </span>
        <button
          type="button"
          onClick={onChat}
          className="max-w-[46vw] truncate font-display text-xs font-normal leading-none tracking-[0.08em] text-mini-ink transition-colors hover:text-mini-blue active:scale-95 sm:max-w-64"
        >
          Open <span className="text-mini-blue">{name}</span>
        </button>
        <button
          type="button"
          aria-label="Dismiss suggestion"
          onClick={onDismiss}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-mini-ink/50 transition-colors hover:bg-mini-ink/5 hover:text-mini-ink active:scale-95"
        >
          <X className="h-3 w-3" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
