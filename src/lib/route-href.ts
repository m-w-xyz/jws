/** Path is exactly `/works` (index), not a project slug. */
export function isHrefWorksListingPage(href: string): boolean {
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const path = new URL(href, base).pathname.replace(/\/$/, "") || "/";
    return path === "/works";
  } catch {
    return false;
  }
}
