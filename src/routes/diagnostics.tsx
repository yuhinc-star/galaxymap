import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ClipboardCopy, RefreshCw, Trash2 } from "lucide-react";
import {
  clearCrashDiagnostics,
  getCrashDiagnostics,
  type CrashEvent,
} from "@/lib/crash-reporter";

type Diagnostics = NonNullable<ReturnType<typeof getCrashDiagnostics>>;

export const Route = createFileRoute("/diagnostics")({
  head: () => ({
    meta: [
      { title: "Diagnostics — Pocket Galaxy" },
      {
        name: "description",
        content:
          "On-device flight recorder: last session state, errors and events captured before a mobile tab died.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Diagnostics — Pocket Galaxy" },
      {
        property: "og:description",
        content: "On-device crash flight recorder for Pocket Galaxy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiagnosticsPage,
});

const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString();

const fmtAgo = (ms: number) => {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
};

const fmtDetail = (detail: unknown) => {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
};

function EventRow({ event }: { event: CrashEvent }) {
  const isDeath = event.kind === "abnormal-termination";
  const isError = event.kind === "error" || event.kind === "unhandledrejection";
  return (
    <li
      className={`rounded-lg border px-3 py-2 text-xs ${
        isDeath
          ? "border-red-400/60 bg-red-500/10"
          : isError
            ? "border-amber-400/50 bg-amber-500/10"
            : "border-border bg-card/60"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-foreground">{event.kind}</span>
        <span className="shrink-0 text-muted-foreground">
          {fmtTime(event.at)} · {fmtAgo(event.at)}
        </span>
      </div>
      {event.detail != null && (
        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
          {fmtDetail(event.detail)}
        </pre>
      )}
    </li>
  );
}

function DiagnosticsPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    setData(getCrashDiagnostics());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const copyAll = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the text is on screen anyway */
    }
  };

  const clearAll = () => {
    clearCrashDiagnostics();
    refresh();
  };

  const beat = data?.heartbeat;
  const events = data ? [...data.events].reverse() : [];

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the galaxy
          </Link>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs hover:bg-accent"
            >
              <ClipboardCopy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs hover:bg-accent"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        </div>

        <h1 className="mt-4 text-2xl font-semibold">Flight recorder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          If the tab dies on your phone, reopen the app and come straight here:
          the last heartbeat and events survive the kill. Reports are also
          beaconed to the server log.
        </p>

        {!data ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <section className="mt-6 rounded-xl border border-border bg-card/60 p-4">
              <h2 className="text-sm font-semibold">This device</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <dt>Screen</dt>
                <dd className="text-foreground">
                  {data.device.screen} @ {data.device.dpr}x
                  {data.device.coarse ? " · touch" : ""}
                </dd>
                <dt>Memory</dt>
                <dd className="text-foreground">
                  {data.mem
                    ? `${data.mem.usedMB} / ${data.mem.limitMB} MB JS heap`
                    : `device RAM ~${data.device.deviceMemory ?? "?"} GB`}
                </dd>
                <dt>Install</dt>
                <dd className="truncate text-foreground">{data.installId}</dd>
                <dt>Session</dt>
                <dd className="truncate text-foreground">{data.sessionId}</dd>
              </dl>
              <p className="mt-2 truncate text-[11px] text-muted-foreground">
                {data.device.ua}
              </p>
            </section>

            <section className="mt-4 rounded-xl border border-border bg-card/60 p-4">
              <h2 className="text-sm font-semibold">Last heartbeat</h2>
              {beat ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>
                    <span
                      className={`mr-1 inline-block h-2 w-2 rounded-full ${beat.cleanExit ? "bg-green-400" : "bg-red-400"}`}
                    />
                    {beat.cleanExit
                      ? "Previous session exited cleanly."
                      : "Previous session did NOT exit cleanly — the tab likely died."}
                  </p>
                  <p className="mt-1">
                    Last seen {fmtAgo(beat.lastSeenAt)} on {beat.url}
                    {beat.mem &&
                      ` · heap ${beat.mem.usedMB}/${beat.mem.limitMB} MB`}
                  </p>
                  {Object.keys(beat.context).length > 0 && (
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-background/60 p-2 text-foreground">
                      {JSON.stringify(beat.context, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  No heartbeat recorded yet — browse the galaxy first.
                </p>
              )}
            </section>

            <section className="mt-4">
              <h2 className="text-sm font-semibold">
                Event ring ({events.length})
              </h2>
              {events.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Nothing recorded yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {events.map((e, i) => (
                    <EventRow key={`${e.at}-${i}`} event={e} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
