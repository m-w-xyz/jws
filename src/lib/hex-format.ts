/** Normalizes Sanity-entered hex strings for CSS (handles missing `#`, trims). */
export function normalizeHexColour(
  raw: string | null | undefined,
): string | undefined {
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
