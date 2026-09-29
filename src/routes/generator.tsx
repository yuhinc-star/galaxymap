import { createFileRoute, Link } from "@tanstack/react-router";
import { GeneratorSystem } from "@/components/galaxy-classic/GeneratorSystem";

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
  return (
    <>
      <GeneratorSystem />
      <Link
        to="/minimalist"
        className="fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 rounded-full border-2 border-white/70 bg-space-deep/80 px-4 py-1.5 font-display text-sm font-semibold text-white shadow-lg backdrop-blur hover:bg-space-deep"
      >
        Minimalist mode
      </Link>
    </>
  );
}
