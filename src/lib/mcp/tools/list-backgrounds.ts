import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { BACKGROUNDS } from "@/components/galaxy/backgrounds";

export default defineTool({
  name: "list_backgrounds",
  title: "List sky backgrounds",
  description:
    "List the hand-painted gouache starfield backgrounds the app can use as the sky, with full-size and small-screen image URLs.",
  inputSchema: {},
  outputSchema: {
    backgrounds: z.array(
      z.object({
        name: z.string(),
        src: z.string().describe("Full-size painted sky image URL."),
        srcSm: z.string().describe("Small-screen (1280px) image URL."),
      }),
    ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: `${BACKGROUNDS.length} sky backgrounds: ${BACKGROUNDS.map((b) => b.name).join(", ")}.`,
      },
    ],
    structuredContent: { backgrounds: BACKGROUNDS },
  }),
});
