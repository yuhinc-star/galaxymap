import { defineMcp } from "@lovable.dev/mcp-js";

import generateSystemTool from "./tools/generate-system";
import listBackgroundsTool from "./tools/list-backgrounds";
import listSpritesTool from "./tools/list-sprites";

export default defineMcp({
  name: "galaxy-explorer-app",
  title: "Galaxy Explorer App",
  version: "0.1.0",
  instructions:
    "Public tools for Galaxy Explorer App, a playful hand-painted cartoon galaxy. " +
    "Use `generate_system` to create a deterministic solar-system-like world from a seed " +
    "(same seed + planet count = same world), `list_sprites` to browse the full cast of " +
    "gouache sprites, and `list_backgrounds` for the painted starfield skies. " +
    "Everything is read-only public data — no accounts, no user content.",
  tools: [generateSystemTool, listSpritesTool, listBackgroundsTool],
});
