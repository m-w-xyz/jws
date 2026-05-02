import { cache } from "react";
import { client, isSanityConfigured } from "@/lib/sanity";
import { SITE_SETTINGS_QUERY } from "@/lib/queries";
import { mergeSiteSettings } from "@/lib/site-settings";
import { fallbackSettings } from "@/lib/fallback-data";

export const getSiteSettings = cache(async () => {
  if (!isSanityConfigured) return fallbackSettings;
  try {
    const data = await client.fetch(SITE_SETTINGS_QUERY);
    return mergeSiteSettings(data);
  } catch {
    return fallbackSettings;
  }
});
