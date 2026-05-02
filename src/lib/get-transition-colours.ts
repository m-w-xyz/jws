import { cache } from "react";
import { client, isSanityConfigured } from "@/lib/sanity";
import { normalizeHexColour } from "@/lib/hex-format";

export const DEFAULT_SPLASH_COLOUR = "#8f392b";

export type TransitionColours = {
  splashColour: string;
  projectColours: Record<string, string>;
};

export { invertHexColourRgb, normalizeHexColour } from "@/lib/hex-format";

export const getTransitionColours = cache(
  async (): Promise<TransitionColours> => {
    const fallback: TransitionColours = {
      splashColour: DEFAULT_SPLASH_COLOUR,
      projectColours: {},
    };
    if (!isSanityConfigured) return fallback;
    try {
      // Skip Next.js's fetch cache so freshly-edited colours in Sanity Studio
      // show up on the next page load without waiting for a redeploy.
      const fetchOpts = { cache: "no-store" as const };
      const splash = await client.fetch<{ backgroundColour?: string } | null>(
        /* groq */ `*[_type == "splashPage"][0]{ backgroundColour }`,
        {},
        fetchOpts
      );
      const rows =
        await client.fetch<
          { slug: string | null; projectColour?: string | null }[]
        >(
          /* groq */ `*[_type == "project" && defined(slug.current)]{
            "slug": slug.current,
            projectColour
          }`,
          {},
          fetchOpts
        );
      const projectColours: Record<string, string> = {};
      for (const row of rows ?? []) {
        if (!row.slug) continue;
        const normalized = normalizeHexColour(row.projectColour ?? undefined);
        if (normalized) projectColours[row.slug] = normalized;
      }
      return {
        splashColour:
          normalizeHexColour(splash?.backgroundColour) ?? fallback.splashColour,
        projectColours,
      };
    } catch {
      return fallback;
    }
  }
);
