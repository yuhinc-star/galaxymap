import { createFileRoute } from "@tanstack/react-router";
import { SolarSystem } from "@/components/galaxy/SolarSystem";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pocket Galaxy — Interactive Cartoon Solar System" },
      {
        name: "description",
        content:
          "A playful cartoon solar system you can drag, zoom, and tap. Planets orbit a smiling sun and talk back when you poke them.",
      },
      {
        property: "og:title",
        content: "Pocket Galaxy — Interactive Cartoon Solar System",
      },
      {
        property: "og:description",
        content:
          "A playful cartoon solar system you can drag, zoom, and tap. Planets orbit a smiling sun and talk back when you poke them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SolarSystem />;
}
