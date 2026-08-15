import mapAsset from "@/assets/galaxy-map.webp.asset.json";

export const MAP_URL: string = mapAsset.url;

/** Source image dimensions (footer bar cropped off). */
export const MAP_W = 1131;
export const MAP_H = 1605;

/** Displayed world size in px (aspect preserved). */
export const WORLD_W = 1500;
export const WORLD_H = Math.round((WORLD_W * MAP_H) / MAP_W);

export interface HotspotDef {
  id: string;
  name: string;
  /** Center as fractions of map width / height. */
  cx: number;
  cy: number;
  /** Radius as a fraction of map width. */
  r: number;
  /** What it says when tapped. */
  line: string;
  /** Idle breathing animation timing (seconds). */
  breathe: number;
  delay: number;
}

export const HOTSPOTS: HotspotDef[] = [
  { id: "sun", name: "Sun", cx: 0.868, cy: 0.903, r: 0.185, line: "I'm the star of the show. Literally.", breathe: 5.2, delay: 0 },
  { id: "mercury", name: "Mercury", cx: 0.463, cy: 0.918, r: 0.05, line: "Fastest planet in the club!", breathe: 3.4, delay: 0.6 },
  { id: "venus", name: "Venus", cx: 0.232, cy: 0.8, r: 0.082, line: "Hottest around — and it's not close.", breathe: 4.1, delay: 1.3 },
  { id: "earth", name: "Earth", cx: 0.22, cy: 0.584, r: 0.118, line: "You are here. Hi!", breathe: 4.6, delay: 0.2 },
  { id: "moon", name: "Moon", cx: 0.44, cy: 0.578, r: 0.045, line: "I only shine at night.", breathe: 3.1, delay: 0.9 },
  { id: "mars", name: "Mars", cx: 0.674, cy: 0.651, r: 0.065, line: "One day I'll have wifi.", breathe: 3.8, delay: 1.7 },
  { id: "jupiter", name: "Jupiter", cx: 0.785, cy: 0.353, r: 0.17, line: "Biggest planet. Humble too.", breathe: 5.6, delay: 0.4 },
  { id: "saturn", name: "Saturn", cx: 0.327, cy: 0.382, r: 0.12, line: "These rings? All natural.", breathe: 4.9, delay: 1.1 },
  { id: "uranus", name: "Uranus", cx: 0.527, cy: 0.185, r: 0.118, line: "I roll sideways through life.", breathe: 4.4, delay: 0.8 },
  { id: "neptune", name: "Neptune", cx: 0.165, cy: 0.147, r: 0.095, line: "Brrr… it's windy out here.", breathe: 4.2, delay: 1.5 },
  { id: "pluto", name: "Pluto", cx: 0.358, cy: 0.11, r: 0.034, line: "Still a planet in my heart.", breathe: 3.0, delay: 0.3 },
];
