import { MessagesSquare, X } from "lucide-react";

interface RocketChatInviteProps {
  /** Host body's display name. */
  name: string;
  /** Host body's face. */
  img: string;
  onChat: () => void;
  /** When omitted, no dismiss button renders (state-driven pills). */
  onDismiss?: () => void;
}

/**
 * Chat invite pill in the SuggestionStack: "Chat with <name>?" with the
 * body's face. It is the rocket's post-landing handshake in galaxy mode:
 * time-boxed and dismissible. Chat mode never repeats this prompt for the
 * conversation that is already open. The rocket decides who we talk to;
 * this pill is its handshake before a conversation begins.
 */
export function RocketChatInvite({
  name,
  img,
  onChat,
  onDismiss,
}: RocketChatInviteProps) {
  return (
    <div className="animate-pop-in flex items-center gap-2">
      <button
        type="button"
        onClick={onChat}
        aria-label={`Chat with ${name}`}
        title={`Chat with ${name}`}
        className="flex items-center gap-2.5 rounded-full border border-white/20 bg-space-deep/90 py-1.5 pl-2 pr-4 shadow-xl backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <img
            src={img}
            alt=""
            draggable={false}
            className="h-9 w-9 select-none rounded-full bg-space/60 object-contain p-0.5 ring-1 ring-white/25"
          />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-star shadow">
            <MessagesSquare
              className="h-2.5 w-2.5 text-space-deep"
              strokeWidth={3}
              aria-hidden
            />
          </span>
        </span>
        <span className="max-w-[46vw] truncate font-hand text-2xl font-bold uppercase leading-none tracking-wider text-white sm:max-w-64">
          Chat with <span className="text-star">{name}</span>?
        </span>
      </button>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss chat invite"
          title="Maybe later"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-space-deep/90 text-white/80 shadow-xl backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
