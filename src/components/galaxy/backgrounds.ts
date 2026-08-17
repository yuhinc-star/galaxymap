import bgEmber from "@/assets/bg/bg-ember.jpg";
import bgEmberSm from "@/assets/bg/bg-ember-sm.jpg";
import bgIndigo from "@/assets/bg/bg-indigo.jpg";
import bgIndigoSm from "@/assets/bg/bg-indigo-sm.jpg";
import bgLagoon from "@/assets/bg/bg-lagoon.jpg";
import bgLagoonSm from "@/assets/bg/bg-lagoon-sm.jpg";
import bgNebula from "@/assets/bg/bg-nebula.jpg";
import bgNebulaSm from "@/assets/bg/bg-nebula-sm.jpg";
import bgPlum from "@/assets/bg/bg-plum.jpg";
import bgPlumSm from "@/assets/bg/bg-plum-sm.jpg";
import bgRosewood from "@/assets/bg/bg-rosewood.jpg";
import bgRosewoodSm from "@/assets/bg/bg-rosewood-sm.jpg";
import bgViolet from "@/assets/bg/bg-violet.jpg";
import bgVioletSm from "@/assets/bg/bg-violet-sm.jpg";

export interface SkyBackground {
  name: string;
  src: string;
  /** 1280px variant small screens pick via srcSet — a quarter of the
      full-size decode cost. */
  srcSm: string;
}

/**
 * Hand-painted gouache sky fields: deep matte colour washes with organic
 * brush-dragged mottling and nothing else.
 *
 * Deliberately star-free. Painting stars into the sheet is what made the
 * old skies read as one tiled image copy-pasted across the world — the eye
 * catches a repeated cluster instantly. Every star, sparkle, swirl and
 * comet now comes from the animated <Starfield> canvas, which scatters
 * them at random over the whole world, so the sky never repeats.
 */
export const BACKGROUNDS: SkyBackground[] = [
  { name: "Violet Sky", src: bgViolet, srcSm: bgVioletSm },
  { name: "Indigo Night", src: bgIndigo, srcSm: bgIndigoSm },
  { name: "Plum Dusk", src: bgPlum, srcSm: bgPlumSm },
  { name: "Nebula Drift", src: bgNebula, srcSm: bgNebulaSm },
  { name: "Lagoon Deep", src: bgLagoon, srcSm: bgLagoonSm },
  { name: "Rosewood", src: bgRosewood, srcSm: bgRosewoodSm },
  { name: "Ember Dust", src: bgEmber, srcSm: bgEmberSm },
];
