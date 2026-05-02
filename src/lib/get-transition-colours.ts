import { cache } from "react";
import { client, isSanityConfigured } from "@/lib/sanity";

export const DEFAULT_SPLASH_COLOUR = "#8f392b";

export type TransitionColours = {
  splashColour: string;
  projectColours: Record<string, string>;
};

/** Normalizes Sanity-entered hex strings for CSS (handles missing `#`, trims). */
export function normalizeHexColour(raw: string | null | undefined): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (/^#[0-9a-f]{3}$/i.test(s) || /^#[0-9a-f]{6}$/i.test(s))
    return s.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s.toLowerCase()}`;
  if (/^[0-9a-f]{3}$/i.test(s)) return `#${s.toLowerCase()}`;
  return s.startsWith("#") ? s : undefined;
}

/** Expand `#abc` → `#aabbcc` (lowercase). */
function expandHexToSixDigits(normalized: string): string | undefined {
  const h = normalized.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(h)) return h.toLowerCase();
  if (/^[0-9a-f]{3}$/i.test(h)) {
    return h
      .toLowerCase()
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return undefined;
}

/**
 * Per-channel RGB invert (e.g. project page text selection vs project accent).
 */
export function invertHexColourRgb(
  raw: string | null | undefined,
): string | undefined {
  const n = normalizeHexColour(raw ?? undefined);
  if (!n) return undefined;
  const full = expandHexToSixDigits(n);
  if (!full) return undefined;
  const num = Number.parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const invR = 255 - r;
  const invG = 255 - g;
  const invB = 255 - b;
  return `#${invR.toString(16).padStart(2, "0")}${invG.toString(16).padStart(2, "0")}${invB.toString(16).padStart(2, "0")}`;
}

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
