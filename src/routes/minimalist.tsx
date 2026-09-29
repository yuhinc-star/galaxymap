import { createFileRoute, Link } from "@tanstack/react-router";
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
  return (
    <>
      <GeneratorSystem />
      <Link
        to="/generator"
        className="fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-mini-line bg-mini-paper/90 px-3 py-1 font-mini text-[11px] tracking-wide text-mini-ink hover:border-mini-ink"
      >
        Galaxy mode
      </Link>
    </>
  );
}
