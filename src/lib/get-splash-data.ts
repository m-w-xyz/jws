import { cache } from "react";
import { client, isSanityConfigured } from "@/lib/sanity";
import { SPLASH_PAGE_QUERY } from "@/lib/queries";

export type SplashData = {
  backgroundColour: string;
  taglinePrefix: string;
  cyclingWords: string[];
};

const FALLBACK: SplashData = {
  backgroundColour: "#8f392b",
  taglinePrefix: "Objects of",
  cyclingWords: ["intrigue", "desire", "curiosity"],
};

export const getSplashData = cache(async (): Promise<SplashData | null> => {
  if (!isSanityConfigured) return null;
  try {
    const data = await client.fetch(SPLASH_PAGE_QUERY);
    if (!data) return null;
    return {
      backgroundColour: data.backgroundColour || FALLBACK.backgroundColour,
      taglinePrefix: data.taglinePrefix || FALLBACK.taglinePrefix,
      cyclingWords:
        data.cyclingWords?.length > 0
          ? data.cyclingWords
          : FALLBACK.cyclingWords,
    };
  } catch {
    return null;
  }
});
