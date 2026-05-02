"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type ComponentProps,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./PageTransitionOverlay.module.css";
import {
  invertHexColourRgb,
  normalizeHexColour,
  type TransitionColours,
} from "@/lib/get-transition-colours";

function projectSlugFromPath(path: string): string | null {
  try {
    const pathOnly =
      path.startsWith("http") || path.startsWith("//")
        ? new URL(
            path.startsWith("//") ? `https:${path}` : path
          ).pathname
        : path.split("#")[0]?.split("?")[0] ?? path;
    const m = pathOnly.match(/^\/works\/([^/]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Project transition colours apply when entering a specific project (`/works/[slug]`)
// with a mapped colour. All other navigations — including leaving a project for
// home, Info, Works list, etc. — use the site splash colour.
export function resolveTransitionColour(
  href: string,
  splashColour: string,
  projectColours: Record<string, string>
): string {
  const destSlug = projectSlugFromPath(href);
  if (destSlug && projectColours[destSlug]) return projectColours[destSlug];
  return splashColour;
}

function normalizePathCompare(pathname: string): string {
  const p = pathname.replace(/\/$/, "");
  return p === "" ? "/" : p;
}

function pathsMatch(pathname: string, href: string): boolean {
  try {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const u = new URL(href, base);
    return (
      normalizePathCompare(pathname) === normalizePathCompare(u.pathname)
    );
  } catch {
    return false;
  }
}

type HrefArg = ComponentProps<typeof Link>["href"];

function hrefToString(href: HrefArg): string {
  if (typeof href === "string") return href;
  return `${href.pathname ?? ""}${href.search ?? ""}${href.hash ?? ""}`;
}

export type TransitionPhase = "idle" | "entering" | "covering" | "exiting";

type PageTransitionContextValue = {
  splashColour: string;
  projectColours: Record<string, string>;
  /** Page-transition overlay lifecycle (helps sync mobile chrome with the curtain). */
  transitionPhase: TransitionPhase;
  navigate: (href: string, explicitColour?: string | null) => void;
  colourForHref: (href: string) => string;
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(
  null
);

export function usePageTransition() {
  const ctx = useContext(PageTransitionContext);
  if (!ctx) {
    throw new Error("usePageTransition must be used within PageTransitionProvider");
  }
  return ctx;
}

type ProviderProps = {
  colours: TransitionColours;
  children: React.ReactNode;
};

export function PageTransitionProvider({ colours, children }: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [overlayColour, setOverlayColour] = useState(colours.splashColour);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [cycleKey, setCycleKey] = useState(0);
  const pushAfterEnterRef = useRef(false);

  const { splashColour, projectColours } = colours;

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--splash-transition-colour",
      splashColour
    );
  }, [splashColour]);

  // Project detail routes (/works/[slug]): text selection uses the RGB-inverted
  // project hex (or inverted splash fallback) for contrast with the accent.
  useEffect(() => {
    const m = pathname?.match(/^\/works\/([^/]+)$/);
    if (!m) {
      document.documentElement.style.removeProperty("--selection-highlight");
      return;
    }
    const slug = m[1];
    const base = projectColours[slug] ?? splashColour;
    const highlight = invertHexColourRgb(base) ?? base;
    document.documentElement.style.setProperty("--selection-highlight", highlight);
  }, [pathname, projectColours, splashColour]);

  const colourForHref = useCallback(
    (href: string) =>
      resolveTransitionColour(href, splashColour, projectColours),
    [splashColour, projectColours],
  );

  const navigate = useCallback(
    (href: string, explicitColour?: string | null) => {
      try {
        const base =
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost";
        const url = new URL(href, base);
        if (url.origin !== window.location.origin) {
          window.location.href = href;
          return;
        }
      } catch {
        return;
      }

      if (pathsMatch(pathname ?? "", href)) return;

      if (phase !== "idle") return;

      // 1. An explicit colour passed by the link (e.g. a project card or hero).
      // 2. Destination project colour when `href` is `/works/[slug]` and we know it from the global map (otherwise splash).
      let colour: string;
      if (explicitColour) {
        colour = normalizeHexColour(explicitColour) ?? splashColour;
      } else {
        colour = resolveTransitionColour(href, splashColour, projectColours);
      }

      pushAfterEnterRef.current = false;
      setOverlayColour(
        normalizeHexColour(colour) ?? splashColour,
      );
      setPendingHref(href);
      setPhase("entering");
    },
    [pathname, phase, splashColour, projectColours]
  );

  // Once the route has actually changed and the overlay is fully covering the
  // viewport, hold it there until the new page's content has had a chance to
  // settle (fonts loaded; images — see below). Capped at 5000ms so we never trap
  // the user behind the overlay if a request stalls.
  useEffect(() => {
    if (phase !== "covering" || !pendingHref || !pathname) return;
    if (!pathsMatch(pathname, pendingHref)) return;

    let cancelled = false;
    const startExit = () => {
      if (cancelled) return;
      setPhase("exiting");
    };

    const timeout = window.setTimeout(startExit, 5000);

    const waitForImage = (img: HTMLImageElement) =>
      new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener("load", done);
          img.removeEventListener("error", done);
          resolve();
        };
        img.addEventListener("load", done);
        img.addEventListener("error", done);
      });

    let outerRaf = 0;
    let innerRaf = 0;

    // Wait two frames so the navigated route's content (including hero img) has
    // committed before we query `data-transition-primary`.
    outerRaf = window.requestAnimationFrame(() => {
      innerRaf = window.requestAnimationFrame(() => {
        // Only the tagged hero (project detail, first gallery image, mobile home
        // section, etc.) — never `document.images`, which blocked the curtain on
        // listing and other pages until every thumbnail finished loading.
        const imagesToWait = Array.from(
          document.querySelectorAll<HTMLImageElement>(
            "img[data-transition-primary]"
          )
        ).filter((img) => !img.complete);

        const imageWaits = imagesToWait.map((img) => waitForImage(img));

        const fontWait =
          typeof document !== "undefined" && "fonts" in document
            ? document.fonts.ready.then(() => undefined)
            : Promise.resolve();

        Promise.all([Promise.all(imageWaits), fontWait])
          .then(() => {
            // One more frame so layout-after-load settles before we uncover.
            window.requestAnimationFrame(startExit);
          })
          .catch(startExit);
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(outerRaf);
      window.cancelAnimationFrame(innerRaf);
    };
  }, [phase, pathname, pendingHref]);

  const handleEnterEnd = useCallback(
    (e: AnimationEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (phase !== "entering") return;
      // CSS Modules (Turbopack) scope keyframe names — match by suffix so the
      // hashed name e.g. "PageTransitionOverlay-module__abc__pageTransitionEnter"
      // still matches.
      if (!e.animationName.endsWith("pageTransitionEnter")) return;
      if (!pendingHref || pushAfterEnterRef.current) return;
      pushAfterEnterRef.current = true;
      router.push(pendingHref);
      setPhase("covering");
    },
    [phase, pendingHref, router]
  );

  const handleExitEnd = useCallback((e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (phase !== "exiting") return;
    if (!e.animationName.endsWith("pageTransitionExit")) return;
    setPhase("idle");
    setPendingHref(null);
    setCycleKey((k) => k + 1);
  }, [phase]);

  const overlayClass =
    phase === "idle"
      ? styles.overlay
      : `${styles.overlay} ${
          phase === "entering"
            ? styles.enter
            : phase === "exiting"
              ? styles.exit
              : styles.covering
        }`;

  const value = useMemo(
    () => ({
      splashColour,
      projectColours,
      transitionPhase: phase,
      navigate,
      colourForHref,
    }),
    [splashColour, projectColours, phase, navigate, colourForHref]
  );

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      <div
        key={cycleKey}
        className={overlayClass}
        style={{ backgroundColor: overlayColour }}
        onAnimationEnd={
          phase === "entering"
            ? handleEnterEnd
            : phase === "exiting"
              ? handleExitEnd
              : undefined
        }
        aria-hidden
      />
    </PageTransitionContext.Provider>
  );
}

type TransitionLinkProps = ComponentProps<typeof Link> & {
  // Optional colour to use for the page transition when this link is clicked.
  // Use this when the parent component already knows the destination's colour
  // (e.g. a project card that was rendered from a Sanity query that included
  // `projectColour`). Avoids any dependency on the global colours map.
  transitionColour?: string | null;
};

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  function TransitionLink({ href, onClick, transitionColour, ...props }, ref) {
    const { navigate } = usePageTransition();
    const resolved = hrefToString(href);

    return (
      <Link
        ref={ref}
        href={href}
        prefetch
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          if (e.button !== 0) return;
          try {
            const base =
              typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost";
            const url = new URL(resolved, base);
            if (url.origin !== window.location.origin) return;
          } catch {
            return;
          }
          e.preventDefault();
          navigate(resolved, transitionColour ?? null);
        }}
        {...props}
      />
    );
  },
);