import { createFileRoute } from "@tanstack/react-router";
import { GeneratorSystem } from "@/components/galaxy/GeneratorSystem";

export const Route = createFileRoute("/generator")({
  head: () => ({
    meta: [
      { title: "Orbit Study — Generative Celestial Systems" },
      {
        name: "description",
        content:
          "Explore generative celestial systems through nested orbital contours, recursive families, and an interactive minimalist canvas.",
      },
      {
        property: "og:title",
        content: "Orbit Study — Generative Celestial Systems",
      },
      {
        property: "og:description",
        content:
          "Explore generative celestial systems through nested orbital contours, recursive families, and an interactive minimalist canvas.",
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
