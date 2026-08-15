/**
 * Chat-mode column layout: when the chat panel opens, the focused body
 * anchors the bottom of the remaining sky strip (face fully visible, the
 * lower body allowed to run off-screen — as if it is looking up) and its
 * direct children line up above it in a perfectly vertical column.
 * Grandchildren are untouched: they keep orbiting their (now lined-up)
 * parents. Pure math, shared by the classic page and the generator.
 */

export interface ChatChildInput {
  id: string;
  size: number;
}

export interface ChatSlot {
  x: number;
  y: number;
  size: number;
}

export interface ChatLayout {
  parentId: string;
  /** Parent's world position — the column grows upward from here. */
  anchor: { x: number; y: number };
  parentSize: number;
  /** Target slot for the parent and every direct child. */
  slots: Map<string, ChatSlot>;
  /** World y of the column's top edge (padding above the highest child). */
  top: number;
  /** Half the column's widest content (body + hand-lettered name). */
  halfWidth: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function computeChatLayout(
  parentId: string,
  anchor: { x: number; y: number },
  parentSize: number,
  children: ChatChildInput[],
): ChatLayout {
  const slots = new Map<string, ChatSlot>();
  slots.set(parentId, { x: anchor.x, y: anchor.y, size: parentSize });
  const maxChild = Math.max(1, ...children.map((c) => c.size));
  const gap = clamp(parentSize * 0.3, 96, 300);
  let cursor = anchor.y - parentSize / 2;
  let widest = parentSize * 0.72;
  for (const c of children) {
    // Compress the size range — big kids shrink, tiny ones grow — so the
    // column reads as a family portrait, not a size chart.
    const size = clamp(
      parentSize * 0.3 * Math.pow(c.size / maxChild, 0.5),
      80,
      parentSize * 0.52,
    );
    const cy = cursor - gap - size / 2;
    slots.set(c.id, { x: anchor.x, y: cy, size });
    cursor = cy - size / 2;
    widest = Math.max(widest, size * 1.7);
  }
  return {
    parentId,
    anchor,
    parentSize,
    slots,
    top: cursor - 60,
    halfWidth: widest / 2,
  };
}

/**
 * Camera transform framing the column inside the sky strip: parent low
 * (face fully on screen, body may run off the bottom edge), column top
 * just below the strip's upper edge.
 */
export function fitChatCamera(
  layout: ChatLayout,
  stripW: number,
  stripH: number,
): { posX: number; posY: number; scale: number } {
  const h = Math.max(1, layout.anchor.y - layout.top);
  const w = layout.halfWidth * 2;
  const scale = clamp(
    Math.min((stripW * 0.88) / w, (stripH * 0.76) / h),
    0.12,
    2.2,
  );
  return {
    scale,
    posX: stripW / 2 - layout.anchor.x * scale,
    posY: stripH * 0.85 - layout.anchor.y * scale,
  };
}

/** Per-body rendered pose while the column forms or dissolves. */
export interface ChatChaseState {
  x: number;
  y: number;
  size: number;
  /** Clock second this entry was last advanced on (frame guard). */
  frame: number;
}

/**
 * Exponential chase toward the mix-blended target (live orbit pose vs
 * column slot). Frame-guarded: repeated reads within one frame return the
 * stored value instead of advancing twice, so every consumer in a render
 * pass agrees on the pose.
 */
export function chaseChatSlot(
  rendered: Map<string, ChatChaseState>,
  id: string,
  live: { x: number; y: number; size: number },
  slot: ChatSlot | undefined,
  mix: number,
  frame: number,
): ChatChaseState {
  if (!slot || mix <= 0.004) {
    rendered.delete(id);
    return { ...live, frame };
  }
  const prev = rendered.get(id);
  if (prev && prev.frame === frame) return prev;
  const e = 1 - Math.pow(1 - mix, 3);
  const tx = live.x + (slot.x - live.x) * e;
  const ty = live.y + (slot.y - live.y) * e;
  const ts = live.size + (slot.size - live.size) * e;
  const from = prev ?? { ...live, frame };
  const k = 0.16;
  const cur = {
    x: from.x + (tx - from.x) * k,
    y: from.y + (ty - from.y) * k,
    size: from.size + (ts - from.size) * k,
    frame,
  };
  rendered.set(id, cur);
  return cur;
}
