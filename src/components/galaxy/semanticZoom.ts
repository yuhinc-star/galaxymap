export type SemanticDetail = "hidden" | "context" | "quiet" | "full";

export interface SemanticVisibilityInput {
  depth: number;
  focusDepth: number;
  apparentSize: number;
  protected?: boolean;
  mobile?: boolean;
}

export interface SemanticVisibility {
  detail: SemanticDetail;
  opacity: number;
  scale: number;
  labelOpacity: number;
  ringOpacity: number;
  interactive: boolean;
}

const smoothstep = (lo: number, hi: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  return x * x * (3 - 2 * x);
};

/**
 * Three readable family generations, plus a faint fourth during handoff.
 * This is presentation-only: callers retain the complete body tree.
 */
export function semanticVisibility({
  depth,
  focusDepth,
  apparentSize,
  protected: keep = false,
  mobile = false,
}: SemanticVisibilityInput): SemanticVisibility {
  const minDepth = Math.max(0, focusDepth - 1);
  const maxDepth = focusDepth === 0 ? 2 : focusDepth + 1;
  const generationDistance = depth < minDepth
    ? minDepth - depth
    : depth > maxDepth
      ? depth - maxDepth
      : 0;

  // Tiny bodies disappear while zoomed out. Extremely oversized ancestors
  // also soften away while zoomed deeply into a local family.
  const tiny = smoothstep(mobile ? 11 : 8, mobile ? 28 : 22, apparentSize);
  const oversized = 1 - smoothstep(mobile ? 760 : 980, mobile ? 1250 : 1650, apparentSize);
  const sizeAlpha = Math.min(tiny, oversized);
  const generationAlpha = generationDistance === 0 ? 1 : generationDistance === 1 ? (mobile ? 0.16 : 0.28) : 0;
  const opacity = keep ? Math.max(0.92, sizeAlpha) : sizeAlpha * generationAlpha;

  if (opacity <= 0.025) {
    return { detail: "hidden", opacity: 0, scale: 0.82, labelOpacity: 0, ringOpacity: 0, interactive: false };
  }
  if (opacity < 0.38) {
    return { detail: "context", opacity, scale: 0.9, labelOpacity: 0, ringOpacity: opacity * 0.45, interactive: false };
  }
  if (apparentSize < (mobile ? 54 : 46) || opacity < 0.78) {
    return { detail: "quiet", opacity, scale: 0.96, labelOpacity: smoothstep(30, 66, apparentSize), ringOpacity: opacity * 0.68, interactive: true };
  }
  return { detail: "full", opacity, scale: 1, labelOpacity: smoothstep(38, 76, apparentSize), ringOpacity: opacity, interactive: true };
}
