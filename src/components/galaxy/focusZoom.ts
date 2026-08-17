/**
 * Uniform zoom promotion: wherever you zoom to a body — the sun, a planet,
 * or a ten-generations-deep tiny moon — its disc is promoted to the same
 * share of the screen, so every visit feels equally "up close".
 */

/** Fraction of the smaller viewport dimension the focused body fills. */
export const FOCUS_SCREEN_FRACTION = 0.44;

/** Camera scale ceiling — deep enough to promote a ~3px tiny moon. */
export const MAX_PROMOTE_SCALE = 240;

/**
 * Camera scale that promotes a body of `size` world px to the standard
 * on-screen size. Pure: takes the viewport explicitly.
 */
export const promoteScaleFor = (size: number, vw: number, vh: number) => {
  const vmin = Math.min(vw, vh);
  const s = (vmin * FOCUS_SCREEN_FRACTION) / Math.max(1, size);
  return Math.min(Math.max(s, 0.12), MAX_PROMOTE_SCALE);
};

/**
 * Labels freeze at their 1x screen size once you zoom in past 1x, like map
 * place-names — otherwise a tiny moon's label would fill the whole sky.
 */
export const labelCounterScale = (cameraScale: number) =>
  1 / Math.max(1, cameraScale);
