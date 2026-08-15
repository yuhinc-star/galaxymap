import { createFileRoute } from "@tanstack/react-router";
import { GeneratorSystem } from "@/components/galaxy/GeneratorSystem";

export const Route = createFileRoute("/generator")({
  head: () => ({
    meta: [
      { title: "Galaxy Generator — Random Cartoon Solar Systems" },
      {
        name: "description",
        content:
          "Roll the dice and assemble a brand-new hand-painted solar system: random suns, planets, moons and wobbly orbits, all in a cute gouache cartoon style.",
      },
      {
        property: "og:title",
        content: "Galaxy Generator — Random Cartoon Solar Systems",
      },
      {
        property: "og:description",
        content:
          "Roll the dice and assemble a brand-new hand-painted solar system: random suns, planets, moons and wobbly orbits, all in a cute gouache cartoon style.",
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
