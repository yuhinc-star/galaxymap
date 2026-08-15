import sunImg from "@/assets/planets/sun.png";
import mercuryImg from "@/assets/planets/mercury.png";
import venusImg from "@/assets/planets/venus.png";
import earthImg from "@/assets/planets/earth.png";
import moonImg from "@/assets/planets/moon.png";
import marsImg from "@/assets/planets/mars.png";
import jupiterImg from "@/assets/planets/jupiter.png";
import saturnImg from "@/assets/planets/saturn.png";
import uranusImg from "@/assets/planets/uranus.png";
import neptuneImg from "@/assets/planets/neptune.png";
import plutoImg from "@/assets/planets/pluto.png";
import rocketImg from "@/assets/planets/rocket.png";
import astronautImg from "@/assets/planets/astronaut.png";
import satelliteImg from "@/assets/planets/satellite.png";

/** Square world size in px; the Sun sits at the center. */
export const WORLD = 2900;
export const CENTER = WORLD / 2;

export interface BodyDef {
  id: string;
  name: string;
  img: string;
  /** Display size in world px. */
  size: number;
  /** What it says when tapped. */
  line: string;
  /** Idle breathing animation timing (seconds). */
  breathe: number;
  delay: number;
}

export interface PlanetDef extends BodyDef {
  /** Orbit radius around the Sun, world px. */
  orbitR: number;
  /** Seconds per full revolution. */
  period: number;
  /** Starting angle, radians. */
  startAngle: number;
}

export const SUN: BodyDef = {
  id: "sun",
  name: "Sun",
  img: sunImg,
  size: 430,
  line: "I'm the star of the show. Literally.",
  breathe: 6,
  delay: 0,
};

/**
 * Chunky storybook proportions, like the reference posters: planets are
 * big relative to the gap between rings and happily overlap their own
 * orbit lines. Not to realistic scale — charm over astronomy.
 */
export const PLANETS: PlanetDef[] = [
  { id: "mercury", name: "Mercury", img: mercuryImg, size: 95, orbitR: 350, period: 14, startAngle: 0.6, line: "Fastest planet in the club!", breathe: 3.4, delay: 0.6 },
  { id: "venus", name: "Venus", img: venusImg, size: 148, orbitR: 480, period: 22, startAngle: 2.4, line: "Hottest around — and it's not close.", breathe: 4.1, delay: 1.3 },
  { id: "earth", name: "Earth", img: earthImg, size: 158, orbitR: 610, period: 32, startAngle: 4.1, line: "You are here. Hi!", breathe: 4.6, delay: 0.2 },
  { id: "mars", name: "Mars", img: marsImg, size: 125, orbitR: 735, period: 44, startAngle: 5.3, line: "One day I'll have wifi.", breathe: 3.8, delay: 1.7 },
  { id: "jupiter", name: "Jupiter", img: jupiterImg, size: 258, orbitR: 895, period: 70, startAngle: 1.2, line: "Biggest planet. Humble too.", breathe: 5.6, delay: 0.4 },
  { id: "saturn", name: "Saturn", img: saturnImg, size: 262, orbitR: 1075, period: 95, startAngle: 3.3, line: "These rings? All natural.", breathe: 4.9, delay: 1.1 },
  { id: "uranus", name: "Uranus", img: uranusImg, size: 182, orbitR: 1220, period: 125, startAngle: 5.9, line: "I roll sideways through life.", breathe: 4.4, delay: 0.8 },
  { id: "neptune", name: "Neptune", img: neptuneImg, size: 172, orbitR: 1350, period: 155, startAngle: 2.0, line: "Brrr… it's windy out here.", breathe: 4.2, delay: 1.5 },
  { id: "pluto", name: "Pluto", img: plutoImg, size: 80, orbitR: 1435, period: 190, startAngle: 4.6, line: "Still a planet in my heart.", breathe: 3.0, delay: 0.3 },
];

/** The Moon circles Earth instead of the Sun. */
export const MOON = {
  id: "moon",
  name: "Moon",
  img: moonImg,
  size: 58,
  orbitR: 120,
  period: 5,
  line: "I only shine at night.",
  breathe: 3.1,
  delay: 0.9,
};

export interface DrifterDef extends BodyDef {
  /** Orbit radius around the Sun, world px. */
  orbitR: number;
  /** Seconds per full revolution. */
  period: number;
  startAngle: number;
  /** 1 = counter-clockwise, -1 = clockwise. */
  dir: 1 | -1;
}

/**
 * Decorative characters drifting through the sky, like the rocket,
 * astronaut and satellite in the reference posters. Non-interactive.
 */
export const DRIFTERS: DrifterDef[] = [
  { id: "rocket", name: "Rocket", img: rocketImg, size: 155, orbitR: 1150, period: 170, startAngle: 2.9, dir: -1, line: "", breathe: 4.4, delay: 0.5 },
  { id: "astronaut", name: "Astronaut", img: astronautImg, size: 145, orbitR: 672, period: 220, startAngle: 5.6, dir: 1, line: "", breathe: 5.2, delay: 1.2 },
  { id: "satellite", name: "Satellite", img: satelliteImg, size: 135, orbitR: 1395, period: 250, startAngle: 1.0, dir: 1, line: "", breathe: 4.8, delay: 0.9 },
];
