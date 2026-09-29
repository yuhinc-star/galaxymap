interface MinimalBodyCopy {
  id: string;
  asleep?: boolean;
}

/** Compact observational copy for the orbit study. No character voice. */
export function minimalNodeDescription(body: MinimalBodyCopy, kindLabel?: string) {
  const generation = body.id.match(/^deep-moon-(\d+)/)?.[1];
  const role =
    body.id === "sun"
      ? "PRIMARY"
      : generation
        ? `G${generation}`
        : "NODE";
  return `${role} / ${body.asleep ? "SLEEPING" : "AWAKE"}`;
}