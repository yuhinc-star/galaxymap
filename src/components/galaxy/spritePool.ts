import sunImg from "@/assets/planets/sun.png";
import sun2Img from "@/assets/planets/sun-2.png";
import sun3Img from "@/assets/planets/sun-3.png";
import sun4Img from "@/assets/planets/sun-4.png";
import sun5Img from "@/assets/planets/sun-5.png";
import mercuryImg from "@/assets/planets/mercury.png";
import venusImg from "@/assets/planets/venus.png";
import earthImg from "@/assets/planets/earth.png";
import marsImg from "@/assets/planets/mars.png";
import jupiterImg from "@/assets/planets/jupiter.png";
import saturnImg from "@/assets/planets/saturn.png";
import uranusImg from "@/assets/planets/uranus.png";
import neptuneImg from "@/assets/planets/neptune.png";
import plutoImg from "@/assets/planets/pluto.png";
import planetMintImg from "@/assets/planets/planet-mint.png";
import planetLavenderImg from "@/assets/planets/planet-lavender.png";
import planetTangerineImg from "@/assets/planets/planet-tangerine.png";
import planetDottealImg from "@/assets/planets/planet-dotteal.png";
import planetCrimsonImg from "@/assets/planets/planet-crimson.png";
import planetLemonImg from "@/assets/planets/planet-lemon.png";
import planetSkyImg from "@/assets/planets/planet-sky.png";
import planetGrapeImg from "@/assets/planets/planet-grape.png";
import planetLimeImg from "@/assets/planets/planet-lime.png";
import planetCocoaImg from "@/assets/planets/planet-cocoa.png";
import planetFrostImg from "@/assets/planets/planet-frost.png";
import planetMagentaImg from "@/assets/planets/planet-magenta.png";
import planetStormImg from "@/assets/planets/planet-storm.png";
import planetPeachImg from "@/assets/planets/planet-peach.png";
import planetEmeraldImg from "@/assets/planets/planet-emerald.png";
import moonImg from "@/assets/planets/moon.png";
import moonLavenderImg from "@/assets/planets/moon-lavender.png";
import moonPeachImg from "@/assets/planets/moon-peach.png";
import moonMintImg from "@/assets/planets/moon-mint.png";
import moonGoldImg from "@/assets/planets/moon-gold.png";
import rocketImg from "@/assets/planets/rocket.png";
import astronautImg from "@/assets/planets/astronaut.png";
import satelliteImg from "@/assets/planets/satellite.png";
import ufoImg from "@/assets/planets/ufo.png";
import alienImg from "@/assets/planets/alien.png";
import shootingStarImg from "@/assets/planets/shooting-star.png";
import capsuleImg from "@/assets/planets/capsule.png";
import probeImg from "@/assets/planets/probe.png";
import drifterCometImg from "@/assets/planets/drifter-comet.png";
import drifterRoverImg from "@/assets/planets/drifter-rover.png";
import drifterCatImg from "@/assets/planets/drifter-cat.png";
import drifterTelescopeImg from "@/assets/planets/drifter-telescope.png";

export interface SpriteOption {
  id: string;
  name: string;
  img: string;
}

/**
 * The full cast of hand-painted gouache sprites the generator assembles
 * systems from: 5 suns, 24 planets, 5 moons and 12 drifting friends.
 */
export const SUN_SPRITES: SpriteOption[] = [
  { id: "sun", name: "Sun", img: sunImg },
  { id: "sun-2", name: "Coral Sun", img: sun2Img },
  { id: "sun-3", name: "Lemon Sun", img: sun3Img },
  { id: "sun-4", name: "Rose Sun", img: sun4Img },
  { id: "sun-5", name: "Amber Sun", img: sun5Img },
];

export const PLANET_SPRITES: SpriteOption[] = [
  { id: "mercury", name: "Mercury", img: mercuryImg },
  { id: "venus", name: "Venus", img: venusImg },
  { id: "earth", name: "Earth", img: earthImg },
  { id: "mars", name: "Mars", img: marsImg },
  { id: "jupiter", name: "Jupiter", img: jupiterImg },
  { id: "saturn", name: "Saturn", img: saturnImg },
  { id: "uranus", name: "Uranus", img: uranusImg },
  { id: "neptune", name: "Neptune", img: neptuneImg },
  { id: "pluto", name: "Pluto", img: plutoImg },
  { id: "mint", name: "Mint", img: planetMintImg },
  { id: "lavender", name: "Lavender", img: planetLavenderImg },
  { id: "tangerine", name: "Tangerine", img: planetTangerineImg },
  { id: "dotteal", name: "Dotteal", img: planetDottealImg },
  { id: "crimson", name: "Crimson", img: planetCrimsonImg },
  { id: "lemon", name: "Lemon", img: planetLemonImg },
  { id: "sky", name: "Sky", img: planetSkyImg },
  { id: "grape", name: "Grape", img: planetGrapeImg },
  { id: "lime", name: "Lime", img: planetLimeImg },
  { id: "cocoa", name: "Cocoa", img: planetCocoaImg },
  { id: "frost", name: "Frost", img: planetFrostImg },
  { id: "magenta", name: "Magenta", img: planetMagentaImg },
  { id: "storm", name: "Storm", img: planetStormImg },
  { id: "peach", name: "Peach", img: planetPeachImg },
  { id: "emerald", name: "Emerald", img: planetEmeraldImg },
];

export const MOON_SPRITES: SpriteOption[] = [
  { id: "moon", name: "Moon", img: moonImg },
  { id: "moon-lavender", name: "Lune", img: moonLavenderImg },
  { id: "moon-peach", name: "Pip", img: moonPeachImg },
  { id: "moon-mint", name: "Nib", img: moonMintImg },
  { id: "moon-gold", name: "Glim", img: moonGoldImg },
];

export const DRIFTER_SPRITES: SpriteOption[] = [
  { id: "rocket", name: "Rocket", img: rocketImg },
  { id: "astronaut", name: "Astronaut", img: astronautImg },
  { id: "satellite", name: "Satellite", img: satelliteImg },
  { id: "ufo", name: "UFO", img: ufoImg },
  { id: "alien", name: "Alien", img: alienImg },
  { id: "shooting-star", name: "Shooting Star", img: shootingStarImg },
  { id: "capsule", name: "Capsule", img: capsuleImg },
  { id: "probe", name: "Probe", img: probeImg },
  { id: "comet", name: "Comet", img: drifterCometImg },
  { id: "rover", name: "Rover", img: drifterRoverImg },
  { id: "space-cat", name: "Space Cat", img: drifterCatImg },
  { id: "telescope", name: "Telescope", img: drifterTelescopeImg },
];
