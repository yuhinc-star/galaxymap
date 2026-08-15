import { MessageCircleHeart, X } from "lucide-react";

/**
 * The rocket's post-landing handshake: after the rocket touches down on a
 * star it offers to start a conversation with its new host — the same
 * notification-pill style as the "visit the parent" pill, stacked below it.
 * With the chat already open on another star, the pill offers to SWITCH
 * the conversation over to the rocket's new host.
 */
export function RocketChatInvite({
  name,
  img,
  switching = false,
  onChat,
  onDismiss,
}: {
  name: string;
  img: string;
  /** Chat is already open with someone else — offer to switch over. */
  switching?: boolean;
  onChat: () => void;
  onDismiss: () => void;
}) {
  const label = `Chat with ${name}`;
  return (
    <div
      role="status"
      aria-label={label}
      className="pointer-events-auto animate-zoom-pill-in"
    >
      <div
        className="flex items-center gap-1.5 rounded-full border border-white/25 bg-[hsl(266,45%,12%)]/82 py-1.5 pl-2 pr-1.5 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.85)] backdrop-blur-md"
        title={label}
      >
        <img
          src={img}
          alt=""
          className="h-6 w-6 shrink-0 rounded-full object-cover"
        />
        <button
          type="button"
          onClick={onChat}
          className="flex min-w-0 items-center gap-1 font-ui text-[13px] font-semibold text-[hsl(200,80%,88%)] transition-colors hover:text-[hsl(48,100%,72%)]"
        >
          <>
            Chat with <span className="text-star">{name}</span>?
          </>
          <MessageCircleHeart
            className="h-3.5 w-3.5 shrink-0 text-[hsl(48,100%,72%)]"
            strokeWidth={2.4}
          />
        </button>
        <button
          type="button"
          aria-label="Dismiss chat suggestion"
          onClick={onDismiss}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[hsl(200,60%,75%)]/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}
