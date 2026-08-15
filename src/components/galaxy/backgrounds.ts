import bgIndigo from "@/assets/bg/bg-indigo.jpg";
import bgNebula from "@/assets/bg/bg-nebula.jpg";
import bgPlum from "@/assets/bg/bg-plum.jpg";
import bgViolet from "@/assets/bg/bg-violet.jpg";

export interface SkyBackground {
  name: string;
  src: string;
}

/**
 * Hand-painted gouache starfields generated in the exact style of the
 * user's reference posters — dense candy stars, sparkle crosses, spiral
 * swirls and comets over deep purple skies.
 */
export const BACKGROUNDS: SkyBackground[] = [
  { name: "Violet Sky", src: bgViolet },
  { name: "Indigo Night", src: bgIndigo },
  { name: "Plum Dusk", src: bgPlum },
  { name: "Nebula Drift", src: bgNebula },
];
