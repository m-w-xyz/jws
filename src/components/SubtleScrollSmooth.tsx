"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Lenis smooths wheel + trackpad scrolling in a way that works across browsers
 * (custom `preventDefault` + `scrollTop` is unreliable on macOS trackpads / WebKit).
 * Nested panels (e.g. mobile info body) use `allowNestedScroll`.
 */
export default function SubtleScrollSmooth() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      /** Higher = snappier, less coast (Lenis default is 0.1). */
      lerp: 0.092,
      smoothWheel: true,
      /** Below 1 shortens coast after a flick; lerp unchanged keeps the same smoothing curve. */
      wheelMultiplier: 0.86,
      touchMultiplier: 1,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
