import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import {
  DRIFTER_SPRITES,
  MOON_SPRITES,
  PLANET_SPRITES,
  SUN_SPRITES,
} from "@/components/galaxy/spritePool";

const spriteSchema = z.object({
  id: z.string(),
  name: z.string(),
  img: z.string().describe("Hand-painted sprite image URL."),
});

export default defineTool({
  name: "list_sprites",
  title: "List sprite cast",
  description:
    "List the full cast of hand-painted gouache sprites the generator assembles systems from — suns, planets, moons and drifting friends (rockets, astronauts, UFOs and more) — with image URLs.",
  inputSchema: {},
  outputSchema: {
    cast: z.object({
      suns: z.array(spriteSchema),
      planets: z.array(spriteSchema),
      moons: z.array(spriteSchema),
      drifters: z.array(spriteSchema),
    }),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const cast = {
      suns: SUN_SPRITES,
      planets: PLANET_SPRITES,
      moons: MOON_SPRITES,
      drifters: DRIFTER_SPRITES,
    };
    const total =
      SUN_SPRITES.length +
      PLANET_SPRITES.length +
      MOON_SPRITES.length +
      DRIFTER_SPRITES.length;
    return {
      content: [
        {
          type: "text",
          text: `${total} sprites: ${SUN_SPRITES.length} suns, ${PLANET_SPRITES.length} planets, ${MOON_SPRITES.length} moons, ${DRIFTER_SPRITES.length} drifting friends.`,
        },
      ],
      structuredContent: { cast },
    };
  },
});
