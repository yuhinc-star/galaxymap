import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Receives flight-recorder beacons from the client crash reporter and logs
 * them as single-line `[CRASH-REPORT]` entries, retrievable from the server
 * logs. Public by necessity (a dying tab can't authenticate), so the payload
 * is strictly validated, size-capped and rate-limited, and nothing is stored
 * beyond the log line.
 */
const reportSchema = z.object({
  type: z.enum([
    "error",
    "unhandledrejection",
    "abnormal-termination",
    "pagehide",
  ]),
  at: z.number().optional(),
  sessionId: z.string().max(64).optional(),
  installId: z.string().max(64).optional(),
  url: z.string().max(300).optional(),
  device: z.record(z.string(), z.unknown()).optional(),
  mem: z
    .object({ usedMB: z.number(), limitMB: z.number() })
    .partial()
    .optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  lastEvents: z.array(z.unknown()).max(12).optional(),
  error: z.unknown().optional(),
  previous: z.record(z.string(), z.unknown()).optional(),
});

const MAX_BODY = 16_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
/** Best-effort per-install limiter (per worker instance). */
const hits = new Map<string, { count: number; resetAt: number }>();

const rateLimited = (key: string): boolean => {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
};

export const Route = createFileRoute("/api/public/crash-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const text = await request.text();
        if (text.length > MAX_BODY) {
          return new Response("too large", { status: 413 });
        }
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          return new Response("bad json", { status: 400 });
        }
        const parsed = reportSchema.safeParse(json);
        if (!parsed.success) {
          return new Response("bad report", { status: 400 });
        }
        const report = parsed.data;
        if (rateLimited(report.installId ?? "anon")) {
          return new Response(null, { status: 204 });
        }
        // One grep-able line per report — search server logs for CRASH-REPORT.
        console.log(`[CRASH-REPORT] ${JSON.stringify(report)}`);
        return new Response(null, { status: 204 });
      },
    },
  },
});
