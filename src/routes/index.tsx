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
      {
        property: "og:image",
        content:
          "https://project--d6b1005e-7548-486a-b16e-51f22734982b.lovable.app/__l5e/assets-v1/71b788d1-ea25-4804-850b-fac2a34076a3/galaxy-map.webp",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content:
          "https://project--d6b1005e-7548-486a-b16e-51f22734982b.lovable.app/__l5e/assets-v1/71b788d1-ea25-4804-850b-fac2a34076a3/galaxy-map.webp",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <SolarSystem />;
}
