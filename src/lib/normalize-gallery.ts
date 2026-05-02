import {
  resolveGalleryVideoUrl,
  type ResolvedGalleryVideo,
} from "@/lib/gallery-video";

type ImageAsset = {
  _id: string;
  url: string;
  metadata?: {
    lqip?: string;
    dimensions?: { width: number; height: number };
  };
};

export type SanityGalleryRow = {
  _key: string;
  _type?: string;
  url?: string;
  asset?: ImageAsset | null;
  thumbnail?: { asset?: ImageAsset | null } | null;
};

export type NormalizedGalleryItem =
  | { _key: string; kind: "image"; asset: ImageAsset }
  | {
      _key: string;
      kind: "video";
      resolved: ResolvedGalleryVideo;
      posterAsset?: ImageAsset | null;
    };

export function normalizeGalleryItems(
  rows: SanityGalleryRow[] | null | undefined,
): NormalizedGalleryItem[] {
  if (!rows?.length) return [];
  const out: NormalizedGalleryItem[] = [];
  for (const row of rows) {
    if (row._type === "galleryVideo" && row.url) {
      const resolved = resolveGalleryVideoUrl(row.url);
      if (!resolved) continue;
      out.push({
        _key: row._key,
        kind: "video",
        resolved,
        posterAsset: row.thumbnail?.asset ?? undefined,
      });
      continue;
    }
    if (row.asset?.url) {
      out.push({
        _key: row._key,
        kind: "image",
        asset: row.asset,
      });
    }
  }
  return out;
}
