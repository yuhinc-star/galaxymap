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
import ufoImg from "@/assets/planets/ufo.png";
import alienImg from "@/assets/planets/alien.png";
import shootingStarImg from "@/assets/planets/shooting-star.png";
import capsuleImg from "@/assets/planets/capsule.png";
import probeImg from "@/assets/planets/probe.png";

/** Square world size in px; the Sun sits at the center. */
export const WORLD = 4650;
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
  size: 700,
  line: "I'm the star of the show. Literally.",
  breathe: 6,
  delay: 0,
};

/**
 * Proportions measured from the original reference poster, anchored on
 * Jupiter = 280: Sun 2.5x Jupiter (the dominant central mass), Earth 0.84x,
 * Saturn 0.72x ring-span, Uranus 0.64x, Venus 0.55x, Neptune 0.53x,
 * Mars 0.47x, Mercury 0.36x, Pluto 0.24x. Ring gaps stay ~one planet
 * diameter so bodies overlap their own dashes — cozy, never astronomical.
 */
export const PLANETS: PlanetDef[] = [
  { id: "mercury", name: "Mercury", img: mercuryImg, size: 100, orbitR: 445, period: 14, startAngle: 0.6, line: "Fastest planet in the club!", breathe: 3.4, delay: 0.6 },
  { id: "venus", name: "Venus", img: venusImg, size: 155, orbitR: 600, period: 22, startAngle: 2.4, line: "Hottest around — and it's not close.", breathe: 4.1, delay: 1.3 },
  { id: "earth", name: "Earth", img: earthImg, size: 235, orbitR: 820, period: 32, startAngle: 4.1, line: "You are here. Hi!", breathe: 4.6, delay: 0.2 },
  { id: "mars", name: "Mars", img: marsImg, size: 130, orbitR: 1030, period: 44, startAngle: 5.3, line: "One day I'll have wifi.", breathe: 3.8, delay: 1.7 },
  { id: "jupiter", name: "Jupiter", img: jupiterImg, size: 280, orbitR: 1260, period: 70, startAngle: 1.2, line: "Biggest planet. Humble too.", breathe: 5.6, delay: 0.4 },
  { id: "saturn", name: "Saturn", img: saturnImg, size: 200, orbitR: 1525, period: 95, startAngle: 3.3, line: "These rings? All natural.", breathe: 4.9, delay: 1.1 },
  { id: "uranus", name: "Uranus", img: uranusImg, size: 180, orbitR: 1740, period: 125, startAngle: 5.9, line: "I roll sideways through life.", breathe: 4.4, delay: 0.8 },
  { id: "neptune", name: "Neptune", img: neptuneImg, size: 150, orbitR: 1930, period: 155, startAngle: 2.0, line: "Brrr… it's windy out here.", breathe: 4.2, delay: 1.5 },
  { id: "pluto", name: "Pluto", img: plutoImg, size: 68, orbitR: 2065, period: 190, startAngle: 4.6, line: "Still a planet in my heart.", breathe: 3.0, delay: 0.3 },
];

/** The Moon circles Earth instead of the Sun. */
export const MOON = {
  id: "moon",
  name: "Moon",
  img: moonImg,
  size: 58,
  orbitR: 165,
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
 * astronaut and UFO in the reference posters. Small-planet scale
 * (~Mercury-sized) so they read as visitors, not rivals to the planets.
 * They render behind the planets and occasionally pass behind one.
 * Non-interactive.
 */
export const DRIFTERS: DrifterDef[] = [
  { id: "rocket", name: "Rocket", img: rocketImg, size: 110, orbitR: 1395, period: 170, startAngle: 2.9, dir: -1, line: "", breathe: 4.4, delay: 0.5 },
  { id: "astronaut", name: "Astronaut", img: astronautImg, size: 100, orbitR: 1635, period: 220, startAngle: 5.6, dir: 1, line: "", breathe: 5.2, delay: 1.2 },
  { id: "satellite", name: "Satellite", img: satelliteImg, size: 95, orbitR: 2000, period: 250, startAngle: 1.0, dir: 1, line: "", breathe: 4.8, delay: 0.9 },
  { id: "ufo", name: "UFO", img: ufoImg, size: 115, orbitR: 1835, period: 200, startAngle: 3.9, dir: -1, line: "", breathe: 5.0, delay: 0.3 },
  { id: "alien", name: "Alien", img: alienImg, size: 78, orbitR: 925, period: 240, startAngle: 0.4, dir: 1, line: "", breathe: 3.6, delay: 1.6 },
  { id: "shooting-star", name: "Shooting Star", img: shootingStarImg, size: 105, orbitR: 1145, period: 150, startAngle: 4.8, dir: -1, line: "", breathe: 4.0, delay: 0.7 },
  { id: "capsule", name: "Capsule", img: capsuleImg, size: 90, orbitR: 710, period: 195, startAngle: 1.9, dir: 1, line: "", breathe: 4.7, delay: 1.0 },
  { id: "probe", name: "Probe", img: probeImg, size: 90, orbitR: 2175, period: 275, startAngle: 5.1, dir: -1, line: "", breathe: 5.4, delay: 0.4 },
];
