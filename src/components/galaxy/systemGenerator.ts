import type { BodyDef } from "./planets";
import {
  makeOrbitShape,
  mulberry32,
  ORBIT_SHAPE_KINDS,
  type OrbitShape,
  type OrbitShapeKind,
} from "./orbitShapes";
import {
  DRIFTER_SPRITES,
  MOON_SPRITES,
  PLANET_SPRITES,
  SUN_SPRITES,
} from "./spritePool";

const TAU = Math.PI * 2;

export interface GeneratedMoon extends BodyDef {
  orbitR: number;
  period: number;
  startAngle: number;
  /** SVG path of the moon's little ring, centered on (0,0). */
  ringD: string;
}

export interface GeneratedPlanet extends BodyDef {
  orbit: OrbitShape;
  period: number;
  startAngle: number;
  dash: string;
  ringWidth: number;
  ringOpacity: number;
  moons: GeneratedMoon[];
}

export interface GeneratedDrifter extends BodyDef {
  orbit: OrbitShape;
  /** Base orbit radius (kept for DrifterDef compatibility). */
  orbitR: number;
  period: number;
  startAngle: number;
  dir: 1 | -1;
}

export interface SystemConfig {
  seed: number;
  planetCount: number;
  sun: BodyDef;
  planets: GeneratedPlanet[];
  drifters: GeneratedDrifter[];
}

/** Made-up storybook names for the random planets. */
const PLANET_NAMES = [
  "Mochi", "Bimble", "Zoodle", "Pippin", "Nimbus", "Taffy", "Wobble",
  "Pickle", "Sprout", "Ziggy", "Mallow", "Bloop", "Fizzle", "Tumble",
  "Puddle", "Snicker", "Doodle", "Plop", "Widget", "Gumbo", "Sprocket",
  "Bubbles", "Noodle", "Pudding", "Scoot", "Twinkle", "Fudge", "Rascal",
];

const PLANET_LINES = [
  "I was born five seconds ago!",
  "Fresh out of the galaxy oven.",
  "My orbit is hand-drawn, you know.",
  "I contain multitudes. And paint.",
  "Roll the dice, I dare you.",
  "I'm one of a kind. Mostly.",
  "Wobbling is a lifestyle.",
  "I picked this ring myself.",
  "No two of me exist. Probably.",
  "I dream in gouache.",
  "Orbiting is my cardio.",
  "Ask me again in one revolution.",
];

const SUN_LINES = [
  "I'm the star of this brand-new show.",
  "Freshly squeezed sunshine.",
  "I keep this whole random family together.",
  "Generated, but still glorious.",
];

/**
 * Long storybook names, in the spirit of "Super Big Star 29444 Cajun
 * Cafe" — an opener, a body type, a catalog number and a quirky little
 * establishment. They stress-test the navigator and the wrapping labels.
 */
const LONG_OPENERS = [
  "Super Big", "Mega Tiny", "Ultra Round", "Hyper Happy", "Cosmic Little",
  "Grand Old", "Wobbly", "Sleepy", "Hungry", "Dancing", "Grumpy", "Jolly",
];
const LONG_TYPES = [
  "Star", "Planet", "World", "Blob", "Orb", "Rock", "Marshmallow",
  "Pancake", "Meatball", "Gumball",
];
const LONG_SUFFIXES = [
  "Cajun Cafe", "Moon Diner", "Space Bakery", "Cosmic Laundry",
  "Star Nursery", "Comet Garage", "Nebula Salon", "Orbit School",
  "Meteor Motel", "Galaxy Farm", "Astro Arcade", "Pizza Place",
  "Donut Shop", "Bowling Alley",
];

/**
 * Build a whole random solar-system-like world from a seed. Deterministic:
 * the same seed and planet count always produce the same system, so SSR
 * and hydration render identical frames.
 */
export function generateSystem(seed: number, planetCount: number): SystemConfig {
  const rand = mulberry32(seed * 7919 + planetCount * 104729);
  const pick = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(rand() * arr.length)]!;
  const shuffled = <T,>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };

  // --- Names -------------------------------------------------------------
  // ~45% of bodies get a long catalog name like "Super Big Star 29444
  // Cajun Cafe"; the rest get a short storybook name. All unique.
  const usedNames = new Set<string>();
  const uniqueName = (base: string): string => {
    if (!usedNames.has(base)) {
      usedNames.add(base);
      return base;
    }
    const numerals = ["II", "III", "IV", "V", "VI"];
    for (const n of numerals) {
      const candidate = `${base} ${n}`;
      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }
    }
    const fallback = `${base} ${Math.floor(rand() * 900) + 100}`;
    usedNames.add(fallback);
    return fallback;
  };
  const makeLongName = () =>
    uniqueName(
      `${pick(LONG_OPENERS)} ${pick(LONG_TYPES)} ${1000 + Math.floor(rand() * 98999)} ${pick(LONG_SUFFIXES)}`,
    );
  const shortNames = shuffled(PLANET_NAMES);
  let shortIdx = 0;
  const planetName = () =>
    rand() < 0.45 ? makeLongName() : uniqueName(shortNames[shortIdx++ % shortNames.length]!);

  // --- Sun -------------------------------------------------------------
  const sunSprite = pick(SUN_SPRITES);
  const sun: BodyDef = {
    id: "sun",
    name: rand() < 0.4 ? makeLongName() : sunSprite.name,
    img: sunSprite.img,
    size: 700 + rand() * 90,
    line: pick(SUN_LINES),
    breathe: 6,
    delay: 0,
  };

  // --- Planets -----------------------------------------------------------
  const sprites = shuffled(PLANET_SPRITES).slice(0, planetCount);
  // Innermost ring must clear the biggest sun (radius ~395) plus a
  // gas giant's half-width (~155), so nothing parks on the sun's face.
  const inner = 580;
  const outer = 1620;
  const gap = planetCount > 1 ? (outer - inner) / (planetCount - 1) : 0;

  const planets: GeneratedPlanet[] = sprites.map((sprite, i) => {
    const roll = rand();
    const size =
      roll < 0.25
        ? 250 + rand() * 60 // gas giant
        : roll < 0.7
          ? 150 + rand() * 65 // mid
          : 85 + rand() * 50; // small
    const orbitR = inner + gap * i + (rand() - 0.5) * 36;
    const kind: OrbitShapeKind = pick(ORBIT_SHAPE_KINDS);
    const orbit = makeOrbitShape(kind, orbitR, Math.floor(rand() * 1e9));
    const period = 14 * Math.pow(orbitR / 445, 1.35) * (0.9 + rand() * 0.2);

    // 0, 1 or 2 moons — weighted so every count shows up often.
    const moonRoll = rand();
    const moonCount = moonRoll < 0.35 ? 0 : moonRoll < 0.7 ? 1 : 2;
    const moonSprites = shuffled(MOON_SPRITES);
    const moons: GeneratedMoon[] = [];
    for (let m = 0; m < moonCount; m++) {
      const ms = moonSprites[m % moonSprites.length]!;
      const mOrbitR = size * 0.72 + 50 + m * 62;
      moons.push({
        id: `moon-${i}-${m}`,
        name: ms.name,
        img: ms.img,
        size: 44 + rand() * 26,
        orbitR: mOrbitR,
        period: 4 + rand() * 3.5,
        startAngle: rand() * TAU,
        ringD: makeOrbitShape("ring", mOrbitR, Math.floor(rand() * 1e9), 10).d,
        line: "I'm a little moon, short and stout.",
        breathe: 2.8 + rand() * 1.2,
        delay: rand() * 1.5,
      });
    }

    return {
      id: `planet-${i}-${sprite.id}`,
      name: names[i % names.length]!,
      img: sprite.img,
      size,
      orbit,
      period,
      startAngle: rand() * TAU,
      dash: `${(30 + rand() * 18).toFixed(0)} ${(20 + rand() * 12).toFixed(0)}`,
      ringWidth: 9 + rand() * 4,
      ringOpacity: 0.72 + rand() * 0.2,
      moons,
      line: pick(PLANET_LINES),
      breathe: 3 + rand() * 2.4,
      delay: rand() * 1.6,
    };
  });

  // --- Drifting friends ---------------------------------------------------
  const drifterCount = 3 + Math.floor(rand() * 3);
  const drifters: GeneratedDrifter[] = shuffled(DRIFTER_SPRITES)
    .slice(0, drifterCount)
    .map((sprite, i) => {
      const orbitR = 560 + rand() * 1180;
      return {
        id: `drifter-${i}-${sprite.id}`,
        name: sprite.name,
        img: sprite.img,
        size: 80 + rand() * 40,
        orbit: makeOrbitShape(pick(ORBIT_SHAPE_KINDS), orbitR, Math.floor(rand() * 1e9)),
        orbitR,
        period: 150 + rand() * 140,
        startAngle: rand() * TAU,
        dir: rand() < 0.5 ? -1 : 1,
        line: "",
        breathe: 3.6 + rand() * 1.8,
        delay: rand() * 1.4,
      };
    });

  return { seed, planetCount, sun, planets, drifters };
}
