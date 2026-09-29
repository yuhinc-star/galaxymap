import { useEffect, useRef, useState } from "react";
import { Moon, Send, Sun, X } from "lucide-react";

export interface ChatSubjectInfo {
  id: string;
  name: string;
  img: string;
  line: string;
  kindLabel: string;
  asleep?: boolean;
}

interface ChatMessage {
  from: "me" | "body";
  text: string;
}

/**
 * Small-talk pool. The first answer is always the body's own storybook
 * line; after that the conversation drifts through these quips.
 */
const QUIPS = [
  "The visible contour records this body's current orbital relationship.",
  "The adjacent nodes belong to the same five-generation observation window.",
  "Scale changes presentation only; the underlying system remains intact.",
  "White indicates awake. Black indicates sleeping. Cobalt indicates focus.",
];

const SUGGESTIONS = [
  "Describe this body",
  "Describe its orbit",
  "Show its lineage",
];

interface ChatPanelProps {
  subject: ChatSubjectInfo;
  onClose: () => void;
  /** The rocket is still flying to this subject — the conversation (and
      its suggestions) only begin once it lands. */
  waiting?: boolean;
  onToggleSleep?: (() => void) | undefined;
}

/**
 * Chat mode panel: a full-screen overlay on phones, a deep-space glass
 * column taking the right of the screen on desktop (the galaxy squeezes
 * into a strip beside it). Styled like the Navigator and info panel —
 * hand-lettered Amatic names, golden accents, dashed-star charm.
 */
export function ChatPanel({ subject, onClose, waiting = false, onToggleSleep }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const replyTimer = useRef<number | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  // Escape closes the chat, like any good door.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || typing || waiting) return;
    const replyCount = messages.filter((m) => m.from === "body").length;
    const reply =
      replyCount === 0
        ? subject.line
        : QUIPS[(replyCount - 1 + subject.id.length) % QUIPS.length]!;
    setMessages((m) => [...m, { from: "me", text }]);
    setDraft("");
    setTyping(true);
    replyTimer.current = window.setTimeout(() => {
      setMessages((m) => [...m, { from: "body", text: reply }]);
      setTyping(false);
    }, 650 + Math.random() * 550);
  };

  return (
    <aside
      aria-label={`Notes for ${subject.name}`}
      className="minimal-panel fixed inset-x-0 bottom-0 top-[34%] z-50 flex flex-col border-t bg-mini-paper/95 backdrop-blur-sm sm:static sm:inset-auto sm:z-auto sm:h-full sm:min-w-0 sm:flex-1 sm:border-l sm:border-t-0"
    >
      {/* Header: who's talking */}
      <div className="flex items-center gap-3 border-b border-white/15 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <span className="h-3 w-3 shrink-0 rounded-full bg-mini-blue" aria-hidden />
        <div className="min-w-0 flex-1">
          <span className="font-hand text-xs font-bold uppercase tracking-[0.28em] text-white/60">
            {subject.kindLabel} · {waiting ? "changing focus" : "field notes"}
          </span>
          <h2 className="truncate font-hand text-3xl font-bold uppercase leading-tight tracking-wider text-star">
            {subject.name}
          </h2>
        </div>
        {onToggleSleep && (
          <button
            type="button"
            aria-label={subject.asleep ? `Wake ${subject.name}` : `Let ${subject.name} sleep`}
            title={subject.asleep ? "Wake up" : "Sleep mode"}
            onClick={onToggleSleep}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orbit-label/30 text-orbit-label transition-transform hover:scale-105 active:scale-95"
          >
            {subject.asleep ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}
        <button
          type="button"
          aria-label="Close notes"
          onClick={onClose}
          className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {waiting ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="h-4 w-4 animate-pulse rounded-full bg-mini-blue" aria-hidden />
          <p className="font-display text-2xl font-medium text-mini-ink">
            Changing focus
          </p>
          <p className="max-w-xs font-display text-sm text-mini-ink/60 [overflow-wrap:anywhere]">
            Preparing the observation for {subject.name}.
          </p>
        </div>
      ) : messages.length === 0 ? (
        /* Empty state: big portrait + conversation starters */
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="h-5 w-5 rounded-full bg-mini-blue ring-1 ring-mini-blue ring-offset-4 ring-offset-mini-paper" aria-hidden />
          <p className="max-w-md font-display text-3xl font-medium text-mini-ink [overflow-wrap:anywhere]">
            {subject.name}
          </p>
          <p className="max-w-xs font-display text-sm text-mini-ink/60">
            Five generations are arranged in the adjacent study.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-white/20 bg-space/60 px-4 py-2 font-display text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Transcript */
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {messages.map((m, i) =>
            m.from === "me" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-star px-3.5 py-2 font-display text-sm font-semibold text-space shadow-md">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-end gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mini-ink" aria-hidden />
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/15 bg-space/60 px-3.5 py-2 font-display text-sm text-white/90">
                  {m.text}
                </div>
              </div>
            ),
          )}
          {typing && (
            <div className="flex items-end gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mini-ink" aria-hidden />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/15 bg-space/60 px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-orbit-label"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Composer */}
      <form
        className="flex items-center gap-2 border-t border-white/15 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={waiting}
          placeholder={waiting ? "Preparing observation…" : `Add a note about ${subject.name}…`}
          aria-label={`Add a note about ${subject.name}`}
          className="min-w-0 flex-1 rounded-full border border-white/20 bg-space/60 px-4 py-2.5 font-display text-sm text-white outline-none placeholder:text-white/40 focus:border-star/60 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={waiting || !draft.trim() || typing}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-star text-space shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
