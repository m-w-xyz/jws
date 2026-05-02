/**
 * Turns a pasted video URL into something we can embed minimally (no controls /
 * Vimeo chrome) with autoplay + muted audio.
 */

export type ResolvedGalleryVideo =
  | { embedType: "iframe"; src: string; title: string }
  | { embedType: "file"; src: string };

function parseYoutubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id?.length === 11 ? id : null;
  }
  if (!url.hostname.includes("youtube.com")) return null;
  if (url.pathname.startsWith("/embed/")) {
    const id = url.pathname.split("/")[2]?.split("?")[0];
    return id && id.length === 11 ? id : null;
  }
  if (url.pathname.startsWith("/shorts/")) {
    const id = url.pathname.split("/")[2]?.split("?")[0];
    return id && id.length === 11 ? id : null;
  }
  const v = url.searchParams.get("v");
  return v && v.length === 11 ? v : null;
}

function parseVimeo(
  url: URL,
): { id: string; hash?: string } | null {
  if (url.hostname === "player.vimeo.com" && url.pathname.startsWith("/video/")) {
    const id = url.pathname.replace("/video/", "").split("/")[0];
    if (!/^\d+$/.test(id)) return null;
    const h = url.searchParams.get("h") ?? undefined;
    return { id, hash: h };
  }
  if (url.hostname !== "vimeo.com" && url.hostname !== "www.vimeo.com") {
    return null;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  // vimeo.com/video/123456 or vimeo.com/video/123456/privacyHash
  if (parts[0] === "video") {
    const id = parts[1];
    if (!id || !/^\d+$/.test(id)) return null;
    const hash =
      parts[2] && /^[a-zA-Z0-9]+$/i.test(parts[2]) ? parts[2] : undefined;
    return { id, hash };
  }

  const id = parts[0];
  if (!/^\d+$/.test(id)) return null;
  const hash =
    parts[1] && /^[a-zA-Z0-9]+$/i.test(parts[1]) ? parts[1] : undefined;
  return { id, hash };
}

function isLikelyDirectVideoFile(href: string): boolean {
  try {
    const u = new URL(href);
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname);
  } catch {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(href);
  }
}

export function resolveGalleryVideoUrl(raw: string): ResolvedGalleryVideo | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const youtubeId = parseYoutubeId(url);
  if (youtubeId) {
    const q = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      modestbranding: "1",
      playsinline: "1",
      rel: "0",
      loop: "1",
      playlist: youtubeId,
    });
    return {
      embedType: "iframe",
      src: `https://www.youtube.com/embed/${youtubeId}?${q.toString()}`,
      title: "",
    };
  }

  const vimeo = parseVimeo(url);
  if (vimeo) {
    // `background=1` / chromeless `controls=0` require Vimeo Starter+ or higher.
    // Basic (free) accounts need an embed URL without those flags or the player fails.
    const q = new URLSearchParams({
      autoplay: "1",
      muted: "1",
      loop: "1",
      dnt: "1",
      title: "0",
      byline: "0",
      portrait: "0",
      unmute_button: "false",
    });
    if (vimeo.hash) q.set("h", vimeo.hash);
    return {
      embedType: "iframe",
      src: `https://player.vimeo.com/video/${vimeo.id}?${q.toString()}`,
      title: "",
    };
  }

  if (isLikelyDirectVideoFile(trimmed)) {
    return { embedType: "file", src: trimmed };
  }

  return null;
}
