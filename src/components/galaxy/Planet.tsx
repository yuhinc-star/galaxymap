import { createContext, useContext, useRef } from "react";

/** Minimalist Mode: bodies render as stateful ink dots; the chosen one is blue. */
export const MinimalContext = createContext(false);
import type { BodyDef } from "./planets";
import { SpeechBubble } from "./SpeechBubble";
import { sleepingSpriteFor } from "./sleepSprites";
import { minimalNodeDescription } from "./minimalCopy";

/** Hand-wobbled closed ring (r≈68 in a 160 viewBox) for the navigator
    highlight — deliberately imperfect so it reads as drawn, not orbital. */
const HIGHLIGHT_RING_PATH = (() => {
  const pts: string[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 68 + Math.sin(a * 3 + 0.7) * 3.2 + Math.sin(a * 5 + 2.1) * 1.8;
    pts.push(
      `${i === 0 ? "M" : "L"} ${(80 + Math.cos(a) * r).toFixed(1)} ${(80 + Math.sin(a) * r).toFixed(1)}`,
    );
  }
  return `${pts.join(" ")} Z`;
})();

interface PlanetProps {
  def: BodyDef;
  /** Center position in world px. */
  x: number;
  y: number;
  active: boolean;
  bouncing?: boolean;
  /** Just born via the generator's add-a-body bubble: pop-in animation. */
  newborn?: boolean;
  /** Saying goodbye: spins away and shrinks out before removal. */
  departing?: boolean;
  onTap: (id: string) => void;
  /** Slowly rotate the sprite (used for the Sun's rays). */
  spin?: boolean;
  /** Single squash-and-stretch hop, triggered from the navigator. */
  jumping?: boolean;
  /** Spinning dashed ring, shown when found via the navigator. */
  highlighted?: boolean;
  /** "flash" fades out (navigator find); "steady" stays on (rocket target). */
  highlightMode?: "flash" | "steady";
  /** Chat mode: scale the name label up so it stays readable while the
      camera zooms the family column out. */
  labelBoost?: number;
  /** Current camera scale. Labels counter-scale above 1x so a deep close-up
      enlarges the painted body, not its caption into a wall of letters. */
  cameraScale?: number;
  /** Semantic zoom presentation. The body remains in the system tree. */
  visualOpacity?: number;
  visualScale?: number;
  labelOpacity?: number;
  interactive?: boolean;
  asleep?: boolean;
  /** Minimalist Mode: the rocket's host, drawn as the blue ringed dot. */
  chosen?: boolean;
}

/**
 * Hand-lettered name size for a body: long generated names get a smaller,
 * wrapping label so they read like a caption instead of one endless line.
 * Shared with the chat fan layout, which scales labels to fit the strip.
 */
export function planetLabelSize(size: number, name: string): number {
  return name.length > 16
    ? Math.max(22, Math.min(size * 0.22, 40))
    : Math.max(32, Math.min(size * 0.3, 72));
}

/**
 * A celestial body floating in the world: sprite, name label, tap
 * reaction. Position comes from the parent's orbit math.
 */
export function Planet({ def, x, y, active, bouncing = false, newborn = false, departing = false, onTap, spin, jumping, highlighted, highlightMode = "flash", labelBoost = 1, cameraScale = 1, visualOpacity = 1, visualScale = 1, labelOpacity = 1, interactive = true, asleep = def.asleep ?? false, chosen = false }: PlanetProps) {
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);
  const minimal = useContext(MinimalContext);
  if (minimal) return <MinimalDot {...{ def, x, y, active, departing, newborn, onTap, highlighted: !!highlighted, cameraScale, visualOpacity, visualScale, labelOpacity, interactive, chosen }} />;
  const longName = def.name.length > 16;

  let animation: string | undefined;
  if (departing) {
    animation = "body-goodbye 0.68s cubic-bezier(0.5, 0, 0.75, 0.4) 1 both";
  } else if (newborn) {
    animation = "planet-birth 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 1";
  } else if (jumping) {
    animation = "planet-jump 0.8s cubic-bezier(0.36, 0, 0.66, 1) 1";
  } else if (!bouncing) {
    animation = spin
      ? `sun-spin 90s linear infinite`
      : `planet-breathe ${def.breathe}s ease-in-out ${def.delay}s infinite`;
  }

  const labelSize = planetLabelSize(def.size, def.name);
  const labelCounterScale = Math.max(1, cameraScale);

  return (
    <div
      className={`absolute semantic-body ${departing || !interactive ? "pointer-events-none" : ""}`}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: active || highlighted ? 30 : undefined,
        opacity: visualOpacity,
        ["--semantic-scale" as string]: visualScale,
      }}
    >
      <button
        type="button"
        aria-label={def.name}
        className={`relative block cursor-pointer touch-manipulation select-none ${bouncing ? "planet-bounce" : ""}`}
        style={{ width: def.size, height: def.size }}
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        }}
        onPointerUp={(e) => {
          const pd = downAt.current;
          downAt.current = null;
          if (!pd) return;
          const moved = Math.hypot(e.clientX - pd.x, e.clientY - pd.y);
          if (moved < 12 && Date.now() - pd.t < 600) onTap(def.id);
        }}
      >
        <img
          src={asleep ? sleepingSpriteFor(def.img) : def.img}
          alt=""
          width={def.size}
          height={def.size}
          draggable={false}
          className="h-full w-full object-contain"
          style={{ animation }}
        />
        {asleep && (
          <span
            className="sleep-zzz pointer-events-none absolute -right-[8%] top-[3%] font-hand font-bold uppercase text-star"
            style={{
              transform: `scale(${1 / labelCounterScale})`,
              transformOrigin: "left bottom",
            }}
            aria-hidden
          >
            <span>Z</span><span>Z</span><span>Z</span>
          </span>
        )}
        {/* Newborn celebration: sparkle crosses bursting outward. */}
        {newborn &&
          [0, 60, 120, 180, 240, 300].map((a) => {
            const rad = (a * Math.PI) / 180;
            const dx = Math.cos(rad) * def.size * 0.66;
            const dy = Math.sin(rad) * def.size * 0.66;
            const s = Math.max(18, def.size * 0.2);
            return (
              <svg
                key={a}
                viewBox="0 0 24 24"
                aria-hidden
                className="birth-sparkle pointer-events-none absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  width: s,
                  height: s,
                  marginLeft: -s / 2,
                  marginTop: -s / 2,
                  ["--dx" as string]: `${dx}px`,
                  ["--dy" as string]: `${dy}px`,
                  animationDelay: `${a / 850}s`,
                }}
              >
                <path
                  d="M12 2.5v19M2.5 12h19"
                  stroke="#fff3c4"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            );
          })}
        {highlighted && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2"
            style={{ width: "158%", height: "158%" }}
            aria-hidden
          >
            <svg viewBox="0 0 160 160" className={`h-full w-full ${highlightMode === "steady" ? "navigator-ring-steady" : "navigator-ring"}`}>
              {/* Golden wobbly ring — reads as "found!", not another orbit */}
              <path
                d={HIGHLIGHT_RING_PATH}
                fill="none"
                stroke="#ffd94d"
                strokeWidth="8"
                strokeDasharray="30 18"
                strokeLinecap="round"
              />
              {/* Twinkling finder sparkles on the ring */}
              {[0, 90, 180, 270].map((a) => {
                const rad = (a * Math.PI) / 180;
                const sx = 80 + Math.cos(rad) * 68;
                const sy = 80 + Math.sin(rad) * 68;
                return (
                  <path
                    key={a}
                    d={`M ${sx} ${sy - 11} L ${sx} ${sy + 11} M ${sx - 11} ${sy} L ${sx + 11} ${sy}`}
                    stroke="#fff3c4"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="navigator-sparkle"
                    style={{ animationDelay: `${a / 500}s` }}
                  />
                );
              })}
            </svg>
          </span>
        )}
      </button>
      <span
        className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 font-hand font-bold uppercase tracking-[0.2em] text-orbit-label transition-opacity duration-500 ${
          departing ? "opacity-0" : ""
        } ${
          longName ? "w-max max-w-[380px] whitespace-normal text-center leading-none [overflow-wrap:anywhere]" : "whitespace-nowrap"
        }`}
        style={{
          fontSize: (labelSize * labelBoost) / labelCounterScale,
          maxWidth: 380 / labelCounterScale,
          marginTop: 4 / labelCounterScale,
          opacity: departing ? 0 : labelOpacity,
          textShadow: `0 ${2 / labelCounterScale}px ${10 / labelCounterScale}px rgba(10, 6, 30, 0.9)`,
        }}
      >
        {def.name}
      </span>
      {active && <SpeechBubble text={def.line} />}
    </div>
  );
}

/** Minimalist Mode body: awake is white, asleep is black, and the rocket's
    current destination remains the large blue dot inside a thin blue ring. */
function MinimalDot({ def, x, y, active, departing, newborn, onTap, highlighted, cameraScale = 1, visualOpacity = 1, visualScale = 1, labelOpacity = 1, interactive = true, chosen }: Pick<PlanetProps, "def" | "x" | "y" | "active" | "departing" | "newborn" | "onTap" | "highlighted" | "cameraScale" | "visualOpacity" | "visualScale" | "labelOpacity" | "interactive" | "chosen">) {
  const downAt = useRef<{ x: number; y: number; t: number } | null>(null);
  // Only animate a release on nodes that were actually chosen before.
  const wasChosen = useRef(!!chosen);
  const [released, setReleased] = useState(false);
  useEffect(() => {
    if (wasChosen.current && !chosen) setReleased(true);
    if (chosen) setReleased(false);
    wasChosen.current = !!chosen;
  }, [chosen]);
  // Dots are sized in screen pixels so every zoom depth reads like the
  // orbit studies: small ink beads, one confident blue focus.
  const sc = Math.max(1e-4, cameraScale);
  // Three quiet bead sizes (nucleus / planet / moon) keep the page calm.
  const tier = def.id === "sun" || def.size > 260 ? 15 : def.size > 90 ? 9 : 6.5;
  const dot = (chosen ? 26 : tier) / sc;
  const hit = Math.max(dot * 2.4, 30 / sc);
  const stroke = 1.6 / sc;
  return (
    <div
      className={`absolute semantic-body ${departing || !interactive ? "pointer-events-none" : ""}`}
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        zIndex: active || highlighted || chosen ? 30 : undefined,
        opacity: visualOpacity,
        transition: "opacity 0.55s ease, transform 0.55s ease",
        ["--semantic-scale" as string]: visualScale,
      }}
    >
      <button
        type="button"
        aria-label={def.name}
        className="relative block cursor-pointer touch-manipulation select-none"
        style={{ width: hit, height: hit }}
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        }}
        onPointerUp={(e) => {
          const pd = downAt.current;
          downAt.current = null;
          if (!pd) return;
          if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 12 && Date.now() - pd.t < 600) onTap(def.id);
        }}
      >
        <svg
          viewBox={`${-hit / 2} ${-hit / 2} ${hit} ${hit}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{ animation: departing ? "body-goodbye 0.68s ease-in 1 both" : newborn ? "planet-birth 0.9s cubic-bezier(0.34,1.56,0.64,1) 1" : undefined }}
          aria-hidden
        >
          {/* One persistent bead: becoming chosen grows and tints it in place
              with a springy bubble, instead of swapping elements instantly. */}
          <g key={chosen ? "chosen" : "plain"} className={chosen ? "minimal-choose-pop" : released ? "minimal-release-pop" : undefined}>
            <circle
              r={dot / 2}
              className={chosen ? "fill-mini-blue stroke-mini-blue" : def.asleep ? "fill-mini-ink stroke-mini-ink" : "fill-mini-paper stroke-mini-ink"}
              strokeWidth={chosen || def.asleep ? 0 : stroke}
              style={{ transition: "r 0.6s cubic-bezier(0.34,1.56,0.64,1), fill 0.45s ease, stroke 0.45s ease" }}
            />
          </g>
          <circle
            r={(chosen ? dot / 2 + 5 / sc : dot / 2)}
            fill="none"
            className="stroke-mini-blue"
            strokeWidth={1.5 / sc}
            style={{ opacity: chosen ? 1 : 0, transition: "r 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.08s, opacity 0.4s ease" }}
          />
          {(highlighted || active) && (
            <circle r={hit / 2 - 1} fill="none" className="stroke-mini-line" strokeWidth={1.2 / sc} strokeDasharray={`${3 / sc} ${3 / sc}`} />
          )}
          {chosen && (
            <g key="choose-ripple">
              <circle r={dot / 2 + 4 / sc} fill="none" className="minimal-refocus-ring stroke-mini-blue" strokeWidth={1.8 / sc} />
              <circle r={dot / 2 + 4 / sc} fill="none" className="minimal-refocus-ring minimal-refocus-ring-delay stroke-mini-blue" strokeWidth={1.2 / sc} />
            </g>
          )}
        </svg>
      </button>
      <span
        className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap font-sans font-normal lowercase tracking-[0.12em] text-mini-line"
        style={{
          fontSize: 11 / sc,
          marginTop: 3 / sc,
          maxWidth: 260 / sc,
          overflow: "hidden",
          textOverflow: "ellipsis",
          opacity: departing || !(chosen || active || highlighted) ? 0 : labelOpacity,
          transition: "opacity 0.4s",
        }}
      >
        {def.name}
      </span>
      {active && <SpeechBubble text={minimalNodeDescription(def)} minimal />}
    </div>
  );
}
