import { LocateFixed } from "lucide-react";

interface RocketSummonInviteProps {
  /** Destination body's display name. */
  name: string;
  /** Destination body's face. */
  img: string;
  onSummon: () => void;
}

/**
 * Set-focus suggestion: shown whenever the visited node isn't the current
 * focus. One tap moves the focus over — never offered for the node that
 * already holds it. Minimalist edition: thin paper pill, thin crosshair
 * marker, quiet display type.
 */
export function RocketSummonInvite({
  name,
  onSummon,
}: RocketSummonInviteProps) {
  return (
    <button
      type="button"
      onClick={onSummon}
      aria-label={`Set focus to ${name}`}
      title={`Set focus to ${name}`}
      className="animate-pop-in flex items-center gap-2 rounded-full border border-mini-line bg-mini-paper py-1.5 pl-1.5 pr-4 transition-colors hover:border-mini-ink/60 active:scale-95"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-mini-blue/70">
        <LocateFixed className="h-3.5 w-3.5 text-mini-blue" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="max-w-[46vw] truncate font-display text-xs font-normal leading-none tracking-[0.08em] text-mini-ink sm:max-w-64">
        Focus <span className="text-mini-blue">{name}</span>
      </span>
    </button>
  );
}
