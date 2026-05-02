import { client, urlFor, isSanityConfigured } from "@/lib/sanity";
import { HOME_PAGE_QUERY } from "@/lib/queries";
import { getSiteSettings } from "@/lib/get-site-settings";
import { normalizeHexColour } from "@/lib/hex-format";
import HomeClient from "./HomeClient";

type RawProject = {
  _id: string;
  title?: string;
  slug?: string | null;
  projectColour?: string | null;
  description?: string;
  featuredImage?: { asset: { url: string; metadata?: { lqip?: string } } };
  hoverImage?: { asset: { url: string; metadata?: { lqip?: string } } };
};

export default async function HomePage() {
  const settings = await getSiteSettings();

  let projects: RawProject[] = [];

  if (isSanityConfigured) {
    try {
      projects = (await client.fetch(HOME_PAGE_QUERY)) ?? [];
    } catch {
      // Sanity not connected yet
    }
  }

  const featuredProjects = projects
    .filter(
      (p): p is RawProject =>
        p !== null &&
        typeof p === "object" &&
        typeof p.title === "string" &&
        p.title.trim().length > 0 &&
        Boolean(p.featuredImage),
    )
    .map((p, index) => {
      const slug = typeof p.slug === "string" && p.slug.trim() ? p.slug.trim() : null;
      const href = slug ? `/works/${slug}` : null;
      const projectColour =
        normalizeHexColour(p.projectColour ?? undefined) ?? null;

      return {
        _id: p._id,
        title: p.title as string,
        href,
        orderNumber: index + 1,
        projectColour,
        imageUrl: p.featuredImage
          ? urlFor(p.featuredImage).width(3200).quality(92).url()
          : null,
        hoverImageUrl: p.hoverImage
          ? urlFor(p.hoverImage).width(2400).quality(92).url()
          : null,
        imagePosition: (index % 2 === 0 ? "left" : "right") as "left" | "right",
        blurDataURL: p.featuredImage?.asset?.metadata?.lqip,
        hoverBlurDataURL: p.hoverImage?.asset?.metadata?.lqip,
      };
    });

  return (
    <HomeClient
      siteTitle={settings.siteTitle}
      featuredProjects={featuredProjects}
    />
  );
}
