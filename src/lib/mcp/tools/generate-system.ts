import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import {
  generateSystem,
  MAX_SYSTEM_PLANETS,
  type GeneratedMoon,
  type GeneratedPlanet,
} from "@/components/galaxy/systemGenerator";

interface MoonSpec {
  id: string;
  name: string;
  size: number;
  img: string;
  line: string;
  orbitRadius: number;
  orbitPeriodSeconds: number;
  moons: MoonSpec[];
}

interface PlanetSpec {
  id: string;
  name: string;
  size: number;
  img: string;
  line: string;
  orbitShape: string;
  orbitRadius: number;
  orbitPeriodSeconds: number;
  moons: MoonSpec[];
}

const round = (n: number) => Math.round(n * 100) / 100;

const mapMoon = (m: GeneratedMoon): MoonSpec => ({
  id: m.id,
  name: m.name,
  size: round(m.size),
  img: m.img,
  line: m.line,
  orbitRadius: round(m.orbitR),
  orbitPeriodSeconds: round(m.period),
  moons: m.moons.map(mapMoon),
});

const mapPlanet = (p: GeneratedPlanet): PlanetSpec => ({
  id: p.id,
  name: p.name,
  size: round(p.size),
  img: p.img,
  line: p.line,
  orbitShape: p.orbit.kind,
  orbitRadius: round(p.orbit.maxR),
  orbitPeriodSeconds: round(p.period),
  moons: p.moons.map(mapMoon),
});

const bodyFields = {
  id: z.string().describe("Stable body id within the system."),
  name: z.string().describe("Storybook display name."),
  size: z.number().describe("Sprite diameter in world pixels."),
  img: z.string().describe("Hand-painted sprite image URL."),
  line: z.string().describe("The body's speech-bubble catchphrase."),
};

const moonSchema = z.object({
  ...bodyFields,
  orbitRadius: z.number().describe("Radius of the moon's little ring, in world pixels."),
  orbitPeriodSeconds: z.number().describe("Seconds per revolution around its parent."),
  moons: z
    .array(z.unknown())
    .describe("Nested mini-moons (empty for a freshly generated system)."),
});

const planetSchema = z.object({
  ...bodyFields,
  orbitShape: z
    .string()
    .describe("Wobbly orbit family: ring, egg, bean, peanut, tilt or wobble."),
  orbitRadius: z.number().describe("Largest orbit radius in world pixels."),
  orbitPeriodSeconds: z.number().describe("Seconds per revolution around the sun."),
  moons: z.array(moonSchema),
});

const drifterSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  img: z.string(),
  orbitShape: z.string(),
  orbitRadius: z.number(),
  orbitPeriodSeconds: z.number(),
  direction: z.string().describe("clockwise or counterclockwise."),
});

export default defineTool({
  name: "generate_system",
  title: "Generate a solar system",
  description:
    "Create a deterministic cartoon solar-system-like world from a seed: a sun, hand-painted planets (some with moons) on wobbly storybook orbits, and drifting friends. The same seed and planet count always return the same system.",
  inputSchema: {
    seed: z
      .number()
      .int()
      .optional()
      .describe(
        "Integer seed for the world. Omit for a fresh random seed. Reuse a seed to get the exact same system back.",
      ),
    planetCount: z
      .number()
      .int()
      .optional()
      .describe(
        `How many planets the system should have (1-${MAX_SYSTEM_PLANETS}). Defaults to 4; values outside the range are clamped.`,
      ),
  },
  outputSchema: {
    system: z.object({
      seed: z.number(),
      planetCount: z.number(),
      sun: z.object(bodyFields),
      planets: z.array(planetSchema),
      drifters: z.array(drifterSchema),
    }),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: ({ seed, planetCount }) => {
    const usedSeed = seed ?? Math.floor(Math.random() * 1_000_000_000);
    const count = Math.max(
      1,
      Math.min(MAX_SYSTEM_PLANETS, Math.round(planetCount ?? 4)),
    );
    const system = generateSystem(usedSeed, count);

    const spec = {
      seed: system.seed,
      planetCount: system.planets.length,
      sun: {
        id: system.sun.id,
        name: system.sun.name,
        size: round(system.sun.size),
        img: system.sun.img,
        line: system.sun.line,
      },
      planets: system.planets.map(mapPlanet),
      drifters: system.drifters.map((d) => ({
        id: d.id,
        name: d.name,
        size: round(d.size),
        img: d.img,
        orbitShape: d.orbit.kind,
        orbitRadius: round(d.orbit.maxR),
        orbitPeriodSeconds: round(d.period),
        direction: d.dir === 1 ? "clockwise" : "counterclockwise",
      })),
    };

    const moonTotal = system.planets.reduce((n, p) => n + p.moons.length, 0);
    const planetNames = system.planets.map((p) => p.name).join(", ");
    const text =
      `System #${system.seed}: sun "${system.sun.name}", ` +
      `${system.planets.length} planets (${planetNames}), ` +
      `${moonTotal} moons, ${system.drifters.length} drifting friends.`;

    return {
      content: [{ type: "text", text }],
      structuredContent: { system: spec },
    };
  },
});
