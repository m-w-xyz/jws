import { client, urlFor, isSanityConfigured } from "@/lib/sanity";
import { ABOUT_PAGE_QUERY } from "@/lib/queries";
import { normalizeAndSortCvItems, type CvRow } from "@/lib/about-cv";

type RawCvItem = {
  _key: string;
  year?: string;
  name?: string;
  link?: string;
  entry?: string;
  entries?: string[];
};

type AboutQueryResult = {
  portrait?: {
    asset: {
      url: string;
      metadata?: { lqip?: string };
    };
  };
  bio: string;
  exhibitions: RawCvItem[];
  competitions: RawCvItem[];
  residencies: RawCvItem[];
  publications: RawCvItem[];
};

export type AboutPagePayload = {
  bio: string;
  portraitSrc: string | null;
  portraitBlur: string | null;
  exhibitions: CvRow[];
  competitions: CvRow[];
  residencies: CvRow[];
  publications: CvRow[];
};

export async function getAboutPagePayload(): Promise<AboutPagePayload | null> {
  if (!isSanityConfigured) return null;
  try {
    const about = await client.fetch<AboutQueryResult | null>(
      ABOUT_PAGE_QUERY,
    );
    if (!about) return null;

    const portraitSrc =
      about.portrait?.asset?.url != null
        ? urlFor(about.portrait).width(900).quality(85).url()
        : null;

    return {
      bio: about.bio ?? "",
      portraitSrc,
      portraitBlur: about.portrait?.asset?.metadata?.lqip ?? null,
      exhibitions: normalizeAndSortCvItems(about.exhibitions),
      competitions: normalizeAndSortCvItems(about.competitions),
      residencies: normalizeAndSortCvItems(about.residencies),
      publications: normalizeAndSortCvItems(about.publications),
    };
  } catch {
    return null;
  }
}
