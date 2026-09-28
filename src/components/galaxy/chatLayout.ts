/**
 * Chat-mode fan layout: when the chat panel opens, the focused body
 * anchors the bottom of the remaining sky strip — large, lower body
 * running off the bottom edge so its face reads as "looking up" — and
 * its direct children ride their own orbit rings while the rings morph
 * into a fan of concentric arcs above the subject, like the reference
 * poster: not a rigid vertical column, every child keeps a jaunty
 * angular offset along its arc. Grandchildren are untouched: they keep
 * orbiting their (now lined-up) parents. Pure math, shared by the
 * classic page and the generator.
 */

import { planetLabelSize } from "./Planet";

export interface ChatChildInput {
  id: string;
  size: number;
  name: string;
  /** Actual parent in the visible genealogy. Defaults to the layout root. */
  parentId?: string;
  /** 1–4 below the layout root. */
  generation?: number;
}

export interface ChatSlot {
  x: number;
  y: number;
  size: number;
  /** Polar placement around the anchor — the orbit-morph target. */
  angle: number;
  /** World distance from the anchor (the morphed ring's radius). */
  radius: number;
  /** Per-body label scale so the hand-lettered name fits the fan. */
  labelBoost: number;
  parentId: string | null;
  generation: number;
}

export interface ChatLayout {
  parentId: string;
  /** Subject's world position — the fan grows upward from here. */
  anchor: { x: number; y: number };
  parentSize: number;
  /** Target slot for the parent and every direct child. */
  slots: Map<string, ChatSlot>;
  /** Strip size the layout was solved for — rebuild when it changes. */
  stripW: number;
  stripH: number;
  /** Camera transform framing the fan inside the sky strip. */
  camera: { posX: number; posY: number; scale: number };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Eased ramp used by every chat blend (position, size, ring morph). */
export const chatEase = (mix: number) => 1 - Math.pow(1 - mix, 3);

/** Shortest signed angular distance from `from` to `to`. */
export const shortAngle = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

interface KidPlan {
  id: string;
  name: string;
  parentId: string;
  generation: number;
  /** Screen diameter in the fan. */
  dia: number;
  /** Screen font size for the hand-lettered name. */
  font: number;
  /** Vertical room reserved below the body (its hanging name). */
  gap: number;
  /** Orbit radius from this body's actual parent (screen px). */
  rho: number;
  /** Final angle, straight up plus a staggered tilt. */
  angle: number;
}

/**
 * Solve the fan in screen space (where "fits the strip" is decidable),
 * then convert to world coordinates through the camera scale.
 */
export function computeChatLayout(
  parentId: string,
  anchor: { x: number; y: number },
  parentSize: number,
  children: ChatChildInput[],
  stripW: number,
  stripH: number,
): ChatLayout {
  // The subject looms large at the bottom — like the sun in the
  // reference poster, only its upper half (and face) on screen.
  const r0max = clamp(stripW * 0.62, 130, 380);
  let scale = clamp((r0max * 2) / parentSize, 0.12, 2.0);
  let r0 = (parentSize * scale) / 2;
  const sx = stripW * 0.5;
  const sy = stripH * 0.94;

  // Every depth gets its own horizontal band. This makes a recursive chain
  // read as genealogy instead of several tiny moons sharing one loose cloud.
  const maxC = Math.max(1, ...children.map((c) => c.size));
  const plan = (): KidPlan[] => {
    const maxGeneration = Math.max(1, ...children.map((c) => c.generation ?? 1));
    const available = Math.max(180, sy - r0 * 0.58 - 22);
    const band = available / maxGeneration;
    return children.map((c, i) => {
      const generation = clamp(c.generation ?? 1, 1, 4);
      const dia = clamp(
        stripW * 0.3 * Math.pow(c.size / maxC, 0.42) * Math.pow(0.88, generation - 1),
        30,
        stripW * 0.34,
      );
      const longName = c.name.length > 16;
      const font = longName
        ? clamp(dia * 0.2, 11, 20)
        : clamp(dia * 0.28, 14, 30);
      const gap = font * (longName ? 2 : 1.1) + 8;
      return {
        id: c.id,
        name: c.name,
        parentId: c.parentId ?? parentId,
        generation,
        dia,
        font,
        gap,
        rho: band,
        angle: -Math.PI / 2,
      };
    });
  };

  let kids = plan();

  const slots = new Map<string, ChatSlot>();
  slots.set(parentId, {
    x: anchor.x,
    y: anchor.y,
    size: parentSize,
    angle: -Math.PI / 2,
    radius: 0,
    labelBoost: 1,
    parentId: null,
    generation: 0,
  });
  // The original chat idea: ONE vertical lineup rising above the subject.
  // Genealogy is kept inside the lineup — rows run in family order (each
  // child directly above its parent's row, before the next sibling), with a
  // small per-generation step sideways and a jaunty alternating tilt.
  const byParent = new Map<string, KidPlan[]>();
  for (const k of kids) {
    const list = byParent.get(k.parentId) ?? [];
    list.push(k);
    byParent.set(k.parentId, list);
  }
  const ordered: KidPlan[] = [];
  const walk = (pid: string) => {
    for (const k of byParent.get(pid) ?? []) {
      ordered.push(k);
      walk(k.id);
    }
  };
  walk(parentId);
  for (const k of kids) if (!ordered.includes(k)) ordered.push(k);
  const top = 26;
  const bottom = sy - r0 * 0.62 - 14;
  const pitch = ordered.length ? Math.max(24, (bottom - top) / ordered.length) : 0;
  const indent = Math.min(26, stripW * 0.07);
  let y = bottom;
  ordered.forEach((k, i) => {
    const parent = slots.get(k.parentId) ?? slots.get(parentId)!;
    const dia = Math.min(k.dia, pitch * 0.62);
    const size = dia / scale;
    const tilt = (i % 2 === 0 ? -1 : 1) * stripW * 0.1;
    const screenX = clamp(sx + tilt + (k.generation - 1) * indent, dia, stripW - dia);
    const screenY = y - pitch / 2;
    y -= pitch;
    const parentScreenX = sx + (parent.x - anchor.x) * scale;
    const parentScreenY = sy + (parent.y - anchor.y) * scale;
    const dx = screenX - parentScreenX;
    const dy = screenY - parentScreenY;
    slots.set(k.id, {
      x: anchor.x + (screenX - sx) / scale,
      y: anchor.y + (screenY - sy) / scale,
      size,
      angle: Math.atan2(dy, dx),
      radius: Math.hypot(dx, dy) / scale,
      labelBoost: Math.max(13, Math.min(k.font, pitch * 0.45)) / (planetLabelSize(size, k.name) * scale),
      parentId: k.parentId,
      generation: k.generation,
    });
  });

  return {
    parentId,
    anchor,
    parentSize,
    slots,
    stripW,
    stripH,
    camera: {
      scale,
      posX: sx - anchor.x * scale,
      posY: sy - anchor.y * scale,
    },
  };
}

/** Per-body rendered pose while the fan forms or dissolves. */
export interface ChatChaseState {
  x: number;
  y: number;
  size: number;
  /** Clock second this entry was last advanced on (frame guard). */
  frame: number;
}

/**
 * Exponential chase toward a target pose. Frame-guarded: repeated reads
 * within one frame return the stored value instead of advancing twice,
 * so every consumer in a render pass agrees on the pose. Used for the
 * subject itself, which glides straight to the fan's base.
 */
export function chaseChatTarget(
  rendered: Map<string, ChatChaseState>,
  id: string,
  from: { x: number; y: number; size: number },
  target: { x: number; y: number; size: number },
  frame: number,
): ChatChaseState {
  const prev = rendered.get(id);
  if (prev && prev.frame === frame) return prev;
  const start = prev ?? { ...from, frame };
  const k = 0.16;
  const cur = {
    x: start.x + (target.x - start.x) * k,
    y: start.y + (target.y - start.y) * k,
    size: start.size + (target.size - start.size) * k,
    frame,
  };
  rendered.set(id, cur);
  return cur;
}

/** Polar chase state for a child riding its morphing orbit ring. */
export interface ChatRideState {
  angle: number;
  /** Ring scale: 1 = live orbit, slot.radius/shape = fan arc. */
  scale: number;
  size: number;
  frame: number;
}

/**
 * A chat-set child travels along its own orbit ring while the ring
 * itself rearranges: angle and ring scale chase toward the fan slot, so
 * the body is always exactly on its (reshaping) ring — the lineup reads
 * as the orbits swinging into the fan, not bodies flying across space.
 * Returns the rendered pose plus the ring scale to draw with.
 */
export function rideChatOrbit(
  rendered: Map<string, ChatRideState>,
  id: string,
  cx: number,
  cy: number,
  angle: number,
  pointAt: (a: number) => { x: number; y: number },
  size: number,
  slot: ChatSlot,
  mix: number,
  frame: number,
): { x: number; y: number; size: number; ringScale: number } {
  const e = chatEase(mix);
  const qS = pointAt(slot.angle);
  const rShape = Math.hypot(qS.x, qS.y) || 1;
  const tAngle = angle + shortAngle(angle, slot.angle) * e;
  const tScale = 1 + (slot.radius / rShape - 1) * e;
  const tSize = size + (slot.size - size) * e;
  const prev = rendered.get(id);
  const state =
    prev && prev.frame === frame
      ? prev
      : (() => {
          const start = prev ?? { angle, scale: 1, size, frame };
          const k = 0.16;
          const cur = {
            angle: start.angle + shortAngle(start.angle, tAngle) * k,
            scale: start.scale + (tScale - start.scale) * k,
            size: start.size + (tSize - start.size) * k,
            frame,
          };
          rendered.set(id, cur);
          return cur;
        })();
  const q = pointAt(state.angle);
  return {
    x: cx + q.x * state.scale,
    y: cy + q.y * state.scale,
    size: state.size,
    ringScale: state.scale,
  };
}

/**
 * A body that just left the fan (the fan re-focused on another star)
 * glides back to its live orbit instead of snapping: angle, ring scale
 * and size chase home along its own ring. Returns done=true once close
 * enough to hand back to the live loop (the entry is then deleted).
 */
export function rideChatOrbitExit(
  rendered: Map<string, ChatRideState>,
  id: string,
  cx: number,
  cy: number,
  angle: number,
  pointAt: (a: number) => { x: number; y: number },
  size: number,
  frame: number,
): { x: number; y: number; size: number; ringScale: number; done: boolean } {
  const prev = rendered.get(id);
  if (!prev) {
    const q0 = pointAt(angle);
    return { x: cx + q0.x, y: cy + q0.y, size, ringScale: 1, done: true };
  }
  if (prev.frame === frame) {
    const qp = pointAt(prev.angle);
    return {
      x: cx + qp.x * prev.scale,
      y: cy + qp.y * prev.scale,
      size: prev.size,
      ringScale: prev.scale,
      done: false,
    };
  }
  const k = 0.16;
  const dA = shortAngle(prev.angle, angle);
  const cur = {
    angle: prev.angle + dA * k,
    scale: prev.scale + (1 - prev.scale) * k,
    size: prev.size + (size - prev.size) * k,
    frame,
  };
  if (
    Math.abs(dA) < 0.012 &&
    Math.abs(cur.scale - 1) < 0.012 &&
    Math.abs(cur.size - size) < 1
  ) {
    rendered.delete(id);
    const q1 = pointAt(angle);
    return { x: cx + q1.x, y: cy + q1.y, size, ringScale: 1, done: true };
  }
  rendered.set(id, cur);
  const q = pointAt(cur.angle);
  return {
    x: cx + q.x * cur.scale,
    y: cy + q.y * cur.scale,
    size: cur.size,
    ringScale: cur.scale,
    done: false,
  };
}
