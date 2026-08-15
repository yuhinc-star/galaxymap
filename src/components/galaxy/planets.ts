import sunImg from "@/assets/planets/sun.png";
import mercuryImg from "@/assets/planets/mercury.png";
import venusImg from "@/assets/planets/venus.png";
import earthImg from "@/assets/planets/earth.png";
import marsImg from "@/assets/planets/mars.png";
import jupiterImg from "@/assets/planets/jupiter.png";
import saturnImg from "@/assets/planets/saturn.png";
import uranusImg from "@/assets/planets/uranus.png";
import neptuneImg from "@/assets/planets/neptune.png";
import plutoImg from "@/assets/planets/pluto.png";
import moonImg from "@/assets/planets/moon.png";

export interface BodyDef {
  id: string;
  name: string;
  img: string;
  /** Display size in px (image is square, rings included). */
  size: number;
  /** Orbit radius from the sun in px. 0 = sits at the center. */
  orbit: number;
  /** Angular speed in radians per second. */
  speed: number;
  /** Starting angle in radians. */
  phase: number;
  /** What it says when tapped. */
  line: string;
}

export const WORLD = 2700;
export const CENTER = WORLD / 2;

export const SUN: BodyDef = {
  id: "sun",
  name: "Sun",
  img: sunImg,
  size: 340,
  orbit: 0,
  speed: 0,
  phase: 0,
  line: "I'm the star of the show. Literally.",
};

export const PLANETS: BodyDef[] = [
  { id: "mercury", name: "Mercury", img: mercuryImg, size: 52, orbit: 250, speed: 0.22, phase: 0.6, line: "Fastest planet in the club!" },
  { id: "venus", name: "Venus", img: venusImg, size: 74, orbit: 340, speed: 0.17, phase: 2.4, line: "Hottest around — and it's not close." },
  { id: "earth", name: "Earth", img: earthImg, size: 84, orbit: 440, speed: 0.135, phase: 4.4, line: "You are here. Hi!" },
  { id: "mars", name: "Mars", img: marsImg, size: 64, orbit: 540, speed: 0.11, phase: 1.4, line: "One day I'll have wifi." },
  { id: "jupiter", name: "Jupiter", img: jupiterImg, size: 160, orbit: 690, speed: 0.075, phase: 5.6, line: "Biggest planet. Humble too." },
  { id: "saturn", name: "Saturn", img: saturnImg, size: 150, orbit: 850, speed: 0.06, phase: 3.1, line: "These rings? All natural." },
  { id: "uranus", name: "Uranus", img: uranusImg, size: 108, orbit: 990, speed: 0.048, phase: 0.2, line: "I roll sideways through life." },
  { id: "neptune", name: "Neptune", img: neptuneImg, size: 100, orbit: 1120, speed: 0.04, phase: 2.0, line: "Brrr… it's windy out here." },
  { id: "pluto", name: "Pluto", img: plutoImg, size: 44, orbit: 1240, speed: 0.033, phase: 4.9, line: "Still a planet in my heart." },
];

/** The Moon circles Earth instead of the Sun. */
export const MOON: BodyDef = {
  id: "moon",
  name: "Moon",
  img: moonImg,
  size: 34,
  orbit: 70,
  speed: 0.8,
  phase: 1.0,
  line: "I only shine at night.",
};
