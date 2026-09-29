import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { minimalNodeDescription } from "./minimalCopy";
import { Link } from "@tanstack/react-router";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  Dices,
  Home,
  MessagesSquare,
  Minus,
  Plus,
  RotateCcw,
  Sparkle,
  Undo,
} from "lucide-react";
import heroRocketImg from "@/assets/planets/hero-rocket.png";
import { BACKGROUNDS } from "./backgrounds";
import { CENTER, WORLD } from "./planets";
import {
  addMoonToSystem,
  addPlanetToSystem,
  collectSystemSpriteUrls,
  createDeepSystem,
  findMoonById,
  findMoonParent,
  generateSystem,
  removeBodyFromSystem,
  renameBodyInSystem,
  setBodyAsleepInSystem,
  MAX_MOONS_PER_BODY,
  MAX_SYSTEM_PLANETS,
  MIN_MOON_PARENT_SIZE,
  type GeneratedMoon,
  type SystemConfig,
} from "./systemGenerator";
import { ensureSpritesReady, warmSpritePool } from "./spritePool";
import { recordCrashEvent, setCrashContext } from "@/lib/crash-reporter";
import type { OrbitShapeKind, OrbitShape } from "./orbitShapes";
import { makeStudyShape, makeStudyOrbit, studyPath, type StudyShape } from "./orbitShapes";
import { BodyInfoPanel, type BodyPanelInfo } from "./BodyInfoPanel";
import { ChatPanel, type ChatSubjectInfo } from "./ChatPanel";
import {
  chaseChatTarget,
  chatEase,
  computeChatLayout,
  rideChatOrbit,
  rideChatOrbitExit,
  type ChatChaseState,
  type ChatChildInput,
  type ChatLayout,
  type ChatRideState,
} from "./chatLayout";
import { Drifter } from "./Drifter";
import { MinimalContext } from "./Planet";
import { HeroRocket, ROCKET_H, rocketWorldScale } from "./HeroRocket";
import { HintGuide, type ContextualHint } from "./HintGuide";
import { Navigator, type NavigatorEntry } from "./Navigator";
import { Planet } from "./Planet";
import { RocketChatInvite } from "./RocketChatInvite";
import { RocketSummonInvite } from "./RocketSummonInvite";
import { Starfield } from "./Starfield";
import { SuggestionStack } from "./SuggestionStack";
import { ZoomOutPill, type ZoomOutTarget } from "./ZoomOutPill";
import { semanticVisibility, type SemanticVisibility } from "./semanticZoom";

const TAU = Math.PI * 2;
const MIN_PLANETS = 2;
const MAX_PLANETS = 8;
const DEFAULT_SEED = 20260214;
const DEFAULT_COUNT = 6;

/** The exploration tour, one hand-lettered tip at a time. */
const GENERATOR_HINTS: ContextualHint[] = [
  { id: "wander", context: "explore", text: "Drag the canvas. Pinch or scroll to change scale." },
  { id: "navigator", context: "explore", text: "The system index preserves every generation." },
  { id: "new-system", context: "explore", text: "New system creates another deterministic orbit study." },
  { id: "hello", context: "focused", text: "Select a node to focus. Select it twice for its details." },
  { id: "zoom-out", context: "focused", text: "Move upward one generation, or return to the full system." },
  { id: "summon", context: "summon", text: "Set this node as the current focus." },
  { id: "rocket-home", context: "at-host", text: "The cobalt node marks the current focus." },
  { id: "chat-link", context: "at-host", text: "Open notes for the current focus." },
  { id: "storybook", context: "storybook", text: "Details include naming, state, descendants, and removal." },
  { id: "armed", context: "rocket-armed", text: "Choose any node as the next focus." },
  { id: "flight", context: "rocket-flight", text: "Focus is shifting to the selected node." },
  { id: "chat", context: "chat", text: "Five generations remain visible beside the notes panel." },
];

/** Parked rocket stands on its host's upper-right shoulder. */
const PARK_ANGLE = (-80 * Math.PI) / 180;
const PARK_ROT = 10;
/** ...except on the sun: there is no ground to land on, so the rocket
    holds a slow orbit just above the surface, engine idling. */
const SUN_ORBIT_PERIOD = 46;
const SUN_ORBIT_STANDOFF = 1.05;
const SUN_ORBIT_FLAME = 0.45;

interface RocketFlight {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  toId: string;
  fromRot: number;
  startAt: number;
  dur: number;
}

/** What the info panel's "grow this family" section offers for a body. */
interface AddMenuInfo {
  canAdd: boolean;
  actionLabel?: string;
  fullNote?: string;
}

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutCubicFn = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
/** Shortest-path angle interpolation (degrees). */
const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
};

/** "One year: ~12 min" — orbit periods read better as minutes. */
const fmtPeriod = (s: number) =>
  s >= 120 ? `~${Math.round(s / 60)} min` : `~${Math.round(s)} s`;

/** Hand-lettered labels for the six orbit families. */
const ORBIT_KIND_LABELS: Record<OrbitShapeKind, string> = {
  ring: "Gently wobbly ring",
  egg: "Egg",
  bean: "Bean",
  peanut: "Peanut",
  tilt: "Tilted ellipse",
  wobble: "Extra wobbly",
};

/** Total moon count including nested mini-moons (for the crash context). */
const countMoons = (ms: GeneratedMoon[]): number =>
  ms.reduce((n, m) => n + 1 + countMoons(m.moons), 0);

/**
 * The Galaxy Generator: every seed assembles a brand-new solar-system-like
 * world from the sprite pool — a random sun, random planets on asymmetric
 * hand-drawn orbits, 0–2 moons each, and a few drifting friends.
 */
/** Apparent on-screen speed the study aims for at any zoom level (px/s). */
const MOTION_TARGET_PX_PER_SEC = 26;

export function GeneratorSystem() {
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Body the camera is currently locked onto (navigator "you are here"). */
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /** Navigator "find me": dashed ring + single hop. */
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [jumpId, setJumpId] = useState<string | null>(null);
  /** Body the hero rocket is parked on (always starts on the sun). */
  const [rocketHostId, setRocketHostId] = useState<string>("sun");
  /** Navigator move mode: the next sun/planet pick is the destination. */
  const [rocketArmed, setRocketArmed] = useState(false);
  /** Live flight, or null while parked. */
  const [flight, setFlight] = useState<RocketFlight | null>(null);
  /** Destination wearing a steady golden ring while the rocket flies. */
  const [rocketInboundId, setRocketInboundId] = useState<string | null>(null);
  const [landingSquash, setLandingSquash] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  /** Post-landing invite: a "Chat with <host>?" bubble over the rocket. */
  const [chatSuggestionId, setChatSuggestionId] = useState<string | null>(null);
  /** The open conversation's partner in chat mode: fixed when chat opens,
      switched only via the post-landing suggestion — the rocket landing
      elsewhere never hijacks the ongoing conversation. */
  const [chatTalkId, setChatTalkId] = useState<string | null>(null);
  const [bgIndex, setBgIndex] = useState(0);
  /** The generator is permanently presented as an ink-on-paper orbit study. */
  const minimal = true;
  const minimalRef = useRef(minimal);
  minimalRef.current = minimal;
  /** Runtime-grown system: once the user adds bodies by double-clicking,
      this replaces the seeded config (regenerating resets it). */
  const [extras, setExtras] = useState<SystemConfig | null>(null);
  /** Snapshot of the previous grown system, so a single "reverse" step
      can undo the last add, delete, or regenerate. */
  const [undoState, setUndoState] = useState<{
    seed: number;
    extras: SystemConfig | null;
    rocketHostId: string;
  } | null>(null);
  /** Focused body currently showing its information panel. */
  const [infoId, setInfoId] = useState<string | null>(null);
  /** Just-born body playing its pop-in animation. */
  const [newbornId, setNewbornId] = useState<string | null>(null);
  /** Bodies mid-goodbye animation, removed from the config when it ends. */
  const [departingIds, setDepartingIds] = useState<string[]>([]);
  /** Phone shrink for the rocket's fixed on-screen size — decided after
      mount so SSR and hydration render identical park positions. */
  const [rocketShrink, setRocketShrink] = useState(1);
  /** True while the old world warps out before a regenerate/count change. */
  const [warping, setWarping] = useState(false);
  /** Dice icon tumble on the "New system" button. */
  const [diceRolling, setDiceRolling] = useState(false);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [planetCount, setPlanetCount] = useState(DEFAULT_COUNT);
  const [t, setT] = useState(0);
  const [cameraFrame, setCameraFrame] = useState(0);
  /** React state updates only when zoom meaningfully changes; orbit ticks do not drive it. */
  const [viewScale, setViewScale] = useState(0.36);
  const viewScaleRef = useRef(0.36);
  const [isMobileView, setIsMobileView] = useState(false);
  /** Chat mode: the family lines up in a sky strip beside the chat panel. */
  const [chatOpen, setChatOpen] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const highlightTimer = useRef<number | undefined>(undefined);
  const jumpTimer = useRef<number | undefined>(undefined);
  const squashTimer = useRef<number | undefined>(undefined);
  /** Auto-hide for the post-landing chat invite. */
  
  /** The rocket's live render pose — mid-flight re-targets launch from
      exactly here, never a teleport back to the old host. */
  const rocketPoseRef = useRef({ x: 0, y: 0, rot: 0 });
  const newbornTimer = useRef<number | undefined>(undefined);
  const warpTimer = useRef<number | undefined>(undefined);
  const departTimer = useRef<number | undefined>(undefined);
  const diceTimer = useRef<number | undefined>(undefined);
  /** Synchronous warp guard — state lags a frame behind the click. */
  const warpingRef = useRef(false);
  /** Double-tap detection on the focused body (tap → focus, double-tap → add). */
  const lastTapRef = useRef<{ id: string; t: number } | null>(null);
  /** Live drag data — read every frame by the render loop. */
  const dragRef = useRef<{
    cur: { x: number; y: number };
    hover: string | null;
    startClient: { x: number; y: number };
    moved: boolean;
    lastX: number;
  } | null>(null);
  /** Alternates the flight arc's bend side. */
  const arcSideRef = useRef(1);
  /** Camera follow: keeps the navigator-picked body centered as it orbits. */
  const followRef = useRef<{
    id: string;
    scale: number;
    from: { x: number; y: number; scale: number };
    startAt: number;
  } | null>(null);
  const setTransformRef = useRef<((x: number, y: number, s: number, ms?: number) => void) | null>(null);
  const resetTransformRef = useRef<(() => void) | null>(null);
  const cameraRef = useRef<ReactZoomPanPinchRef | null>(null);
  /** Last camera values written through the zoom controller's synchronous
      state path. One owner updates both its model and the visible transform. */
  const camWriteRef = useRef<{ x: number; y: number; s: number } | null>(null);
  const zoomGestureRef = useRef(false);
  const relockRef = useRef(false);

  const writeCamera = (x: number, y: number, s: number) => {
    const prev = camWriteRef.current;
    if (
      prev &&
      Math.abs(prev.x - x) < 0.25 &&
      Math.abs(prev.y - y) < 0.25 &&
      Math.abs(prev.s - s) < 1e-6
    ) {
      return;
    }
    // Track how fast the camera itself is travelling (px/s, smoothed). Pinning
    // a deep node magnifies every ancestor's orbit, so this is the only honest
    // measure of how violent the view feels.
    if (prev) {
      const now = performance.now();
      const dt = Math.max(8, now - (camWriteAtRef.current || now));
      camWriteAtRef.current = now;
      const v = (Math.hypot(x - prev.x, y - prev.y) / dt) * 1000;
      camSpeedRef.current = camSpeedRef.current * 0.82 + v * 0.18;
    } else {
      camWriteAtRef.current = performance.now();
    }
    camWriteRef.current = { x, y, s };
    const controller = cameraRef.current?.instance;
    if (controller) controller.setState(s, x, y);
  };
  const camSpeedRef = useRef(0);
  const camWriteAtRef = useRef(0);

  /** Latest camera state, so a glide eases from exactly where the camera
      is now — even mid-flight from a previous pick. */
  const stateRef = useRef<{ positionX: number; positionY: number; scale: number } | null>(null);
  /** Chat column: subject + layout captured when chat opens. */
  const chatSubjectRef = useRef<{ info: ChatSubjectInfo; layout: ChatLayout } | null>(null);
  /** The star the fan is currently lined up around — starts as the chat
      subject, but zooming into any family member re-fans around it. */
  const fanSubjectRef = useRef<{ id: string; layout: ChatLayout } | null>(null);
  /** While true the chat camera glides to the fan framing; a user
      wheel/pinch after the fan settles hands the zoom over. */
  const chatGlideRef = useRef(false);
  /** 0 = orbits, 1 = column — ramps while chat opens and closes. */
  const chatMixRef = useRef(0);
  /** Per-body rendered pose while the fan forms and dissolves (subject). */
  const chatRenderRef = useRef(new Map<string, ChatChaseState>());
  /** Polar chase state for chat children riding their morphing rings. */
  const chatRideRef = useRef(new Map<string, ChatRideState>());
  /** Per-body ring scale while the orbits rearrange into the fan. */
  const ringScaleRef = useRef(new Map<string, number>());
  /** Camera state captured when chat opens, glided back to on close. */
  const preChatCamRef = useRef<{ positionX: number; positionY: number; scale: number } | null>(null);
  /** The body chat was opened for (focus itself clears when chat opens). */
  const chatFocusRef = useRef<string | null>(null);
  /** The sky strip container — the chat camera frames inside it. */
  const stripRef = useRef<HTMLDivElement>(null);

  const baseConfig = useMemo(() => generateSystem(seed, planetCount), [seed, planetCount]);
  const deepSystem = useMemo(() => createDeepSystem(baseConfig), [baseConfig]);
  const [showDeepSystem, setShowDeepSystem] = useState(true);

  // Warm every sprite and sky in the background right after mount, so a later
  // "New system" warp or palette switch never waits on image loads.
  // Phones skip the full-pool warm: force-decoding ~50 large images at
  // once spikes memory hard enough to kill a mobile tab. Rendered sprites
  // load via their <img> tags; the warp still pre-decodes exactly the
  // next system's sprites via ensureSpritesReady.
  useEffect(() => {
    if (window.innerWidth < 640) return;
    warmSpritePool(BACKGROUNDS.map((b) => b.src));
  }, []);

  // Phones open each system with the whole world in view instead of a
  // 0.36x close-up (SSR keeps the desktop default; re-runs after a warp
  // because the remounted camera resets to initialScale).
  useEffect(() => {
    if (window.innerWidth >= 640) return;
    setRocketShrink(0.72);
    const s = Math.max(0.12, Math.min(0.36, (window.innerWidth / WORLD) * 1.02));
    setTransformRef.current?.(
      (window.innerWidth - WORLD * s) / 2,
      (window.innerHeight - WORLD * s) / 2,
      s,
      0,
    );
  }, [seed, planetCount]);
  const config = extras ?? (showDeepSystem ? deepSystem.config : baseConfig);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobileView(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /** Stable family metadata for arbitrary recursive moon depth. */
  const bodyMeta = useMemo(() => {
    const map = new Map<string, { depth: number; parentId: string | null; size: number }>();
    map.set(config.sun.id, { depth: 0, parentId: null, size: config.sun.size });
    const addMoons = (moons: GeneratedMoon[], parentId: string, depth: number) => {
      for (const moon of moons) {
        map.set(moon.id, { depth, parentId, size: moon.size });
        addMoons(moon.moons, moon.id, depth + 1);
      }
    };
    for (const planet of config.planets) {
      map.set(planet.id, { depth: 1, parentId: config.sun.id, size: planet.size });
      addMoons(planet.moons, planet.id, 2);
    }
    return map;
  }, [config]);

  const focusForVisibility = focusedId ?? chatTalkId ?? config.sun.id;
  const focusDepth = bodyMeta.get(focusForVisibility)?.depth ?? 0;
  const familyDistance = (fromId: string, toId: string) => {
    const chain = (id: string) => {
      const result = new Map<string, number>();
      let current: string | null = id;
      let hops = 0;
      while (current) {
        result.set(current, hops++);
        current = bodyMeta.get(current)?.parentId ?? null;
      }
      return result;
    };
    const from = chain(fromId);
    let current: string | null = toId;
    let hops = 0;
    while (current) {
      const shared = from.get(current);
      if (shared !== undefined) return shared + hops;
      current = bodyMeta.get(current)?.parentId ?? null;
      hops += 1;
    }
    return Number.POSITIVE_INFINITY;
  };
  const protectedBodies = new Set([
    focusForVisibility,
    rocketHostId,
    ...(chatOpen && chatTalkId ? [chatTalkId] : []),
    ...(flight ? [flight.toId] : []),
    ...(rocketInboundId ? [rocketInboundId] : []),
  ]);
  const visibilityFor = (id: string, renderedSize?: number): SemanticVisibility => {
    if (chatActive && fanSubjectRef.current?.layout.slots.has(id)) {
      return { detail: "full", opacity: 1, scale: 1, labelOpacity: 1, ringOpacity: 1, interactive: true };
    }
    const meta = bodyMeta.get(id);
    if (!meta) return { detail: "full", opacity: 1, scale: 1, labelOpacity: 1, ringOpacity: 1, interactive: true };
    const v = semanticVisibility({
      depth: meta.depth,
      focusDepth,
      apparentSize: (renderedSize ?? meta.size) * viewScale,
      familyDistance: familyDistance(focusForVisibility, id),
      protected: protectedBodies.has(id),
      mobile: isMobileView,
      generationWindow: chatActive ? 5 : 3,
    });
    // Minimalist Mode reads as two clear registers: the focused family in
    // full ink, everything else as a faint trace — no muddy middle greys.
    if (minimal && v.detail !== "hidden") {
      const near = familyDistance(focusForVisibility, id) <= 1 || protectedBodies.has(id);
      return near
        ? { ...v, opacity: v.opacity >= 0.5 ? 1 : v.opacity, ringOpacity: Math.max(v.ringOpacity, 0.85) }
        : { ...v, opacity: Math.min(v.opacity, 0.18), ringOpacity: Math.min(v.ringOpacity, 0.1), labelOpacity: 0 };
    }
    return v;
  };
  /** A parent's own route belongs to the previous family view. Keep the
      parent body as epic context, but quiet that enclosing orbit so the
      selected body's local rings remain the clearest geometry. */
  const localRingOpacity = (id: string, opacity: number) => {
    const depth = bodyMeta.get(id)?.depth ?? focusDepth;
    if (depth >= focusDepth) return opacity;
    return opacity * (depth === focusDepth - 1 ? 0.24 : 0.08);
  };
  /** At tiny descendant scale, motion adds no useful information and every
      sub-pixel orbit becomes magnified. Hold the whole family tableau still
      while deeply focused; time resumes continuously when focus is released. */
  const freezeDeepMotionRef = useRef(false);
  // Minimalist mode keeps moving at every depth: its zoom-relative clock keeps
  // apparent speed steady, so deep focus no longer magnifies jitter.
  freezeDeepMotionRef.current = !minimal && !chatOpen && focusedId !== null && focusDepth >= 6;

  // Flight recorder: keep the last-known world state in the heartbeat, so a
  // killed phone tab still tells us which system it was showing.
  useEffect(() => {
    setCrashContext({
      system: `gen:${seed}/${planetCount}${extras ? "+grown" : ""}`,
      bodies:
        1 +
        config.planets.length +
        config.planets.reduce((n, p) => n + countMoons(p.moons), 0) +
        config.drifters.length,
      bg: bgIndex,
      chat: chatOpen ? "open" : "closed",
    });
  }, [config, seed, planetCount, extras, bgIndex, chatOpen]);

  useEffect(() => {
    let raf = 0;
    let lastNow = performance.now();
    let elapsed = 0;
    let rate = 1;
    // Phones get a 30fps clock — the ultra-slow orbits look identical and
    // the main thread does half the React work.
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    let lastSet = 0;
    const loop = (now: number) => {
      const dt = Math.min(50, now - lastNow);
      lastNow = now;
      // Ease the clock rate towards the zoom-relative target so changing zoom
      // or focus never snaps the phase of an orbit.
      let want = desiredMotionRateRef.current;
      // Closed loop: the camera itself must never travel faster than the
      // target apparent speed. When a deep node is pinned, its ancestors'
      // orbits are magnified by the scale and would sling the view around.
      if (minimalRef.current) {
        const v = camSpeedRef.current;
        if (v > 1) {
          const correction = Math.max(0.2, Math.min(3, MOTION_TARGET_PX_PER_SEC / v));
          want = Math.max(0.0005, Math.min(want, rate * correction));
        }
      }
      rate += (want - rate) * Math.min(1, dt / 420);
      if (!freezeDeepMotionRef.current) elapsed += dt * rate;
      if (!mobile || now - lastSet >= 33) {
        lastSet = now;
        if (freezeDeepMotionRef.current) setCameraFrame((frame) => frame + 1);
        else setT(elapsed / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // No orphaned timers after the page unmounts.
  useEffect(
    () => () => {
      window.clearTimeout(warpTimer.current);
      window.clearTimeout(departTimer.current);
      window.clearTimeout(diceTimer.current);
    },
    [],
  );

  useEffect(() => {
    const savedBg = Number(window.localStorage.getItem("galaxy-bg"));
    if (Number.isInteger(savedBg) && savedBg >= 0 && savedBg < BACKGROUNDS.length) {
      setBgIndex(savedBg);
    }
    const savedSeed = Number(window.localStorage.getItem("galaxy-gen-seed"));
    if (Number.isInteger(savedSeed) && savedSeed > 0) setSeed(savedSeed);
    const savedCount = Number(window.localStorage.getItem("galaxy-gen-count"));
    if (
      Number.isInteger(savedCount) &&
      savedCount >= MIN_PLANETS &&
      savedCount <= MAX_PLANETS
    ) {
      setPlanetCount(savedCount);
    }
  }, []);

  const cycleBg = useCallback(() => {
    setBgIndex((i) => {
      const next = (i + 1) % BACKGROUNDS.length;
      window.localStorage.setItem("galaxy-bg", String(next));
      return next;
    });
  }, []);

  /**
   * Prepare the incoming artwork while the current world remains fully
   * visible. Only once it is paint-ready do we play the exit and swap on its
   * final frame. This avoids a blank hold when decoding takes longer than the
   * exit animation. Extra clicks are ignored until the full beat finishes.
   */
  const warpTo = (apply: () => void, ready: Promise<unknown> = Promise.resolve()) => {
    if (warpingRef.current) return;
    warpingRef.current = true;
    window.clearTimeout(warpTimer.current);
    void ready.then(() => {
      setWarping(true);
      warpTimer.current = window.setTimeout(() => {
        apply();
        warpingRef.current = false;
        setWarping(false);
      }, 360);
    });
  };

  /** Shared reset for a brand-new system (regenerate or count change). */
  const resetForNewSystem = () => {
    setActiveId(null);
    setHighlightId(null);
    setFocusedId(null);
    setExtras(null);
    setShowDeepSystem(false);
    setInfoId(null);
    setNewbornId(null);
    window.clearTimeout(departTimer.current);
    setDepartingIds([]);
    lastTapRef.current = null;
    followRef.current = null;
    // A new world ends any chat — the old family is gone.
    setChatOpen(false);
    setChatTalkId(null);
    chatSubjectRef.current = null;
    fanSubjectRef.current = null;
    chatGlideRef.current = false;
    chatRenderRef.current.clear();
    chatRideRef.current.clear();
    ringScaleRef.current.clear();
    chatMixRef.current = 0;
    preChatCamRef.current = null;
    chatFocusRef.current = null;
    // The rocket always starts parked on the new sun.
    setRocketHostId("sun");
    setRocketArmed(false);
    setFlight(null);
    setRocketInboundId(null);
    setDragActive(false);
    dragRef.current = null;
    setChatSuggestionId(null);
  };

  const captureUndo = () => {
    setUndoState({ seed, extras, rocketHostId: rocketHostId ?? config.sun.id });
  };

  const restoreUndo = () => {
    if (!undoState) return;
    setSeed(undoState.seed);
    setExtras(undoState.extras);
    setRocketHostId(undoState.rocketHostId);
    setUndoState(null);
    // Clear any transient action states so the restored world doesn't carry
    // half-finished animations or stale panels.
    setInfoId(null);
    setDepartingIds([]);
    setNewbornId(null);
    setFlight(null);
    setRocketInboundId(null);
  };

  const regenerate = () => {
    // Tumble the dice right away so the click feels instant.
    setDiceRolling(true);
    window.clearTimeout(diceTimer.current);
    diceTimer.current = window.setTimeout(() => setDiceRolling(false), 650);
    const next = Math.floor(Math.random() * 1_000_000_000) + 1;
    recordCrashEvent("warp", { reason: "regenerate", seed: next, planetCount });
    // Pre-decode the next system's art while the old one warps out.
    const ready = ensureSpritesReady(
      collectSystemSpriteUrls(generateSystem(next, planetCount)),
    );
    warpTo(() => {
      window.localStorage.setItem("galaxy-gen-seed", String(next));
      captureUndo();
      setSeed(next);
      resetForNewSystem();
    }, ready);
  };


  /** Any manual camera move takes control back from the follow mode. */
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const stopFollow = useCallback(() => {
    followRef.current = null;
    // In chat mode the focus marker belongs to the fan — zooming around
    // must not drop it (or the open info panel).
    if (chatMixRef.current > 0.004) return;
    setFocusedId(null);
    setInfoId(null);
  }, []);

  /** Wheel/pinch/zoom-button: in chat mode the user takes the zoom over
      from the fan's camera glide once the fan has settled. In galaxy mode,
      zooming keeps the selected-body follow lock; only panning releases it.
      Otherwise a tiny deep moon immediately sweeps across the viewport at
      high scale and reads as violent camera shake. */
  const beginUserZoom = () => {
    if (chatMixRef.current > 0.9) chatGlideRef.current = false;
    zoomGestureRef.current = true;
    relockRef.current = true;
  };

  const endUserZoom = () => {
    zoomGestureRef.current = false;
  };

  const chatUserZoom = () => {
    beginUserZoom();
    requestAnimationFrame(endUserZoom);
  };

  /** Toolbar zoom uses the same camera writer as focus tracking. The library's
      convenience zoom methods were immediately overwritten by the follow loop. */
  const nudgeCameraZoom = (factor: number, anchor?: { x: number; y: number }) => {
    const st = stateRef.current;
    if (!st) return;
    const nextScale = Math.max(0.002, Math.min(minimal ? 2000 : 96, st.scale * factor));
    const focused = followRef.current;
    const point = focused ? bodyPos(focused.id) : null;
    // Focused: keep the node centered. Free: keep the point under the cursor.
    const sx = point ? window.innerWidth / 2 : anchor?.x ?? window.innerWidth / 2;
    const sy = point ? window.innerHeight / 2 : anchor?.y ?? window.innerHeight / 2;
    const worldX = point?.x ?? (sx - st.positionX) / st.scale;
    const worldY = point?.y ?? (sy - st.positionY) / st.scale;
    if (focused) {
      focused.scale = nextScale;
      focused.from = { x: sx - worldX * nextScale, y: sy - worldY * nextScale, scale: nextScale };
    }
    const nx = sx - worldX * nextScale;
    const ny = sy - worldY * nextScale;
    // The follow loop reads the live scale from these refs each frame; if they
    // still held the old scale the button's zoom was reverted on the next tick.
    viewScaleRef.current = nextScale;
    stateRef.current = { positionX: nx, positionY: ny, scale: nextScale };
    writeCamera(nx, ny, nextScale);
    setViewScale((current) =>
      Math.abs(current - nextScale) > Math.max(0.018, current * 0.055) ? nextScale : current,
    );
  };
  const nudgeRef = useRef(nudgeCameraZoom);
  nudgeRef.current = nudgeCameraZoom;
  // The zoom library's wheel step is additive, so at deep scales a wheel
  // tick barely moved. Minimalist wheel zoom is multiplicative per tick.
  useEffect(() => {
    if (!minimal) return;
    const onWheel = (e: WheelEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.(".react-transform-wrapper")) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const factor = Math.exp(-Math.max(-240, Math.min(240, dy)) * 0.0022);
      nudgeRef.current(factor, { x: e.clientX, y: e.clientY });
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, [minimal]);


  /** Open chat mode: the rocket decides who we chat with. A zoomed body
      summons the rocket over first; with nothing zoomed we chat with the
      body the rocket is parked on (or flying to). The subject anchors the
      bottom of the strip and its children line up above it. */
  const openChat = (subjectOverride?: string) => {
    if (chatOpen) return;
    const rocketAt = flight ? flight.toId : rocketHostId;
    const subjectId = subjectOverride ?? focusedId ?? rocketAt;
    chatFocusRef.current = subjectId;
    stopFollow();
    // The fan's focus marker starts on the chat subject.
    setFocusedId(subjectId);
    setRocketArmed(false);
    setChatSuggestionId(null);
    // The conversation opens with the subject the rocket flies to.
    setChatTalkId(subjectId);
    const st = stateRef.current;
    preChatCamRef.current = st
      ? { positionX: st.positionX, positionY: st.positionY, scale: st.scale }
      : null;
    chatSubjectRef.current = null;
    fanSubjectRef.current = null;
    chatGlideRef.current = true;
    chatRenderRef.current.clear();
    chatRideRef.current.clear();
    ringScaleRef.current.clear();
    setChatOpen(true);
    // Summon the rocket to the chat subject — it carries the conversation.
    if (subjectId !== rocketAt) summonRocketTo(subjectId);
    recordCrashEvent("chat-open", { focused: subjectId });
  };

  const closeChat = () => {
    if (!chatOpen) return;
    setChatOpen(false);
    setChatTalkId(null);
    recordCrashEvent("chat-close", {});
  };

  // Minimalist Mode: one shared orientation per system, every planet ring a
  // scaled copy about the nucleus, plus a confident enclosing boundary.
  const nestedOrbits = useMemo(() => {
    const shape = makeStudyShape(seed, 0.42);
    const m = new Map<string, OrbitShape>();
    const ps = [...config.planets].sort((a, b) => a.orbit.maxR - b.orbit.maxR);
    const n = ps.length;
    // Boundary reach: the outermost planet plus its family, with a margin.
    const outerP = ps[n - 1];
    const reach = outerP ? outerP.orbit.maxR + outerP.moons.reduce((a, mm) => Math.max(a, mm.orbitR * 1.5 + mm.size), outerP.size * 0.5) : 600;
    // Scale R so the boundary's *near* side still clears the outer family.
    const R = reach * 1.14;
    const innerR = Math.max(config.sun.size * 0.95, R * 0.15);
    ps.forEach((p, i) => {
      // Keep the inner rings legible without leaving the outer half empty.
      const u = (i + 0.75) / (n + 0.35);
      const f = 0.06 + 0.9 * Math.pow(u, 0.82);
      m.set(p.id, makeStudyOrbit(shape, R, innerR, f));
    });
    return Object.assign(m, { boundary: studyPath(shape, R), shape, radius: R });
  }, [config.planets, config.sun.size, seed]);

  /** Fit the complete Minimalist study, whose eccentric boundary can extend
      well beyond the storybook world's default reset scale. */
  const fitMinimalSystem = () => {
    const viewportW = stripRef.current?.clientWidth ?? window.innerWidth;
    const viewportH = stripRef.current?.clientHeight ?? window.innerHeight;
    const b = nestedOrbits.shape.bounds;
    const studyW = (b.maxX - b.minX) * nestedOrbits.radius;
    const studyH = (b.maxY - b.minY) * nestedOrbits.radius;
    const s = Math.max(
      0.002,
      Math.min(0.42, Math.min((viewportW * 0.82) / studyW, (viewportH * 0.82) / studyH)),
    );
    const visualCx = CENTER + ((b.minX + b.maxX) / 2) * nestedOrbits.radius;
    const visualCy = CENTER + ((b.minY + b.maxY) / 2) * nestedOrbits.radius;
    followRef.current = null;
    setFocusedId(null);
    setInfoId(null);
    writeCamera(viewportW / 2 - visualCx * s, viewportH / 2 - visualCy * s, s);
  };

  /** Deeper contours vary between eggs and soft boxes, deterministically. */
  const moonStudyShape = (id: string) => {
    let hash = seed ^ 0x7f4a7c15;
    for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
    const variant = Math.abs(hash) % 5;
    // Diversity comes only from smooth eccentricity and rotation. Keeping the
    // contour radially convex prevents the inward dents created by superellipses.
    const eccentricity = variant === 0 ? 0.5 : variant === 1 ? 0.42 : variant === 2 ? 0.34 : variant === 3 ? 0.28 : 0.22;
    return makeStudyShape(hash, eccentricity);
  };

  /**
   * Minimalist proportion system (presentation-only, recursive):
   * - Every family owns a "reach" B: the radius of its ink boundary.
   * - Sibling rings are scaled copies of the parent's contour, so they are
   *   perfectly nested and never cross.
   * - Rings sit on an even ladder between an inner margin (breathing room
   *   around the parent bead) and an outer margin (space before the boundary).
   * - A child's own family reach is derived from the narrowest free gap
   *   around its ring, so miniatures always fit between neighbouring rings
   *   and shrink by a consistent ratio every generation.
   */
  const minimalLayout = useMemo(() => {
    const ring = new Map<string, number>();
    const reach = new Map<string, number>();
    const shapeOf = new Map<string, StudyShape>();
    const INNER = 0.36;
    const OUTER = 0.8;
    const FILL = 0.82; // share of the free gap (as radius) a miniature may occupy
    const minUnit = (e: number) => (1 - e) * 0.95;
    const maxUnit = (e: number) => (1 + e) * 1.05;
    const eccOf = (id: string) => {
      let hash = seed ^ 0x7f4a7c15;
      for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
      const v = Math.abs(hash) % 5;
      return v === 0 ? 0.5 : v === 1 ? 0.42 : v === 2 ? 0.34 : v === 3 ? 0.28 : 0.22;
    };
    // Family scale stays anchored to the generated sizes (so zoom depth and
    // rendering precision are unchanged); only the arrangement is regularised.
    const naturalReach = (b: { moons: GeneratedMoon[] }) =>
      b.moons.reduce((a, c) => Math.max(a, c.orbitR * 1.12 + c.size * 0.65), 0) * 1.16;
    const layFamily = (parentId: string, B: number, kids: GeneratedMoon[]) => {
      reach.set(parentId, B);
      if (kids.length === 0) return;
      const shape = moonStudyShape(parentId);
      const eP = eccOf(parentId);
      const sorted = [...kids].sort((a, b) => a.orbitR - b.orbitR);
      const k = sorted.length;
      const fs = sorted.map((_, i) => (k === 1 ? (INNER + OUTER) / 2 : INNER + ((OUTER - INNER) * i) / (k - 1)));
      sorted.forEach((c, i) => {
        const f = fs[i]!;
        const inner = i === 0 ? f : f - fs[i - 1]!;
        const outer = i === k - 1 ? 1 - f : fs[i + 1]! - f;
        // The miniature must sit inside the free band around its ring (never
        // crossing a sibling ring or the parent boundary), with a floor so
        // deep lineages keep a steady ~0.4 generational ratio.
        const gap = Math.min(inner, outer) * B * minUnit(eP);
        const fit = (gap * FILL) / maxUnit(eccOf(c.id));
        ring.set(c.id, f * B);
        shapeOf.set(c.id, shape);
        layFamily(c.id, Math.min(naturalReach(c), Math.max(fit, B * 0.4)), c.moons);
      });
    };
    const ps = [...config.planets].sort((a, b) => a.orbit.maxR - b.orbit.maxR);
    const R = nestedOrbits.radius;
    const innerR = Math.max(config.sun.size * 0.95, R * 0.15);
    const n = ps.length;
    const base = ps.map((_, i) => {
      const u = (i + 0.75) / (n + 0.35);
      const f = 0.06 + 0.9 * Math.pow(u, 0.82);
      return (1 - f) * innerR + f * R;
    });
    ps.forEach((p, i) => {
      const inner = i === 0 ? base[0]! * 0.6 : base[i]! - base[i - 1]!;
      const outer = i === n - 1 ? R - base[i]! : base[i + 1]! - base[i]!;
      const gap = Math.min(inner, outer) * minUnit(0.42);
      void gap; layFamily(p.id, naturalReach(p), p.moons);
    });
    return { ring, reach, shapeOf };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, seed, nestedOrbits]);

  /** Moon offset from its parent follows the parent's nested contour. */
  const moonOff = (m: GeneratedMoon, a: number) => {
    const shape = minimalLayout.shapeOf.get(m.id);
    const r = minimal && shape ? (minimalLayout.ring.get(m.id) ?? m.orbitR) * shape.unit(a) : m.orbitR;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  };
  const minimalRingPath = (m: GeneratedMoon) =>
    studyPath(minimalLayout.shapeOf.get(m.id) ?? moonStudyShape(m.id), minimalLayout.ring.get(m.id) ?? m.orbitR);
  const minimalBoundaryPath = (id: string) => studyPath(moonStudyShape(id), minimalLayout.reach.get(id) ?? 0);

  /**
   * Zoom-relative motion (presentation-only): the study should read as alive
   * at every zoom level. Bodies keep their own geometry and relative periods;
   * only the shared clock rate changes, derived from how many screen pixels
   * per second the family currently in view would otherwise travel.
   */
  const familyIndex = useMemo(() => {
    const moonById = new Map<string, GeneratedMoon>();
    const kids = new Map<string, string[]>();
    const walk = (moons: GeneratedMoon[], parentId: string) => {
      kids.set(
        parentId,
        moons.map((m) => m.id),
      );
      for (const m of moons) {
        moonById.set(m.id, m);
        walk(m.moons, m.id);
      }
    };
    kids.set(config.sun.id, config.planets.map((p) => p.id));
    for (const p of config.planets) walk(p.moons, p.id);
    return { moonById, kids };
  }, [config]);

  /** Screen-space orbital speed (px/s) a body would have at clock rate 1. */
  const screenOrbitSpeed = (id: string): number | null => {
    const moon = familyIndex.moonById.get(id);
    if (moon) {
      const r = minimal ? minimalLayout.ring.get(id) ?? moon.orbitR : moon.orbitR;
      return moon.period > 0 ? (TAU * r * viewScale) / moon.period : null;
    }
    const planet = config.planets.find((p) => p.id === id);
    if (planet) {
      const shape = (minimal ? nestedOrbits.get(id) : planet.orbit) ?? planet.orbit;
      return planet.period > 0 ? (TAU * shape.maxR * viewScale) / planet.period : null;
    }
    return null;
  };

  const desiredMotionRateRef = useRef(1);
  desiredMotionRateRef.current = (() => {
    if (!minimal) return 1;
    const ids = [focusForVisibility, ...(familyIndex.kids.get(focusForVisibility) ?? [])];
    const speeds = ids
      .map(screenOrbitSpeed)
      .filter((s): s is number => typeof s === "number" && s > 0.0001)
      .sort((a, b) => a - b);
    if (speeds.length === 0) return 1;
    const median = speeds[Math.floor(speeds.length / 2)]!;
    // Wide bounds: deep zoom needs a very slow clock to hold the same apparent
    // speed, while the whole-system overview needs a fast one.
    const rate = Math.min(400, Math.max(0.01, MOTION_TARGET_PX_PER_SEC / median));
    (window as unknown as Record<string, unknown>)["__miniRate"] = { rate, median, viewScale, focus: focusForVisibility, n: speeds.length };
    return rate;
  })();

  // Orbit math: bodies advance along their own wobbly closed curves.
  const planetPos = new Map<string, { x: number; y: number }>();
  for (const p of config.planets) {
    const q = (minimal ? nestedOrbits.get(p.id) ?? p.orbit : p.orbit).pointAt(p.startAngle + (t * TAU) / p.period);
    planetPos.set(p.id, { x: CENTER + q.x, y: CENTER + q.y });
  }
  const drifterPos = new Map<string, { x: number; y: number }>();
  for (const d of config.drifters) {
    const q = d.orbit.pointAt(d.startAngle + (d.dir * t * TAU) / d.period);
    drifterPos.set(d.id, { x: CENTER + q.x, y: CENTER + q.y });
  }

  /** Navigator entries: the sun, then every planet with its moon tree. */
  const moonEntry = (m: GeneratedMoon): NavigatorEntry => ({
    id: m.id,
    name: m.name,
    img: m.img,
    moons: m.moons.length > 0 ? m.moons.map(moonEntry) : undefined,
  });
  const navItems: NavigatorEntry[] = [
    {
      id: config.sun.id,
      name: config.sun.name,
      img: config.sun.img,
      moons: config.planets.map((p) => ({
        id: p.id,
        name: p.name,
        img: p.img,
        moons: p.moons.length > 0 ? p.moons.map(moonEntry) : undefined,
      })),
    },
  ];

  /** Recursive moon position: mini-moons ride on their parent moon.
      Chat-set moons report their chased column pose, and their own
      mini-moons ride that rendered position. */
  const moonWorldPos = (
    moons: GeneratedMoon[],
    id: string,
    px: number,
    py: number,
  ): { x: number; y: number } | null => {
    for (const m of moons) {
      const a = m.startAngle + (t * TAU) / m.period;
      const r = chatPoseMoon(m, px, py, a);
      if (m.id === id) return { x: r.x, y: r.y };
      const sub = moonWorldPos(m.moons, id, r.x, r.y);
      if (sub) return sub;
    }
    return null;
  };

  /** Current world position of any navigator-listed body. */
  const bodyPos = (id: string): { x: number; y: number } | null => {
    if (id === config.sun.id) return { x: CENTER, y: CENTER };
    const pq = planetPos.get(id);
    if (pq) return pq;
    // Moons (and their own mini-moons) ride on their parent's position.
    for (const p of config.planets) {
      const base = planetPos.get(p.id)!;
      const hit = moonWorldPos(p.moons, id, base.x, base.y);
      if (hit) return hit;
    }
    return null;
  };

  /** Display size of any body (sun, planet or moon). */
  const bodySize = (id: string): number | null => {
    // While the chat fan forms, chat-set bodies render at slot size.
    const ride = chatRideRef.current.get(id);
    if (ride && chatMixRef.current > 0.004) return ride.size;
    const cr = chatRenderRef.current.get(id);
    if (cr && chatMixRef.current > 0.004) return cr.size;
    if (id === config.sun.id) return config.sun.size;
    const p = config.planets.find((pp) => pp.id === id);
    if (p) return p.size;
    const m = findMoonById(config.planets, id);
    return m ? m.size : null;
  };

  /** Five-level chat genealogy: every slot retains its actual parent. */
  const chatFamily = (rootId: string, cfg: typeof config): ChatChildInput[] => {
    const childrenOf = (id: string): Array<{ id: string; size: number; name: string; moons: GeneratedMoon[] }> => {
      if (id === cfg.sun.id) return cfg.planets;
      const planet = cfg.planets.find((candidate) => candidate.id === id);
      if (planet) return planet.moons;
      return findMoonById(cfg.planets, id)?.moons ?? [];
    };
    const result: ChatChildInput[] = [];
    // The Sun's immediate planets are the readable overview. Pulling every
    // descendant into that one strip forced all planets to become uniformly
    // tiny; selecting a planet still reveals its full five-generation line.
    if (rootId === cfg.sun.id) {
      return cfg.planets.map((planet) => ({
        id: planet.id,
        size: planet.size,
        name: planet.name,
        parentId: rootId,
        generation: 1,
      }));
    }
    const walk = (parentId: string, generation: number) => {
      if (generation > 4) return;
      for (const child of childrenOf(parentId)) {
        result.push({ id: child.id, size: child.size, name: child.name, parentId, generation });
        walk(child.id, generation + 1);
      }
    };
    walk(rootId, 1);
    return result;
  };

  // --- Chat mode: line the family up in the sky strip -------------------
  // The mix ramps 0→1 while chat opens and back when it closes; bodies in
  // the chat set chase a blend of their live orbit pose and their column
  // slot, so they glide smoothly in both directions.
  const chatMixTarget = chatOpen ? 1 : 0;
  chatMixRef.current += (chatMixTarget - chatMixRef.current) * 0.12;
  if (!chatOpen && chatMixRef.current < 0.004) {
    chatMixRef.current = 0;
    chatSubjectRef.current = null;
    fanSubjectRef.current = null;
    chatGlideRef.current = false;
    chatRenderRef.current.clear();
    chatRideRef.current.clear();
    ringScaleRef.current.clear();
    preChatCamRef.current = null;
  }
  const chatMix = chatMixRef.current;
  const chatActive = chatMix > 0.004;

  /** Current sky-strip size, with a sane fallback before first layout. */
  const stripSize = () => {
    const r = stripRef.current?.getBoundingClientRect();
    if (r && r.width > 20 && r.height > 20) return { w: r.width, h: r.height };
    if (typeof window === "undefined") return { w: 400, h: 800 };
    return { w: Math.min(460, window.innerWidth), h: window.innerHeight };
  };

  /** Subject glide: the focused body leaves its orbit for the fan base
      at the bottom of the strip (frame-guarded chase). */
  const chatAdjustSubject = (id: string, x: number, y: number, size: number) => {
    const subj = fanSubjectRef.current;
    if (!subj || chatMixRef.current <= 0.004) return { x, y, size };
    const slot = subj.layout.slots.get(id);
    if (!slot) return { x, y, size };
    const e = chatEase(chatMixRef.current);
    const r = chaseChatTarget(
      chatRenderRef.current,
      id,
      { x, y, size },
      {
        x: x + (slot.x - x) * e,
        y: y + (slot.y - y) * e,
        size: size + (slot.size - size) * e,
      },
      t,
    );
    return { x: r.x, y: r.y, size: r.size };
  };

  /** Child ride: a chat-set body travels along its own orbit ring while
      the ring morphs into its fan arc — body and ring always agree. */
  const chatRide = (
    id: string,
    cx: number,
    cy: number,
    angle: number,
    pointAt: (a: number) => { x: number; y: number },
    size: number,
  ) => {
    const subj = fanSubjectRef.current;
    const mix = chatMixRef.current;
    const q = pointAt(angle);
    const live = { x: cx + q.x, y: cy + q.y, size };
    if (!subj || mix <= 0.004) return live;
    const slot = subj.layout.slots.get(id);
    if (!slot || id === subj.layout.parentId) {
      ringScaleRef.current.delete(id);
      return live;
    }
    // Seed the ride from the ring's current scale so a body sliding out
    // of the compressed band doesn't snap out to its full orbit first.
    if (!chatRideRef.current.has(id)) {
      const rs = ringScaleRef.current.get(id);
      if (rs !== undefined) {
        chatRideRef.current.set(id, { angle, scale: rs, size, frame: t });
      }
    }
    const r = rideChatOrbit(
      chatRideRef.current,
      id,
      cx,
      cy,
      angle,
      pointAt,
      size,
      slot,
      mix,
      t,
    );
    ringScaleRef.current.set(id, r.ringScale);
    return { x: r.x, y: r.y, size: r.size };
  };

  /** Moon pose during chat: the subject moon glides to the fan base,
      chat children ride their rings, everyone else is live. */
  const chatPoseMoon = (
    m: GeneratedMoon,
    px: number,
    py: number,
    a: number,
    parentId = "",
  ) => {
    const subj = fanSubjectRef.current;
    if (subj && chatMixRef.current > 0.004) {
      if (m.id === subj.layout.parentId) {
        return chatAdjustSubject(
          m.id,
          px + moonOff(m, a).x,
          py + moonOff(m, a).y,
          m.size,
        );
      }
      if (!subj.layout.slots.has(m.id)) {
        const circ = (aa: number) => ({
          x: moonOff(m, aa).x,
          y: moonOff(m, aa).y,
        });
        // Just left the fan (the fan re-focused on another star): glide
        // home along the ring instead of snapping back onto the orbit.
        if (chatRideRef.current.has(m.id)) {
          const r = rideChatOrbitExit(
            chatRideRef.current,
            m.id,
            px,
            py,
            a,
            circ,
            m.size,
            t,
          );
          if (r.done) ringScaleRef.current.delete(m.id);
          else ringScaleRef.current.set(m.id, r.ringScale);
          return { x: r.x, y: r.y, size: r.size };
        }
        // A former fan subject glides straight back to its live pose.
        if (chatRenderRef.current.has(m.id)) {
          const live = { x: px + moonOff(m, a).x, y: py + moonOff(m, a).y, size: m.size };
          const c = chaseChatTarget(chatRenderRef.current, m.id, live, live, t);
          if (
            Math.abs(c.x - live.x) + Math.abs(c.y - live.y) < 2 &&
            Math.abs(c.size - live.size) < 1
          ) {
            chatRenderRef.current.delete(m.id);
          }
          return { x: c.x, y: c.y, size: c.size };
        }
        // Any moon not in the fan (a grandchild at any depth, or a moon
        // of an off-screen planet) keeps orbiting its parent, tightened
        // as the fan forms so it never swings under the chat panel. The
        // tightening eases in so entering this band never snaps.
        const k = 1 - 0.45 * chatEase(chatMixRef.current);
        const prev = ringScaleRef.current.get(m.id);
        const next =
          prev !== undefined && Math.abs(prev - k) > 0.008
            ? prev + (k - prev) * 0.16
            : k;
        ringScaleRef.current.set(m.id, next);
        return {
          x: px + moonOff(m, a).x * next,
          y: py + moonOff(m, a).y * next,
          size: m.size,
        };
      }
    }
    return chatRide(
      m.id,
      px,
      py,
      a,
      (aa) => moonOff(m, aa),
      m.size,
    );
  };

  // Build the subject once per opening: whatever held focus (the sun by
  // default), anchored where it is right now. chatAdjust is inert while
  // the subject is being built, so anchors read live positions.
  if (chatOpen && !chatSubjectRef.current) {
    const fid = chatFocusRef.current;
    let subject: { info: ChatSubjectInfo; layout: ChatLayout } | null = null;
    const p = fid ? config.planets.find((pp) => pp.id === fid) : undefined;
    const m = fid && !p ? findMoonById(config.planets, fid) : null;
    if (p) {
      const anchor = planetPos.get(p.id) ?? { x: CENTER, y: CENTER };
      subject = {
        info: { id: p.id, name: p.name, img: p.img, line: minimalNodeDescription(p), kindLabel: "Node" },
        layout: computeChatLayout(
          p.id,
          anchor,
          p.size,
          chatFamily(p.id, config),
          stripSize().w,
          stripSize().h,
        ),
      };
    } else if (m) {
      const anchor = bodyPos(m.id) ?? { x: CENTER, y: CENTER };
      subject = {
        info: {
          id: m.id,
          name: m.name,
          img: m.img,
          line: minimalNodeDescription(m),
          kindLabel: "Node",
        },
        layout: computeChatLayout(
          m.id,
          anchor,
          m.size,
          chatFamily(m.id, config),
          stripSize().w,
          stripSize().h,
        ),
      };
    }
    if (!subject) {
      subject = {
        info: {
          id: config.sun.id,
          name: config.sun.name,
          img: config.sun.img,
          line: minimalNodeDescription(config.sun),
          kindLabel: "Node",
        },
        layout: computeChatLayout(
          config.sun.id,
          { x: CENTER, y: CENTER },
          config.sun.size,
          chatFamily(config.sun.id, config),
          stripSize().w,
          stripSize().h,
        ),
      };
    }
    chatSubjectRef.current = subject;
    fanSubjectRef.current = { id: subject.info.id, layout: subject.layout };
  }
  const chatSubj = chatSubjectRef.current;
  const fanSubj = fanSubjectRef.current;

  // In chat mode the navigator lists only the family on screen: the
  // subject at the top with its children (and their moons) nested below.
  const chatNavItems: NavigatorEntry[] = (() => {
    // The navigator lists the family currently on screen — the fanned
    // star (which may differ from the chat subject after a re-focus).
    const id = fanSubj?.id ?? chatSubj?.info.id;
    if (!id) return navItems;
    if (id === config.sun.id) {
      return [
        {
          id: config.sun.id,
          name: config.sun.name,
          img: config.sun.img,
          moons: config.planets.map((p) => ({
            id: p.id,
            name: p.name,
            img: p.img,
            moons: p.moons.length > 0 ? p.moons.map(moonEntry) : undefined,
          })),
        },
      ];
    }
    const p = config.planets.find((pp) => pp.id === id);
    if (p) {
      return [
        {
          id: p.id,
          name: p.name,
          img: p.img,
          moons: p.moons.length > 0 ? p.moons.map(moonEntry) : undefined,
        },
      ];
    }
    const m = findMoonById(config.planets, id);
    if (m) return [moonEntry(m)];
    return navItems;
  })();

  // Planets in the chat fan render at their chased pose — the map feeds
  // moons, rings, rocket parking and hover-picking, so all of them ride
  // along into the fan. Bodies that just left the fan (it re-focused on
  // another star) glide back to their live orbits instead of snapping.
  if (fanSubj && chatActive) {
    for (const p of config.planets) {
      const inFan = fanSubj.layout.slots.has(p.id);
      const wasSubject = chatRenderRef.current.has(p.id);
      const wasRiding = chatRideRef.current.has(p.id);
      if (!inFan && !wasSubject && !wasRiding) continue;
      const q = planetPos.get(p.id);
      if (!q) continue;
      const a = p.startAngle + (t * TAU) / p.period;
      let r: { x: number; y: number; size: number };
      if (inFan && p.id === fanSubj.layout.parentId) {
        r = chatAdjustSubject(p.id, q.x, q.y, p.size);
      } else if (inFan) {
        r = chatRide(
          p.id,
          CENTER,
          CENTER,
          a,
          (minimal ? nestedOrbits.get(p.id) : p.orbit)?.pointAt ?? p.orbit.pointAt,
          p.size,
        );
      } else if (wasSubject) {
        const live = { x: q.x, y: q.y, size: p.size };
        const c = chaseChatTarget(chatRenderRef.current, p.id, live, live, t);
        if (
          Math.abs(c.x - live.x) + Math.abs(c.y - live.y) < 2 &&
          Math.abs(c.size - live.size) < 1
        ) {
          chatRenderRef.current.delete(p.id);
        }
        r = c;
      } else {
        const x = rideChatOrbitExit(
          chatRideRef.current,
          p.id,
          CENTER,
          CENTER,
          a,
          (minimal ? nestedOrbits.get(p.id) : p.orbit)?.pointAt ?? p.orbit.pointAt,
          p.size,
          t,
        );
        if (x.done) ringScaleRef.current.delete(p.id);
        else ringScaleRef.current.set(p.id, x.ringScale);
        r = x;
      }
      planetPos.set(p.id, { x: r.x, y: r.y });
    }
  }

  /** Where the parked rocket rests: for planets and moons, the host's
      upper-right shoulder; for the sun, a point on its slow orbit loop.
      The standoff matches the rocket's world-space footprint — which
      only counter-scales when zoomed IN (see rocketWorldScale). */
  const parkPos = (id: string): { x: number; y: number } | null => {
    const c = bodyPos(id);
    const s = bodySize(id);
    if (!c || !s) return null;
    const k = rocketWorldScale(stateRef.current?.scale ?? 1, rocketShrink);
    if (id === config.sun.id) {
      const r = s / 2 + ROCKET_H * SUN_ORBIT_STANDOFF * k;
      const a = PARK_ANGLE + (t * TAU) / SUN_ORBIT_PERIOD;
      return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
    }
    const r = s / 2 + ROCKET_H * 0.4 * k;
    return {
      x: c.x + r * Math.cos(PARK_ANGLE),
      y: c.y + r * Math.sin(PARK_ANGLE),
    };
  };

  /** Nose heading (deg, 0 = up) along the sun-orbit tangent right now. */
  const sunOrbitRot = () => {
    const a = PARK_ANGLE + (t * TAU) / SUN_ORBIT_PERIOD;
    return (Math.atan2(Math.cos(a), -Math.sin(a)) * 180) / Math.PI + 90;
  };

  /**
   * World-pixel radius the camera should frame for a navigator pick.
   * Only the selected body's immediate family sets the frame; semantic
   * context may still peek in, but distant descendants cannot make a tiny
   * local view mostly empty space.
   */
  const frameRadius = (id: string): number => {
    // Minimalist framing follows the proportion system: a family fills the
    // view by its boundary; a leaf keeps a calm local window around it.
    if (minimal && id !== config.sun.id) {
      const B = minimalLayout.reach.get(id);
      if (B) return B * 1.25;
    }
    if (id === config.sun.id) {
      // Every planet may have been waved goodbye — frame just the sun.
      if (config.planets.length === 0) return config.sun.size * 1.2;
      return (
        Math.max(...config.planets.map((p) => p.orbit.maxR + p.size / 2)) + 80
      );
    }
    const p = config.planets.find((pp) => pp.id === id);
    if (p) {
      const own = p.size * 1.15;
      if (p.moons.length === 0) return own;
      const moonEdge =
        Math.max(...p.moons.map((m) => m.orbitR + m.size / 2)) + p.size * 0.22;
      return Math.max(own, moonEdge);
    }
    const m = findMoonById(config.planets, id);
    if (m) {
      const own = m.size * 1.6;
      if (m.moons.length === 0) return own;
      // Frame the moon together with its own mini-moon rings.
      return Math.max(
        own,
        Math.max(...m.moons.map((c) => c.orbitR + c.size / 2)) + m.size * 0.22,
      );
    }
    return 200;
  };

  // Camera follow, chase-cam style: every frame we ease from the camera
  // state captured at click time toward the body's *current* position, so
  // the glide bends with the moving body and lands exactly on it — no
  // end-of-glide snap. After the glide the body stays pinned to center.
  useLayoutEffect(() => {
    // Chat mode owns the camera while the column is up.
    if (chatActive) return;
    const f = followRef.current;
    if (!f || !setTransformRef.current) return;
    const now = performance.now();
    if (zoomGestureRef.current) {
      camWriteRef.current = null;
      return;
    }
    // Gesture finished: ease the body back to center at the scale the user
    // just chose, starting from wherever the gesture left the camera.
    if (relockRef.current) {
      relockRef.current = false;
      const st = stateRef.current;
      const live = st?.scale ?? viewScaleRef.current ?? f.scale;
      followRef.current = {
        id: f.id,
        scale: live,
        from: st
          ? { x: st.positionX, y: st.positionY, scale: live }
          : { x: 0, y: 0, scale: live },
        startAt: now,
      };
      camWriteRef.current = null;
      return;
    }

    const q = bodyPos(f.id);
    if (!q) {
      followRef.current = null;
      return;
    }
    const p = Math.min(1, (performance.now() - f.startAt) / 900);
    if (p >= 1) {
      // The glide is over: the zoom level belongs entirely to the user from
      // here on. Re-imposing the captured scale each frame is what fought
      // the wheel gesture and made the view oscillate.
      const live = viewScaleRef.current || f.scale;
      writeCamera(
        window.innerWidth / 2 - q.x * live,
        window.innerHeight / 2 - q.y * live,
        live,
      );
      return;
    }
    // Quintic easing makes focus changes deliberate without snapping midway.
    const e = p < 0.5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2;
    const s = f.from.scale + (f.scale - f.from.scale) * e;
    const tx = window.innerWidth / 2 - q.x * s;
    const ty = window.innerHeight / 2 - q.y * s;
    writeCamera(
      f.from.x + (tx - f.from.x) * e,
      f.from.y + (ty - f.from.y) * e,
      s,
    );
  }, [t, cameraFrame, chatActive]);


  // Chat-mode camera: while chat is open the camera chases the fan
  // framing inside the sky strip; while it closes it glides back to the
  // pre-chat view. Once the fan has settled the user owns the zoom —
  // wheel/pinch can zoom IN freely, but zooming out stops at the fan
  // framing (the family stays on screen; no drifting off to other
  // stars), where the camera re-locks onto the fan.
  useEffect(() => {
    if (!chatActive) return;
    const fan = fanSubjectRef.current;
    const st = stateRef.current;
    if (!fan || !cameraRef.current || !st || zoomGestureRef.current) return;
    let target: { posX: number; posY: number; scale: number } | null = null;
    if (chatOpen) {
      const rect = stripRef.current?.getBoundingClientRect();
      if (!rect || rect.width < 20 || rect.height < 20) return;
      // The strip is still animating to its chat width (or the window
      // moved): re-solve the fan so slots and camera track it.
      if (
        Math.abs(fan.layout.stripW - rect.width) > 2 ||
        Math.abs(fan.layout.stripH - rect.height) > 2
      ) {
        rebuildChatLayout(config);
        chatGlideRef.current = true;
      }
      const lay = fan.layout;
      const settled = chatMixRef.current > 0.9;
      if (!chatGlideRef.current && settled) {
        // The user is exploring zoomed-in — the camera is theirs until
        // they come all the way back out to the fan framing.
        if (st.scale > lay.camera.scale * 1.03) return;
        chatGlideRef.current = true;
      }
      target = lay.camera;
    } else if (preChatCamRef.current) {
      const pre = preChatCamRef.current;
      target = { posX: pre.positionX, posY: pre.positionY, scale: pre.scale };
    }
    if (!target) return;
    const dx = target.posX - st.positionX;
    const dy = target.posY - st.positionY;
    const ds = target.scale - st.scale;
    if (Math.abs(dx) + Math.abs(dy) > 0.5 || Math.abs(ds) > 0.001) {
      writeCamera(
        st.positionX + dx * 0.14,
        st.positionY + dy * 0.14,
        st.scale + ds * 0.14,
      );
    } else if (chatOpen) {
      // Arrived — from here the user may zoom in; the fan waits below.
      chatGlideRef.current = false;
    }
  });

  // Flight completion: the rocket becomes parked on its destination,
  // squashes on touchdown and flashes the golden finder ring. Sun
  // arrivals don't squash — the rocket slides into its orbit loop.
  useEffect(() => {
    if (!flight) return;
    if (performance.now() < flight.startAt + flight.dur) return;
    const dest = flight.toId;
    setFlight(null);
    setRocketHostId(dest);
    setRocketInboundId(null);
    recordCrashEvent("rocket-land", { on: dest });
    setCrashContext({ rocket: `parked:${dest}` });
    if (dest !== config.sun.id) {
      setLandingSquash(true);
      window.clearTimeout(squashTimer.current);
      squashTimer.current = window.setTimeout(() => setLandingSquash(false), 600);
    }
    window.clearTimeout(highlightTimer.current);
    setHighlightId(dest);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2800);
    // Every touchdown follows the same handshake: only after the rocket has
    // arrived does it offer a chat with its new host, in either view — and
    // the offer stands until it is answered (accepted or dismissed) or the
    // rocket lands somewhere else. Arriving and re-arriving both ask.
    setChatSuggestionId(dest);
  }, [t, flight, chatOpen]);

  // If the rocket's host vanishes (regenerate / planet count changed),
  // park it back on the sun. Moons are valid hosts too.
  useEffect(() => {
    if (
      rocketHostId !== config.sun.id &&
      !config.planets.some((p) => p.id === rocketHostId) &&
      !findMoonById(config.planets, rocketHostId)
    ) {
      setRocketHostId(config.sun.id);
    }
  }, [config, rocketHostId]);

  /** Glide the camera so the body and everything orbiting it fits. */
  const focusCamera = (id: string) => {
    const q = bodyPos(id);
    if (!q) return;
    const viewport = Math.min(window.innerWidth, window.innerHeight);
    const size = bodySize(id) ?? 1;
    const familyFit = (viewport * (isMobileView ? 0.7 : 0.76)) / (2 * frameRadius(id));
    // The hero rocket is a fixed screen-space character when close. Make
    // its host read as a destination rather than a speck beneath it. Large
    // bodies naturally need less magnification; tiny descendants get more.
    const desiredBodyPx = Math.min(isMobileView ? 138 : 178, viewport * 0.23);
    const bodyFit = desiredBodyPx / size;
    const s = Math.min(Math.max(minimal ? familyFit : Math.min(familyFit, bodyFit), minimal ? 0.002 : 0.16), minimal ? 2000 : 96);
    const st = stateRef.current;
    followRef.current = {
      id,
      scale: s,
      from: st
        ? { x: st.positionX, y: st.positionY, scale: st.scale }
        : {
            x: window.innerWidth / 2 - q.x * s,
            y: window.innerHeight / 2 - q.y * s,
            scale: s,
          },
      startAt: performance.now(),
    };
    setFocusedId(id);
  };

  /**
   * Launch the rocket along a hand-drawn arc. The end point is the
   * destination's park spot recomputed every frame, so the rocket homes
   * in on its target even while that body keeps orbiting.
   */
  const launchRocket = (
    from: { x: number; y: number },
    fromRot: number,
    toId: string,
  ) => {
    const end = parkPos(toId);
    if (!end) return;
    const dist = Math.hypot(end.x - from.x, end.y - from.y);
    const dur = Math.min(3.4, Math.max(1.15, dist / 1500)) * 1000;
    arcSideRef.current *= -1;
    // Even a near-zero hop flies — dropping right on a tiny moon's park
    // spot must still land there. Guard the degenerate zero-length normal.
    const nx = dist > 1 ? -(end.y - from.y) / dist : 0;
    const ny = dist > 1 ? (end.x - from.x) / dist : -1;
    const lift = Math.min(430, Math.max(120, dist * 0.26)) * arcSideRef.current;
    setFlight({
      fx: from.x,
      fy: from.y,
      cx: (from.x + end.x) / 2 + nx * lift,
      cy: (from.y + end.y) / 2 + ny * lift,
      toId,
      fromRot,
      startAt: performance.now(),
      dur,
    });
    setRocketInboundId(toId);
    recordCrashEvent("rocket-launch", { to: toId });
    setCrashContext({ rocket: `flying->${toId}` });
  };

  /**
   * Send the rocket to a body — re-targeting smoothly even mid-flight:
   * the new arc starts from the rocket's live pose, never a teleport
   * back to the old host. Chat entry may summon it once; later chat
   * navigation changes only the family view, never the rocket's host.
   */
  const summonRocketTo = (id: string) => {
    if (dragRef.current) return;
    if (!getPanelInfo(id)) return;
    if (flight ? flight.toId === id : rocketHostId === id) return;
    const pose = rocketPoseRef.current;
    const from = flight
      ? { x: pose.x, y: pose.y }
      : (parkPos(rocketHostId) ?? { x: pose.x, y: pose.y });
    launchRocket(
      from,
      flight
        ? pose.rot
        : rocketHostId === config.sun.id
          ? sunOrbitRot()
          : PARK_ROT,
      id,
    );
  };

  /** Navigator move mode: send the rocket to the picked body — sun,
      planet or moon. */
  const handleRocketDestination = (id: string) => {
    setRocketArmed(false);
    setInfoId(null);
    if (flight ? flight.toId === id : id === rocketHostId) return;
    summonRocketTo(id);
    if (!chatOpen) focusCamera(id);
  };

  /** Client px → world px using the live pan/zoom transform. */
  const toWorld = (clientX: number, clientY: number) => {
    const st = stateRef.current;
    if (!st) return { x: clientX, y: clientY };
    return {
      x: (clientX - st.positionX) / st.scale,
      y: (clientY - st.positionY) / st.scale,
    };
  };

  /** Nearest landable body under a dragged point, if any. Moons (and
      mini-moons) count too — the minimum grab radius is zoom-aware so
      tiny bodies stay grabbable when zoomed in. */
  const pickHover = (w: { x: number; y: number }): string | null => {
    const scale = stateRef.current?.scale ?? 1;
    let best: string | null = null;
    let bestD = Infinity;
    const consider = (id: string) => {
      const c = bodyPos(id);
      const s = bodySize(id);
      if (!c || !s || !visibilityFor(id, s).interactive) return;
      const d = Math.hypot(w.x - c.x, w.y - c.y);
      if (d < Math.max((s / 2) * 1.25, 70 / scale) && d < bestD) {
        best = id;
        bestD = d;
      }
    };
    consider(config.sun.id);
    const considerMoons = (moons: GeneratedMoon[]) => {
      for (const moon of moons) {
        consider(moon.id);
        considerMoons(moon.moons);
      }
    };
    for (const p of config.planets) {
      consider(p.id);
      considerMoons(p.moons);
    }
    return best;
  };

  /**
   * Drag the rocket: a capture-phase pointerdown keeps the camera from
   * panning, then window listeners track the drag. Dropping on a body
   * flies the rocket there; dropping on empty sky flies it back home.
   */
  const onRocketDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // No rocket games while the family is lined up for chat.
    if (chatMixRef.current > 0.004) return;
    e.stopPropagation();
    e.preventDefault();
    stopFollow();
    const w = toWorld(e.clientX, e.clientY);
    dragRef.current = {
      cur: w,
      hover: null,
      startClient: { x: e.clientX, y: e.clientY },
      moved: false,
      lastX: w.x,
    };
    setDragActive(true);
    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.cur = toWorld(ev.clientX, ev.clientY);
      if (
        Math.hypot(ev.clientX - d.startClient.x, ev.clientY - d.startClient.y) >
        8
      ) {
        d.moved = true;
      }
      d.hover = pickHover(d.cur);
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const d = dragRef.current;
      dragRef.current = null;
      setDragActive(false);
      if (!d) return;
      d.cur = toWorld(ev.clientX, ev.clientY);
      const target = d.hover ?? pickHover(d.cur);
      if (target && target !== rocketHostId) {
        launchRocket(d.cur, 0, target);
        focusCamera(target);
      } else if (d.moved) {
        launchRocket(d.cur, 0, rocketHostId);
      } else if (rocketHostId !== config.sun.id) {
        // A gentle tap: a little squash hello (not while orbiting the
        // sun — there is no ground to bounce on).
        setLandingSquash(true);
        window.clearTimeout(squashTimer.current);
        squashTimer.current = window.setTimeout(
          () => setLandingSquash(false),
          600,
        );
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  /**
   * Navigator click: zoom so the body and everything orbiting it fits
   * (the sun with all planet rings, a planet with its moon rings),
   * glide there, pop its speech bubble, hop once, flash a dashed ring.
   */
  const handleNavigate = (id: string) => {
    const q = bodyPos(id);
    if (!q) return;
    recordCrashEvent("navigate", id);
    setInfoId(null);
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(jumpTimer.current);
    window.clearTimeout(highlightTimer.current);
    setActiveId(id);
    setJumpId(id);
    setHighlightId(id);
    jumpTimer.current = window.setTimeout(() => setJumpId(null), 850);
    hideTimer.current = window.setTimeout(() => setActiveId(null), 2800);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2800);
    // In chat mode the picked star becomes the fan's focus: the camera
    // glides over and its own children line up above it. The hop, ring
    // and bubble still play along the way.
    if (chatOpen) {
      setFocusedId(id);
      focusChatFan(id);
    } else {
      focusCamera(id);
    }
  };

  // Open this requested showcase already centered several levels down. The
  // complete family remains in the navigator, while the sky shows only the
  // local three-generation window around the selected moon.
  const deepShowcaseOpened = useRef(false);
  useEffect(() => {
    if (!showDeepSystem || deepShowcaseOpened.current) return;
    deepShowcaseOpened.current = true;
    const timer = window.setTimeout(() => handleNavigate("deep-moon-5"), 450);
    return () => window.clearTimeout(timer);
  }, [showDeepSystem]);

  const showDeepDemo = () => {
    setExtras(null);
    setShowDeepSystem(true);
    deepShowcaseOpened.current = true;
    window.setTimeout(() => handleNavigate(deepSystem.deepestId), 80);
  };

  /** Double-tap on the focused body: open its information panel. */
  const openInfo = (id: string) => {
    window.clearTimeout(hideTimer.current);
    setActiveId(null);
    setInfoId(id);
  };

  /** Panel child-row click: fly to that body and open its own panel. */
  const handleInfoSelect = (id: string) => {
    handleNavigate(id);
    setInfoId(id);
  };

  /**
   * Body tap with double-tap detection: a quick second tap on the body
   * that holds camera focus opens its information panel. The first tap
   * still does its usual happy jump — the panel simply replaces it.
   */
  const handleBodyTap = (id: string) => {
    const now = Date.now();
    const last = lastTapRef.current;
    lastTapRef.current = { id, t: now };
    // A quick second tap on the same body opens its page. (Focus is not
    // required: pressing the sky briefly releases focus, which used to
    // swallow every double-click.)
    if (last?.id === id && now - last.t < 500) {
      lastTapRef.current = null;
      openInfo(id);
      return;
    }
    handleNavigate(id);
  };

  /** What the info panel offers to grow for this body, if anything. */
  const getAddMenuInfo = (id: string): AddMenuInfo | null => {
    if (id === config.sun.id) {
      return config.planets.length < MAX_SYSTEM_PLANETS
        ? { canAdd: true, actionLabel: "Add a node" }
        : { canAdd: false, fullNote: "Node limit reached" };
    }
    const p = config.planets.find((pp) => pp.id === id);
    if (p) {
      return p.moons.length < MAX_MOONS_PER_BODY
        ? { canAdd: true, actionLabel: "Add a child node" }
        : { canAdd: false, fullNote: "Child-node limit reached" };
    }
    const m = findMoonById(config.planets, id);
    if (m) {
      if (m.moons.length >= MAX_MOONS_PER_BODY)
        return { canAdd: false, fullNote: "Child-node limit reached" };
      if (m.size < MIN_MOON_PARENT_SIZE)
        return { canAdd: false, fullNote: "Maximum node depth reached" };
      return { canAdd: true, actionLabel: "Add a child node" };
    }
    return null;
  };

  /**
   * Rebuild the chat column from a fresh config — used when the family
   * changes mid-chat so a newborn gets a slot (or a goodbye's gap closes)
   * and every body chases to its fresh place.
   */
  const rebuildChatLayout = (cfg: typeof config) => {
    const fan = fanSubjectRef.current;
    if (!fan) return;
    const id = fan.id;
    // The anchor captured when the fan formed stays fixed — re-anchoring
    // to the chased pose would let the whole fan drift mid-transition.
    const anchor = fan.layout.anchor;
    const strip = stripSize();
    if (id === cfg.sun.id) {
      fan.layout = computeChatLayout(
        id,
        anchor,
        cfg.sun.size,
        chatFamily(id, cfg),
        strip.w,
        strip.h,
      );
      return;
    }
    const p = cfg.planets.find((pp) => pp.id === id);
    if (p) {
      fan.layout = computeChatLayout(
        id,
        anchor,
        p.size,
        chatFamily(id, cfg),
        strip.w,
        strip.h,
      );
      return;
    }
    const m = findMoonById(cfg.planets, id);
    if (m) {
      fan.layout = computeChatLayout(
        id,
        anchor,
        m.size,
        chatFamily(id, cfg),
        strip.w,
        strip.h,
      );
    }
  };

  /**
   * Chat-mode zoom-in on a specific star: the fan re-forms around it —
   * it anchors the bottom of the strip where it stands right now and its
   * own children line up above, while the previous fan glides home.
   */
  const focusChatFan = (id: string) => {
    const anchor = bodyPos(id);
    if (!anchor) return;
    const strip = stripSize();
    let size: number;
    let kids: ChatChildInput[] = [];
    if (id === config.sun.id) {
      size = config.sun.size;
      kids = chatFamily(id, config);
    } else {
      const p = config.planets.find((pp) => pp.id === id);
      if (p) {
        size = p.size;
        kids = chatFamily(id, config);
      } else {
        const m = findMoonById(config.planets, id);
        if (!m) return;
        size = m.size;
        kids = chatFamily(id, config);
      }
    }
    fanSubjectRef.current = {
      id,
      layout: computeChatLayout(id, anchor, size, kids, strip.w, strip.h),
    };
    chatGlideRef.current = true;
  };

  // Keep the chat column in sync with the family: adding or removing a
  // body mid-chat rebuilds the lineup; if the subject itself is gone the
  // chat set dissolves back to live orbits. If the fanned star is gone,
  // the fan re-forms around the chat's root subject.
  useEffect(() => {
    if (!chatOpen) return;
    const subj = chatSubjectRef.current;
    if (!subj) return;
    const gone = (bid: string) =>
      bid !== config.sun.id &&
      !config.planets.some((pp) => pp.id === bid) &&
      !findMoonById(config.planets, bid);
    const id = subj.info.id;
    if (gone(id)) {
      chatSubjectRef.current = null;
      fanSubjectRef.current = null;
      return;
    }
    const fan = fanSubjectRef.current;
    if (fan && gone(fan.id)) {
      fanSubjectRef.current = null;
      focusChatFan(id);
      // Keep the focus marker (navigator "you are here", zoom-out pill)
      // on the star the fan re-forms around.
      setFocusedId(id);
      return;
    }
    rebuildChatLayout(config);
  }, [config, chatOpen]);

  /**
   * The panel's "grow this family" button. The panel stays open so the
   * newborn shows up in its family list right away.
   */
  const handleAddBody = () => {
    if (!infoId) return;
    const result =
      infoId === config.sun.id
        ? addPlanetToSystem(config)
        : addMoonToSystem(config, infoId);
    if (!result) return;
    recordCrashEvent("body-add", { parent: infoId, newId: result.newId });
    captureUndo();
    setExtras(result.next);
    // Newborn celebration: pop-in, a hello bubble and the golden ring.
    setNewbornId(result.newId);
    window.clearTimeout(newbornTimer.current);
    newbornTimer.current = window.setTimeout(() => setNewbornId(null), 1000);
    window.clearTimeout(hideTimer.current);
    setActiveId(result.newId);
    hideTimer.current = window.setTimeout(() => setActiveId(null), 2800);
    window.clearTimeout(highlightTimer.current);
    setHighlightId(result.newId);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2800);
  };

  /**
   * The panel's "say goodbye" button: the body (and everything orbiting
   * it) plays its spin-away goodbye first — the actual removal lands when
   * the animation ends. State pointing at the departing family is tidied
   * right away so nothing chases a ghost. The sun itself can never leave.
   */
  const handleRemoveBody = () => {
    if (!infoId || infoId === config.sun.id) return;
    if (departingIds.length > 0) return; // one goodbye at a time
    const next = removeBodyFromSystem(config, infoId);
    if (!next) return;
    const removedId = infoId;
    recordCrashEvent("body-remove", { id: removedId });
    captureUndo();
    // Every id leaving with it: the body plus its whole moon subtree.
    const ids: string[] = [];
    const collect = (ms: GeneratedMoon[]) =>
      ms.forEach((m) => {
        ids.push(m.id);
        collect(m.moons);
      });
    const rootPlanet = config.planets.find((pp) => pp.id === removedId);
    if (rootPlanet) {
      ids.push(rootPlanet.id);
      collect(rootPlanet.moons);
    } else {
      const rootMoon = findMoonById(config.planets, removedId);
      if (!rootMoon) return;
      ids.push(rootMoon.id);
      collect(rootMoon.moons);
    }
    /** True when id is the removed body or rides anywhere under it. */
    const gone = (id: string | null): boolean => !!id && ids.includes(id);
    // A rocket flying to a departing body turns back home; one parked
    // there moves back to the sun right away (never renders on a ghost).
    if (flight && gone(flight.toId)) {
      setFlight(null);
      setRocketInboundId(null);
    }
    if (gone(rocketHostId)) setRocketHostId(config.sun.id);
    if (focusedId && gone(focusedId)) {
      followRef.current = null;
      setFocusedId(null);
    }
    if (activeId && gone(activeId)) setActiveId(null);
    if (highlightId && gone(highlightId)) setHighlightId(null);
    if (jumpId && gone(jumpId)) setJumpId(null);
    if (newbornId && gone(newbornId)) setNewbornId(null);
    // Close the panel so the goodbye plays out in the world.
    setInfoId(null);
    setDepartingIds(ids);
    window.clearTimeout(departTimer.current);
    departTimer.current = window.setTimeout(() => {
      setDepartingIds([]);
      setExtras(next);
      for (const id of ids) chatRenderRef.current.delete(id);
    }, 700);
  };

  /**
   * The panel's pencil: give the body a new name. Ids stay put, so the
   * rocket, the camera and the chat fan never notice — every surface
   * (sky label, navigator, pills, chat header) reads the name live from
   * the config. Undoable like any other family change.
   */
  const handleRenameBody = (id: string, name: string) => {
    if (name === getPanelInfo(id)?.name) return;
    recordCrashEvent("body-rename", { id });
    captureUndo();
    setExtras(renameBodyInSystem(config, id, name));
  };

  const handleToggleSleep = (id: string) => {
    const body = getPanelInfo(id);
    if (!body) return;
    recordCrashEvent("body-sleep", { id, asleep: !body.asleep });
    captureUndo();
    setExtras(setBodyAsleepInSystem(config, id, !body.asleep));
  };

  /** Everything the information panel shows about a body. */
  const getPanelInfo = (id: string): BodyPanelInfo | null => {
    const add = getAddMenuInfo(id);
    if (!add) return null;
    if (id === config.sun.id) {
      return {
        id,
        name: config.sun.name,
        img: config.sun.img,
        kindLabel: "Node",
        line: minimalNodeDescription(config.sun),
        childrenLabel: "Child nodes",
        childrenCap: MAX_SYSTEM_PLANETS,
        children: config.planets.map((p) => ({
          id: p.id,
          name: p.name,
          img: p.img,
        })),
        add,
        asleep: config.sun.asleep ?? false,
      };
    }
    const p = config.planets.find((pp) => pp.id === id);
    if (p) {
      return {
        id,
        name: p.name,
        img: p.img,
        kindLabel: "Node",
        line: minimalNodeDescription(p),
        childrenLabel: "Child nodes",
        childrenCap: MAX_MOONS_PER_BODY,
        children: p.moons.map((m) => ({ id: m.id, name: m.name, img: m.img })),
        add,
        asleep: p.asleep ?? false,
      };
    }
    const m = findMoonById(config.planets, id);
    if (m) {
      return {
        id,
        name: m.name,
        img: m.img,
        kindLabel: "Node",
        line: minimalNodeDescription(m),
        childrenLabel: "Child nodes",
        childrenCap: MAX_MOONS_PER_BODY,
        children: m.moons.map((c) => ({ id: c.id, name: c.name, img: c.img })),
        add,
        asleep: m.asleep ?? false,
      };
    }
    return null;
  };

  // --- Hero rocket pose ---------------------------------------------------
  const dragNow = dragActive ? dragRef.current : null;
  const dragHoverId = dragNow?.hover ?? null;
  const dragHoverPos = dragHoverId ? bodyPos(dragHoverId) : null;

  // --- Info panel -----------------------------------------------------------
  const panelInfo = infoId ? getPanelInfo(infoId) : null;

  // --- Chat subject: the rocket decides -----------------------------------
  // Galaxy view: we chat with the star the rocket is parked on — or the
  // one it is flying to (it lands there in a moment). Chat mode: the
  // conversation stays with the star it opened on (chatTalkId); the
  // rocket landing elsewhere only OFFERS to switch via the suggestion
  // pill — it never hijacks the open conversation. Falls back to the
  // fan's root subject if the partner can't be resolved right now.
  const talkId = flight ? flight.toId : rocketHostId;
  const chatPartnerPanel =
    chatOpen && chatTalkId ? getPanelInfo(chatTalkId) : null;
  const talkPanel = chatPartnerPanel ?? getPanelInfo(talkId);
  const talkInfo: ChatSubjectInfo | null = talkPanel
    ? {
        id: talkPanel.id,
        name: talkPanel.name,
        img: talkPanel.img,
        kindLabel: talkPanel.kindLabel,
        line: talkPanel.line ?? "",
        asleep: talkPanel.asleep ?? false,
      }
    : (chatSubj?.info ?? null);

  // Post-landing invite: shared by galaxy and chat mode. It is created by
  // the touchdown effect, so it can never appear while the rocket is flying,
  // and it never expires on its own — the offer stands until answered.
  // Never suggest chatting with the star we're already chatting with — in
  // chat mode the conversation stays put when the rocket lands on a new
  // star, and this pill is the offer to switch the chat over to it.
  const suggestionInfo =
    chatSuggestionId &&
    !flight &&
    !dragActive &&
    !(chatOpen && chatSuggestionId === talkInfo?.id)
      ? getPanelInfo(chatSuggestionId)
      : null;

  // --- Summon-rocket suggestion -----------------------------------------
  // Wherever the camera is visiting — a galaxy-view zoom or a chat-mode
  // fan — if the rocket isn't parked there and isn't already flying
  // there, offer to send it over. Never suggested for the body that
  // already holds it, while dragging it, or mid navigator pick.
  const summonInfo =
    focusedId && focusedId !== talkId && !dragActive && !rocketArmed
      ? getPanelInfo(focusedId)
      : null;

  // --- Contextual hints ---------------------------------------------------
  // The current situation, told to the hint guide so tips surface when they
  // matter. Priority: the mode you're in beats what you're looking at.
  const hintContext = chatActive
    ? "chat"
    : rocketArmed
      ? "rocket-armed"
      : flight
        ? "rocket-flight"
        : infoId
          ? "storybook"
          : focusedId
            ? summonInfo
              ? "summon"
              : focusedId === talkId
                ? "at-host"
                : "focused"
            : "explore";

  // --- Zoom-out pill --------------------------------------------------------
  // The body's parent is the zoom-out landing spot: a planet's parent is
  // the sun, a moon's parent is whatever it orbits. Chat mode plays by
  // the same rule — the fan can step up past the chat's root star,
  // generation by generation, all the way to the sun, where the last
  // zoom-out is the whole sky (which also closes the conversation).
  const zoomOutTarget: ZoomOutTarget | null = (() => {
    if (!focusedId) return null;
    if (focusedId === config.sun.id) {
      return { id: "", name: "Whole sky", img: null };
    }
    if (config.planets.some((pp) => pp.id === focusedId)) {
      return { id: config.sun.id, name: config.sun.name, img: config.sun.img };
    }
    const parent = findMoonParent(config.planets, focusedId);
    if (!parent) return null;
    const parentPlanet = config.planets.find((pp) => pp.id === parent.id);
    const img = parentPlanet
      ? parentPlanet.img
      : (findMoonById(config.planets, parent.id)?.img ?? null);
    return { id: parent.id, name: parent.name, img };
  })();

  /** Zoom out one generation — the shared move behind the "visit the
      parent" pill and the chat-mode zoom-out button. From the sun the
      last step is the whole sky; in chat mode that final zoom-out also
      closes the conversation (you stepped out of the whole family). */
  const handleZoomOut = (id: string) => {
    chatUserZoom();
    if (!id) {
      // "Whole sky": glide all the way back out to the full system.
      setInfoId(null);
      followRef.current = null;
      setFocusedId(null);
      if (chatOpen) {
        // Skip the pre-chat camera restore — the whole-sky reset owns
        // the camera on the way out.
        preChatCamRef.current = null;
        closeChat();
      }
      if (minimal) fitMinimalSystem();
      else resetTransformRef.current?.();
      return;
    }
    handleNavigate(id);
  };

  let rocketX = CENTER;
  let rocketY = CENTER;
  let rocketRot = PARK_ROT;
  let rocketFlame = 0;
  if (dragNow) {
    const dx = dragNow.cur.x - dragNow.lastX;
    dragNow.lastX = dragNow.cur.x;
    rocketX = dragNow.cur.x;
    rocketY = dragNow.cur.y;
    rocketRot = Math.max(-24, Math.min(24, dx * 0.5));
    rocketFlame = 0.85;
  } else if (flight) {
    const p = Math.min(1, (performance.now() - flight.startAt) / flight.dur);
    const e = easeInOutCubicFn(p);
    const end = parkPos(flight.toId) ?? { x: CENTER, y: CENTER };
    const u = 1 - e;
    rocketX = u * u * flight.fx + 2 * u * e * flight.cx + e * e * end.x;
    rocketY = u * u * flight.fy + 2 * u * e * flight.cy + e * e * end.y;
    const vx = 2 * u * (flight.cx - flight.fx) + 2 * e * (end.x - flight.cx);
    const vy = 2 * u * (flight.cy - flight.fy) + 2 * e * (end.y - flight.cy);
    const heading = (Math.atan2(vy, vx) * 180) / Math.PI + 90;
    // Sun arrivals slide into the orbit tangent instead of standing tall.
    const toSun = flight.toId === config.sun.id;
    const arriveRot = toSun ? sunOrbitRot() : PARK_ROT;
    if (p < 0.16) {
      rocketRot = lerpAngle(flight.fromRot, heading, easeOutCubic(p / 0.16));
    } else if (p > 0.76) {
      rocketRot = lerpAngle(
        heading,
        arriveRot,
        easeInOutCubicFn((p - 0.76) / 0.24),
      );
    } else {
      rocketRot = heading;
    }
    // Sun arrivals keep the engine idling — no touchdown flame-out.
    const flameFloor = toSun ? SUN_ORBIT_FLAME : 0;
    rocketFlame =
      p < 0.12
        ? p / 0.12
        : p > 0.84
          ? Math.max(flameFloor, (1 - p) / 0.16)
          : 1;
  } else {
    const pp = parkPos(rocketHostId);
    if (pp) {
      rocketX = pp.x;
      rocketY = pp.y;
    }
    if (rocketHostId === config.sun.id) {
      // Parked on the sun = slowly orbiting it, nose along the travel
      // direction, engine idling — the sun's surface is no place to land.
      rocketRot = sunOrbitRot();
      rocketFlame = SUN_ORBIT_FLAME + 0.1 * Math.sin(t * 7);
    }
  }
  // Keep the live pose reachable between frames: mid-flight re-targets
  // and the chat invite anchor read it.
  rocketPoseRef.current = { x: rocketX, y: rocketY, rot: rocketRot };

  /** Moon rings, recursively: each ring is centered on its parent's spot. */
  const renderMoonRings = (
    moons: GeneratedMoon[],
    px: number,
    py: number,
    parentId = "",
    depth = 0,
  ): ReactNode =>
    moons.map((m) => {
      const a = m.startAngle + (t * TAU) / m.period;
      // The moon's rendered pose (frame-guarded, agrees with the moon
      // bodies) so nested rings center on where it actually is — and
      // the ring breathes toward its fan-arc radius while the moon
      // rides it into the lineup.
      const pose = chatPoseMoon(m, px, py, a, parentId);
      const s = ringScaleRef.current.get(m.id) ?? 1;
      const lineScale = Math.max(1, viewScale);
      const vis = visibilityFor(m.id, pose.size);
      if (vis.detail === "hidden") {
        return (
          <Fragment key={m.id}>
            {renderMoonRings(m.moons, pose.x, pose.y, m.id, depth + 1)}
          </Fragment>
        );
      }
      return (
        <Fragment key={m.id}>
          {/* Position lives on the <g> so the path's own CSS transform
              stays free for the appear/disappear animation */}
          <g
            className="semantic-orbit"
            opacity={minimal && chatActive ? Math.min(0.16, vis.ringOpacity) : localRingOpacity(m.id, vis.ringOpacity)}
            transform={`translate(${px} ${py}) scale(${s})`}
          >
            <path
              d={minimal ? minimalRingPath(m) : m.ringD}
              fill="none"
              stroke={minimal ? "var(--mini-line)" : "white"}
              strokeOpacity={minimal ? 0.85 : 0.72}
              strokeWidth={minimal ? 1.1 / (s * Math.max(1e-4, viewScale)) : (depth === 0 ? 6.5 : 5) / (s * lineScale)}
              strokeDasharray={
                minimal ? undefined : depth === 0
                  ? `${(22 / (s * lineScale)).toFixed(1)} ${(17 / (s * lineScale)).toFixed(1)}`
                  : `${(16 / (s * lineScale)).toFixed(1)} ${(13 / (s * lineScale)).toFixed(1)}`
              }
              strokeLinecap="round"
              className={
                departingIds.includes(m.id)
                  ? "orbit-ring-out"
                  : m.id === newbornId
                    ? "orbit-ring-in"
                    : undefined
              }
            />
          </g>
          {minimal && !chatActive && m.moons.length > 0 && (
            <path
              transform={`translate(${pose.x} ${pose.y})`}
              d={minimalBoundaryPath(m.id)}
              fill="none"
              stroke="var(--mini-ink)"
              strokeWidth={2.2 / Math.max(1e-4, viewScale)}
              opacity={localRingOpacity(m.id, vis.ringOpacity)}
            />
          )}
          {renderMoonRings(m.moons, pose.x, pose.y, m.id, depth + 1)}
        </Fragment>
      );
    });

  /** Moons (and their own smaller moons) riding on their parent body. */
  const chosenId = flight ? flight.toId : rocketHostId;

  const renderMoonTree = (
    moons: GeneratedMoon[],
    px: number,
    py: number,
    parentId = "",
  ): ReactNode =>
    moons.map((m) => {
      const a = m.startAngle + (t * TAU) / m.period;
      const r = chatPoseMoon(m, px, py, a, parentId);
      const chatSized = Math.abs(r.size - m.size) > 0.5;
      const vis = visibilityFor(m.id, r.size);
      if (vis.detail === "hidden") {
        return (
          <Fragment key={m.id}>
            {renderMoonTree(m.moons, r.x, r.y, m.id)}
          </Fragment>
        );
      }
      return (
        <Fragment key={m.id}>
          <Planet
            def={chatSized ? { ...m, size: r.size } : m}
            x={r.x}
            y={r.y}
            labelBoost={fanSubj?.layout.slots.get(m.id)?.labelBoost ?? 1}
            cameraScale={viewScale}
            active={activeId === m.id}
            jumping={jumpId === m.id}
            highlighted={
              highlightId === m.id ||
              dragHoverId === m.id ||
              rocketInboundId === m.id
            }
            highlightMode={highlightId === m.id ? "flash" : "steady"}
            newborn={newbornId === m.id}
            departing={departingIds.includes(m.id)}
            visualOpacity={vis.opacity}
            visualScale={vis.scale}
            labelOpacity={vis.labelOpacity}
            interactive={vis.interactive}
            onTap={handleBodyTap}
            chosen={minimal && chosenId === m.id}
          />
          {renderMoonTree(m.moons, r.x, r.y, m.id)}
        </Fragment>
      );
    });

  return (
    <MinimalContext.Provider value={minimal}>
    <div className="minimal-ui fixed inset-0 overflow-hidden bg-mini-paper">
      <div className="flex h-full w-full">
      {/* Sky strip: the whole galaxy squeezes here when chat opens */}
      <div
        ref={stripRef}
        className={`relative h-full min-w-0 flex-none overflow-hidden transition-[width] duration-500 ease-in-out ${
          chatOpen ? "w-full sm:w-[clamp(290px,33vw,460px)]" : "w-full"
        }`}
      >
      {minimal ? <div className="pointer-events-none absolute inset-0 bg-mini-paper" /> : <img
        key={BACKGROUNDS[bgIndex]!.src}
        src={BACKGROUNDS[bgIndex]!.src}
        srcSet={`${BACKGROUNDS[bgIndex]!.srcSm} 1280w, ${BACKGROUNDS[bgIndex]!.src} 2048w`}
        sizes="100vw"
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />}
      <TransformWrapper
        ref={cameraRef}
        key={`${seed}-${planetCount}`}
        initialScale={0.36}
        minScale={chatOpen && fanSubj ? Math.min(fanSubj.layout.camera.scale, 0.002) : 0.002}
        maxScale={minimal ? 2000 : 96}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        // `smooth` mode multiplies this by the wheel delta. Keeping the old
        // 0.15 here made a single trackpad flick jump dozens of zoom levels,
        // where the moving deep-family camera looked like a continuous shake.
        wheel={{ step: 0.0015, disabled: minimal }}
        panning={{ velocityDisabled: true, disabled: dragActive || chatActive }}
        // Release focus only once the press really moves: a plain tap or
        // double-click on a star must not unfocus it (that hid deep stars
        // mid-click and swallowed every double-click).
        onPanningStart={(_, e) => {
          const pt = "touches" in e ? e.touches[0] : e;
          panStartRef.current = pt ? { x: pt.clientX, y: pt.clientY } : null;
        }}
        onPanning={(_, e) => {
          const st = panStartRef.current;
          const pt = "touches" in e ? e.touches[0] : e;
          if (!st || !pt) return;
          if (Math.hypot(pt.clientX - st.x, pt.clientY - st.y) > 8) {
            panStartRef.current = null;
            stopFollow();
          }
        }}
        // Wheel/pinch preserve the focused body's follow lock. Panning is the
        // explicit gesture for releasing it and exploring freely.
        onWheelStart={beginUserZoom}
        onWheelStop={endUserZoom}
        onPinchStart={beginUserZoom}
        onPinchStop={endUserZoom}
        onTransform={(_, next) => {
          stateRef.current = { ...next };
          camWriteRef.current = { x: next.positionX, y: next.positionY, s: next.scale };
          viewScaleRef.current = next.scale;
          setViewScale((current) => Math.abs(current - next.scale) > Math.max(0.018, current * 0.055) ? next.scale : current);
        }}
      >
        {({ resetTransform, setTransform, state }) => {
          setTransformRef.current = setTransform;
          resetTransformRef.current = resetTransform;
          stateRef.current = state;
          return (
          <>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
              <div
                className={`relative ${warping ? "system-exit" : "system-enter"}`}
                style={{ width: WORLD, height: WORLD }}
              >
                {/* Twinkling stars and comets — dimmed in chat mode so the
                    family strip stays the star of the show. */}
                {!minimal && <Starfield size={WORLD} chatMix={chatMix} />}

                {/* Hand-drawn orbit rings — every planet's ring is a
                    different asymmetric closed curve */}
                <svg
                  width={WORLD}
                  height={WORLD}
                  viewBox={`0 0 ${WORLD} ${WORLD}`}
                  className="pointer-events-none absolute inset-0"
                  style={{ overflow: "visible" }}
                  aria-hidden
                >
                  {config.planets.map((p) => {
                    // In chat mode each ring breathes toward its fan-arc
                    // radius, carrying its planet along with it.
                    const s = ringScaleRef.current.get(p.id) ?? 1;
                    const lineScale = Math.max(1, viewScale);
                    const vis = visibilityFor(p.id);
                    if (vis.detail === "hidden") return null;
                    return (
                      <g
                        key={p.id}
                        className="semantic-orbit"
                        opacity={minimal && chatActive ? Math.min(0.16, vis.ringOpacity) : localRingOpacity(p.id, vis.ringOpacity)}
                        transform={`translate(${CENTER} ${CENTER}) scale(${s})`}
                      >
                        <path
                          d={minimal ? nestedOrbits.get(p.id)?.d ?? p.orbit.d : p.orbit.d}
                          fill="none"
                          stroke={minimal ? "var(--mini-line)" : "white"}
                          strokeOpacity={minimal ? 0.9 : p.ringOpacity}
                          strokeWidth={minimal ? 1.3 / (s * Math.max(1e-4, viewScale)) : p.ringWidth / (s * lineScale)}
                          strokeDasharray={minimal ? undefined : p.dash
                            .split(" ")
                            .map((v) => (+v / (s * lineScale)).toFixed(1))
                            .join(" ")}
                          strokeLinecap="round"
                          className={
                            departingIds.includes(p.id)
                              ? "orbit-ring-out"
                              : p.id === newbornId
                                ? "orbit-ring-in"
                                : undefined
                          }
                        />
                      </g>
                    );
                  })}
                  {/* Minimalist Mode: one confident ink boundary enclosing the system,
                      and a miniature boundary around each planet's own family */}
                  {minimal && !chatActive && (
                    <path
                      d={nestedOrbits.boundary}
                      transform={`translate(${CENTER} ${CENTER})`}
                      fill="none"
                      stroke="var(--mini-ink)"
                      strokeWidth={3 / Math.max(1e-4, viewScale)}
                    />
                  )}
                  {minimal && !chatActive && config.planets.map((p) => {
                    if (p.moons.length === 0 || visibilityFor(p.id).detail === "hidden") return null;
                    const q = planetPos.get(p.id)!;
                    return <path key={`mb-${p.id}`} transform={`translate(${q.x} ${q.y})`} d={minimalBoundaryPath(p.id)} fill="none" stroke="var(--mini-ink)" strokeWidth={2.2 / Math.max(1e-4, viewScale)} opacity={localRingOpacity(p.id, visibilityFor(p.id).ringOpacity)} />;
                  })}
                  {/* Moon rings follow their parent body — planets, and
                      moons with mini-moons of their own */}
                  {config.planets.map((p) => {
                    const q = planetPos.get(p.id)!;
                    return (
                      <Fragment key={p.id}>
                        {renderMoonRings(p.moons, q.x, q.y, p.id, 0)}
                      </Fragment>
                    );
                  })}
                </svg>

                {/* Warm glow behind the Sun */}
                {!minimal && <div
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: CENTER,
                    top: CENTER,
                    width: config.sun.size * 1.8,
                    height: config.sun.size * 1.8,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, oklch(0.9 0.16 95 / 0.4), transparent 65%)",
                  }}
                />}

                {config.drifters.map((d) => {
                  const q = drifterPos.get(d.id)!;
                  if (minimal || viewScale > 2.8 || viewScale < 0.08) return null;
                  return <Drifter key={d.id} def={d} x={q.x} y={q.y} />;
                })}

                <Planet
                  def={config.sun}
                  x={CENTER}
                  y={CENTER}
                  active={activeId === config.sun.id}
                  cameraScale={viewScale}
                  jumping={jumpId === config.sun.id}
                  newborn={newbornId === config.sun.id}
                  highlighted={
                    highlightId === config.sun.id ||
                    dragHoverId === config.sun.id ||
                    rocketInboundId === config.sun.id
                  }
                  highlightMode={
                    highlightId === config.sun.id ? "flash" : "steady"
                  }
                  visualOpacity={visibilityFor(config.sun.id).opacity}
                  visualScale={visibilityFor(config.sun.id).scale}
                  labelOpacity={visibilityFor(config.sun.id).labelOpacity}
                  interactive={visibilityFor(config.sun.id).interactive}
                  onTap={handleBodyTap}
            chosen={minimal && chosenId === config.sun.id}
                  spin
                />

                {[...config.planets]
                  .sort((a, b) => b.size - a.size)
                  .map((p) => {
                    const q = planetPos.get(p.id)!;
                    const cr =
                      chatRenderRef.current.get(p.id) ??
                      chatRideRef.current.get(p.id);
                    const chatSized = cr != null && Math.abs(cr.size - p.size) > 0.5;
                    const renderSize = chatSized && cr ? cr.size : p.size;
                    const vis = visibilityFor(p.id, renderSize);
                    if (vis.detail === "hidden") return null;
                    return (
                      <Planet
                        key={p.id}
                        def={chatSized && cr ? { ...p, size: cr.size } : p}
                        x={q.x}
                        y={q.y}
                        labelBoost={fanSubj?.layout.slots.get(p.id)?.labelBoost ?? 1}
                        cameraScale={viewScale}
                        active={activeId === p.id}
                        jumping={jumpId === p.id}
                        newborn={newbornId === p.id}
                        departing={departingIds.includes(p.id)}
                        highlighted={
                          highlightId === p.id ||
                          dragHoverId === p.id ||
                          rocketInboundId === p.id
                        }
                        highlightMode={
                          highlightId === p.id ? "flash" : "steady"
                        }
                        visualOpacity={vis.opacity}
                        visualScale={vis.scale}
                        labelOpacity={vis.labelOpacity}
                        interactive={vis.interactive}
                        onTap={handleBodyTap}
            chosen={minimal && chosenId === p.id}
                      />
                    );
                  })}

                {config.planets.map((p) => {
                  const q = planetPos.get(p.id)!;
                  return (
                    <Fragment key={p.id}>
                      {renderMoonTree(p.moons, q.x, q.y, p.id)}
                    </Fragment>
                  );
                })}

                {/* Golden tether from the dragged rocket to its target */}
                {dragNow?.hover && dragHoverPos && (
                  <svg
                    width={WORLD}
                    height={WORLD}
                    viewBox={`0 0 ${WORLD} ${WORLD}`}
                    className="pointer-events-none absolute inset-0 z-[35]"
                    aria-hidden
                  >
                    <line
                      x1={dragNow.cur.x}
                      y1={dragNow.cur.y}
                      x2={dragHoverPos.x}
                      y2={dragHoverPos.y}
                      stroke="#ffd94d"
                      strokeWidth={7}
                      strokeDasharray="26 20"
                      strokeLinecap="round"
                      opacity={0.9}
                      className="rocket-tether"
                    />
                  </svg>
                )}

                {/* Body details live in the screen-space info panel */}

                {!minimal && <HeroRocket
                  x={rocketX}
                  y={rocketY}
                  rotation={rocketRot}
                  flame={rocketFlame}
                  squash={landingSquash}
                  dragging={dragActive}
                  interactive={!flight && !chatActive}
                  onDown={onRocketDown}
                />}

              </div>
            </TransformComponent>

            <header className="pointer-events-none fixed left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-mini-blue" aria-hidden />
              <span className="font-display text-base font-semibold text-mini-ink sm:text-xl">
                Orbit Study
              </span>
            </header>

            <Navigator
              key={`${seed}-${planetCount}-${chatActive ? "strip" : "all"}`}
              items={chatActive ? chatNavItems : navItems}
              activeId={activeId}
              focusedId={focusedId}
              onSelect={handleNavigate}
              onInfo={handleInfoSelect}
              departingIds={departingIds}
              chatMode={chatActive}
              rocket={{
                img: heroRocketImg,
                hostId: flight ? flight.toId : rocketHostId,
                flying: flight !== null,
                armed: rocketArmed,
                onChip: () => setRocketArmed((a) => !a),
                onDestination: handleRocketDestination,
              }}
            />

            {/* Double-click info panel: details + grow-this-family */}
            {panelInfo && (
              <BodyInfoPanel
                info={panelInfo}
                chatMode={chatActive}
                onAdd={handleAddBody}
                onSelect={handleInfoSelect}
                onClose={() => setInfoId(null)}
                onRename={(name) => handleRenameBody(panelInfo.id, name)}
                onToggleSleep={() => handleToggleSleep(panelInfo.id)}
                onDelete={
                  panelInfo.id === config.sun.id ||
                  departingIds.length > 0 ||
                  // The rocket needs somewhere to stand — its host (or
                  // inbound destination) can't leave mid-conversation.
                  panelInfo.id === rocketHostId ||
                  flight?.toId === panelInfo.id ||
                  (chatActive &&
                    (panelInfo.id === chatSubj?.info.id ||
                      panelInfo.id === fanSubj?.id))
                    ? undefined
                    : handleRemoveBody
                }
                rocket={{
                  here: (flight ? flight.toId : rocketHostId) === panelInfo.id,
                  flying: flight !== null,
                  onSummon: () => handleRocketDestination(panelInfo.id),
                }}
              />
            )}

            <div
              className={`fixed right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-2 transition-opacity duration-300 ${
                chatActive ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <button
                type="button"
                aria-label="Open notes"
                title="Open notes"
                onClick={() => openChat()}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
              >
                <MessagesSquare className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <Link
                to="/"
                aria-label="Back to the original view"
                title="Back to the original view"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
              >
                <Home className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>

            {/* Generator controls */}
            <div
              className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] flex flex-col gap-2 transition-opacity duration-300 ${
                chatActive ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <button
                type="button"
                onClick={regenerate}
                disabled={warping}
                className="group flex items-center justify-center gap-2 rounded-full border border-mini-line bg-mini-paper px-4 py-2 font-display text-xs font-normal tracking-[0.08em] text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95 disabled:opacity-60"
              >
                <Dices
                  className={`h-3.5 w-3.5 ${
                    diceRolling
                      ? "animate-dice-roll"
                      : "group-hover:animate-[dice-wiggle_0.5s_ease-in-out]"
                  }`}
                />
                New system
              </button>
              {!showDeepSystem && (
                <button
                  type="button"
                  onClick={showDeepDemo}
                  className="flex items-center justify-center gap-2 rounded-full border border-mini-line bg-mini-paper px-4 py-2 font-display text-xs font-normal tracking-[0.08em] text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
                >
                  <Sparkle className="h-3.5 w-3.5 text-mini-blue" strokeWidth={1.5} />
                  Deep system
                </button>
              )}
              <p className="pointer-events-none text-center font-display text-[11px] tracking-[0.08em] text-mini-ink/50">
                seed #{seed}
              </p>
            </div>


            {/*
              Top-of-sky suggestion stack: the zoom-out pill (hop up to the
              parent star, or the whole sky), a summon-the-rocket offer
              whenever the visited body isn't holding it, and the chat
              invites — one vertical pile in the galaxy view and docked
              over the strip in chat mode.
            */}
            <SuggestionStack chatMode={chatActive}>
              <ZoomOutPill
                key={zoomOutTarget ? `${zoomOutTarget.id}:${zoomOutTarget.name}` : "none"}
                target={zoomOutTarget}
                onZoomOut={handleZoomOut}
              />
              {summonInfo && (
                <RocketSummonInvite
                  key={summonInfo.id}
                  name={summonInfo.name}
                  img={summonInfo.img}
                  onSummon={() => {
                    recordCrashEvent("rocket-summon-pill", { to: summonInfo.id });
                    summonRocketTo(summonInfo.id);
                  }}
                />
              )}
              {/* Post-landing invite: identical timing in both views. */}
              {suggestionInfo && (
                <RocketChatInvite
                  key={suggestionInfo.id}
                  name={suggestionInfo.name}
                  img={suggestionInfo.img}
                  onChat={() => {
                    setChatSuggestionId(null);
                    if (chatActive) {
                      // Switch the open conversation to the rocket's new
                      // host and fan the strip around it.
                      setChatTalkId(suggestionInfo.id);
                      handleNavigate(suggestionInfo.id);
                    } else {
                      openChat(suggestionInfo.id);
                    }
                  }}
                  onDismiss={() => setChatSuggestionId(null)}
                />
              )}
            </SuggestionStack>

            <div
              className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex-col gap-2 transition-opacity duration-300 ${
                chatActive
                  ? "hidden sm:flex left-[calc(clamp(290px,33vw,460px)-3.5rem)]"
                  : "flex right-[max(1rem,env(safe-area-inset-right))]"
              }`}
            >
              {chatActive ? (
                <button
                  type="button"
                  aria-label={
                    zoomOutTarget
                      ? `Zoom out to ${zoomOutTarget.name}`
                      : "Zoom out"
                  }
                  title={
                    zoomOutTarget
                      ? `Zoom out to ${zoomOutTarget.name}`
                      : "Zoom out"
                  }
                  disabled={!zoomOutTarget}
                  onClick={() =>
                    zoomOutTarget && handleZoomOut(zoomOutTarget.id)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95 disabled:opacity-30"
                >
                  <Minus className="h-4 w-4" strokeWidth={1.5} />
                </button>
              ) : null}
              {chatActive ? (
                <button
                  type="button"
                  aria-label="Reverse last step"
                  title="Reverse last step"
                  disabled={!undoState}
                  onClick={restoreUndo}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95 disabled:opacity-30"
                >
                  <Undo className="h-4 w-4" strokeWidth={1.5} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Zoom in"
                    onClick={() => {
                      nudgeCameraZoom(1.28);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    onClick={() => {
                      nudgeCameraZoom(1 / 1.28);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Recenter"
                    onClick={() => {
                      chatUserZoom();
                      resetTransform();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Reverse last step"
                    title="Reverse last step"
                    disabled={!undoState}
                    onClick={restoreUndo}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-mini-line bg-mini-paper text-mini-ink transition-colors hover:border-mini-ink/60 active:scale-95 disabled:opacity-30"
                  >
                    <Undo className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>

            <HintGuide
              pageId="generator"
              hints={GENERATOR_HINTS}
              context={hintContext}
              docked={chatActive}
            />
          </>
          );
        }}
      </TransformWrapper>
      </div>
      {chatSubj && (chatOpen || chatActive) && talkInfo && (
        <ChatPanel
          key={talkInfo.id}
          subject={talkInfo}
          // Wait only while the rocket is on its way to the star we're
          // chatting with — flights to other stars don't interrupt us.
          waiting={!!flight && flight.toId === talkInfo.id}
          onToggleSleep={() => handleToggleSleep(talkInfo.id)}
          onClose={closeChat}
        />
      )}
      </div>
    </div>
    </MinimalContext.Provider>
  );
}
