import type { SiteSettings } from "@/components/SiteShell";
import { fallbackSettings } from "@/lib/fallback-data";

export function mergeSiteSettings(
  data: Partial<SiteSettings> | null
): SiteSettings {
  if (!data) return fallbackSettings;
  return {
    ...fallbackSettings,
    ...data,
    navLinks: fallbackSettings.navLinks,
  };
}
