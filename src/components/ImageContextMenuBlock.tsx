"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Blocks the native context menu on raster images so “Save image as…”
 * is harder to reach. Does not apply under `/studio` (Sanity).
 */
export default function ImageContextMenuBlock() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/studio")) return;

    const onContextMenu = (e: MouseEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    return () => document.removeEventListener("contextmenu", onContextMenu, true);
  }, [pathname]);

  return null;
}
