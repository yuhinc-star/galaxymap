export function SpeechBubble({ text }: { text: string }) {
  return (
    <div
      className="speech-bubble pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 w-44 rounded-2xl bg-card px-3.5 py-2.5 text-center font-display text-sm font-medium leading-snug text-card-foreground shadow-xl"
      style={{ marginLeft: "-5.5rem" }}
    >
      {text}
    </div>
  );
}
