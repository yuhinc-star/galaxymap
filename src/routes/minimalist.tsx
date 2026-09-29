import { createFileRoute } from "@tanstack/react-router";
import { GeneratorSystem } from "@/components/galaxy/GeneratorSystem";

export const Route = createFileRoute("/minimalist")({
  head: () => ({
    meta: [
      { title: "Orbit Study — Generative Node Systems" },
      {
        name: "description",
        content:
          "Explore generative node systems through nested contours, recursive structures, and an interactive minimalist canvas.",
      },
      {
        property: "og:title",
        content: "Orbit Study — Generative Node Systems",
      },
      {
        property: "og:description",
        content:
          "Explore generative node systems through nested contours, recursive structures, and an interactive minimalist canvas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Generator,
});

function Generator() {
  return <GeneratorSystem />;
}
