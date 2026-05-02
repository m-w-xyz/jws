export type CvRow = {
  _key: string;
  year: string;
  name: string;
  link?: string;
};

type RawCv = {
  _key?: string;
  year?: string;
  name?: string;
  link?: string;
  entry?: string;
  entries?: string[];
};

function safeExternalUrl(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  return /^https?:\/\//i.test(t) ? t : undefined;
}

function yearSortKey(y: string): number {
  const m = y.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Flattens legacy Sanity shapes and sorts newest year first. */
export function normalizeAndSortCvItems(raw: RawCv[] | undefined): CvRow[] {
  if (!raw?.length) return [];
  const rows: CvRow[] = [];
  for (const item of raw) {
    const key = item._key ?? `row-${rows.length}`;
    const year = item.year ?? "";
    if (item.name?.trim()) {
      rows.push({
        _key: key,
        year,
        name: item.name.trim(),
        link: safeExternalUrl(item.link),
      });
      continue;
    }
    if (item.entry?.trim()) {
      rows.push({
        _key: key,
        year,
        name: item.entry.trim(),
        link: safeExternalUrl(item.link),
      });
      continue;
    }
    if (item.entries?.length) {
      item.entries.forEach((text, i) => {
        if (!text?.trim()) return;
        rows.push({
          _key: `${key}-${i}`,
          year,
          name: text.trim(),
          link: undefined,
        });
      });
    }
  }
  rows.sort((a, b) => yearSortKey(b.year) - yearSortKey(a.year));
  return rows;
}
