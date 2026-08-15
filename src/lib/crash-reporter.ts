/**
 * Flight recorder for mobile tab kills.
 *
 * When a phone browser kills the tab from resource pressure there is no JS
 * error and no unload handler — the page simply vanishes. The only reliable
 * signal is a heartbeat in localStorage: every live session writes one every
 * couple of seconds, and marks it `cleanExit` on pagehide. If the next boot
 * finds a heartbeat that was never marked clean, the previous tab died — and
 * the heartbeat still holds the exact app state and last events at the moment
 * of death.
 *
 * Everything is best-effort and storage-failure-safe: private mode or a full
 * quota must never break the app.
 */

const HEARTBEAT_KEY = "pg-crash-heartbeat";
const EVENTS_KEY = "pg-crash-events";
const INSTALL_KEY = "pg-install-id";
const HEARTBEAT_MS = 2000;
const MAX_EVENTS = 40;
/** Ignore "deaths" older than this — probably just an abandoned tab. */
const STALE_MS = 24 * 60 * 60 * 1000;
const REPORT_URL = "/api/public/crash-report";

export interface CrashEvent {
  at: number;
  kind: string;
  detail?: unknown;
}

interface Heartbeat {
  sessionId: string;
  installId: string;
  bootAt: number;
  lastSeenAt: number;
  cleanExit: boolean;
  url: string;
  context: Record<string, unknown>;
  lastEvents: CrashEvent[];
  mem?: { usedMB: number; limitMB: number };
}

const isBrowser = () => typeof window !== "undefined";

let initialized = false;
let sessionId = "";
let installId = "";
let bootAt = 0;
let context: Record<string, unknown> = {};
let events: CrashEvent[] = [];
let persistTimer: number | undefined;

const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota or private mode — logging must never break the app */
    }
  },
};

/** Chrome-only heap numbers; undefined on Safari/Firefox. */
const heapInfo = (): { usedMB: number; limitMB: number } | undefined => {
  const mem = (
    performance as unknown as {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    }
  ).memory;
  if (!mem) return undefined;
  return {
    usedMB: Math.round(mem.usedJSHeapSize / 1048576),
    limitMB: Math.round(mem.jsHeapSizeLimit / 1048576),
  };
};

export const crashDeviceInfo = () => ({
  ua: navigator.userAgent,
  dpr: window.devicePixelRatio,
  screen: `${window.innerWidth}x${window.innerHeight}`,
  coarse: window.matchMedia("(pointer: coarse)").matches,
  deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
  cores: navigator.hardwareConcurrency,
});

const writeHeartbeat = (cleanExit: boolean) => {
  const beat: Heartbeat = {
    sessionId,
    installId,
    bootAt,
    lastSeenAt: Date.now(),
    cleanExit,
    url: window.location.pathname,
    context,
    lastEvents: events.slice(-8),
    mem: heapInfo(),
  };
  storage.set(HEARTBEAT_KEY, JSON.stringify(beat));
};

const persistEvents = () => {
  storage.set(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
};

/** Trailing-edge persist so chatty callers (sprite decodes) don't thrash. */
const schedulePersist = () => {
  if (persistTimer !== undefined) return;
  persistTimer = window.setTimeout(() => {
    persistTimer = undefined;
    writeHeartbeat(false);
    persistEvents();
  }, 400);
};

/** Merge live app state into the heartbeat (route, system, rocket, …). */
export const setCrashContext = (patch: Record<string, unknown>) => {
  if (!isBrowser()) return;
  context = { ...context, ...patch };
  schedulePersist();
};

/** Append to the local event ring — the "last things before it died". */
export const recordCrashEvent = (kind: string, detail?: unknown) => {
  if (!isBrowser()) return;
  events.push({ at: Date.now(), kind, detail });
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  schedulePersist();
};

/** Fire-and-forget report to the server log; survives page teardown. */
const sendReport = (type: string, extra: Record<string, unknown> = {}) => {
  const payload = JSON.stringify({
    type,
    at: Date.now(),
    sessionId,
    installId,
    url: window.location.pathname,
    device: crashDeviceInfo(),
    mem: heapInfo(),
    context,
    lastEvents: events.slice(-10),
    ...extra,
  }).slice(0, 12000);
  const body = new Blob([payload], { type: "application/json" });
  if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(REPORT_URL, body)) {
    return;
  }
  void fetch(REPORT_URL, { method: "POST", body, keepalive: true }).catch(() => {});
};

const readHeartbeat = (): Heartbeat | null => {
  const raw = storage.get(HEARTBEAT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Heartbeat;
  } catch {
    return null;
  }
};

const readEvents = (): CrashEvent[] => {
  const raw = storage.get(EVENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CrashEvent[]) : [];
  } catch {
    return [];
  }
};

const describeReason = (reason: unknown): string => {
  if (reason instanceof Error) return reason.stack ?? reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
};

/**
 * Boot the recorder. Detects the previous session's abnormal termination,
 * then starts the heartbeat and error traps. Idempotent.
 */
export const initCrashReporter = () => {
  if (!isBrowser() || initialized) return;
  initialized = true;

  bootAt = Date.now();
  sessionId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `s-${bootAt.toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  installId = storage.get(INSTALL_KEY) ?? "";
  if (!installId) {
    installId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `i-${bootAt.toString(36)}`;
    storage.set(INSTALL_KEY, installId);
  }

  // Carry last session's events forward so the diagnostics page can show
  // what a killed tab was doing even after it is gone.
  events = readEvents();

  const prev = readHeartbeat();
  if (
    prev &&
    !prev.cleanExit &&
    prev.sessionId !== sessionId &&
    bootAt - prev.lastSeenAt < STALE_MS
  ) {
    const detail = {
      diedAt: prev.lastSeenAt,
      aliveForMs: prev.lastSeenAt - prev.bootAt,
      url: prev.url,
      context: prev.context,
      mem: prev.mem,
      lastEvents: prev.lastEvents,
    };
    recordCrashEvent("abnormal-termination", detail);
    sendReport("abnormal-termination", { previous: detail });
  }

  writeHeartbeat(false);
  persistEvents();
  window.setInterval(() => writeHeartbeat(false), HEARTBEAT_MS);

  window.addEventListener("error", (e) => {
    const detail = {
      message: e.message,
      stack: e.error instanceof Error ? e.error.stack : undefined,
      at: `${e.filename}:${e.lineno}:${e.colno}`,
    };
    recordCrashEvent("error", detail);
    sendReport("error", { error: detail });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const detail = describeReason(e.reason).slice(0, 2000);
    recordCrashEvent("unhandledrejection", detail);
    sendReport("unhandledrejection", { error: detail });
  });

  // Last reliable moment before a mobile kill or a normal leave.
  window.addEventListener("pagehide", () => {
    writeHeartbeat(true);
    persistEvents();
    sendReport("pagehide");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      writeHeartbeat(false);
      persistEvents();
    }
  });
};

/** Snapshot for the /diagnostics page — reads storage fresh. */
export const getCrashDiagnostics = () => {
  if (!isBrowser()) return null;
  return {
    installId,
    sessionId,
    bootAt,
    device: crashDeviceInfo(),
    mem: heapInfo(),
    heartbeat: readHeartbeat(),
    events: readEvents(),
  };
};

export const clearCrashDiagnostics = () => {
  if (!isBrowser()) return;
  events = [];
  storage.set(EVENTS_KEY, "[]");
  storage.set(HEARTBEAT_KEY, "");
};
