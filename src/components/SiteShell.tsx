"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { TransitionColours } from "@/lib/get-transition-colours";
import type { SplashData } from "@/lib/get-splash-data";
import type { AboutPagePayload } from "@/lib/get-about-payload";
import Nav from "./Nav";
import Footer from "./Footer";
import InquiriesPanel from "./InquiriesPanel";
import MobileInfoPanel from "./MobileInfoPanel";
import SplashIntro from "./SplashIntro";
import SubtleScrollSmooth from "./SubtleScrollSmooth";
import IdleScreensaver from "./IdleScreensaver";
import { PageTransitionProvider, usePageTransition } from "./PageTransitionProvider";
import { useNotFoundChrome } from "@/contexts/NotFoundChromeContext";

export type SiteSettings = {
  siteTitle: string;
  email: string;
  phone: string;
  instagramHandle: string;
  location: string;
  navLinks: { _key: string; label: string; href: string }[];
  footerDarkLabel: string;
  footerLightLabel: string;
};

type SiteShellProps = {
  settings: SiteSettings;
  transitionColours: TransitionColours;
  splashData: SplashData | null;
  aboutPayload: AboutPagePayload | null;
  children: React.ReactNode;
};

type SplashMode = "initial" | "replay";

/** Same handler as the site title: splash replay + deferred navigation to `/`. */
export const SplashHomeContext = createContext<(() => void) | null>(null);

export function useSplashHome() {
  return useContext(SplashHomeContext);
}

/** Matches homepage mobile layout (`MobileHomeCenterLabels`, `MobileInfoPanel`). */
const MOBILE_SPLASH_MQ = "(max-width: 767px)";
const MOBILE_SPLASH_SEEN_KEY = "jw-splash-full-seen";

function readMobileSplashSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(MOBILE_SPLASH_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMobileSplashSeen() {
  if (typeof window === "undefined") return;
  if (!window.matchMedia(MOBILE_SPLASH_MQ).matches) return;
  try {
    sessionStorage.setItem(MOBILE_SPLASH_SEEN_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export default function SiteShell({
  settings,
  transitionColours,
  splashData,
  aboutPayload,
  children,
}: SiteShellProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }

  return (
    <PageTransitionProvider colours={transitionColours}>
      <SiteShellInner
        settings={settings}
        splashData={splashData}
        aboutPayload={aboutPayload}
      >
        {children}
      </SiteShellInner>
    </PageTransitionProvider>
  );
}

function SiteShellInner({
  settings,
  splashData,
  aboutPayload,
  children,
}: {
  settings: SiteSettings;
  splashData: SplashData | null;
  aboutPayload: AboutPagePayload | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { transitionPhase } = usePageTransition();
  const [inquiriesOpen, setInquiriesOpen] = useState(false);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const notFoundChrome = useNotFoundChrome();
  const hideNavFor404 = notFoundChrome?.suppressNav ?? false;
  // Stashes a pending route change to fire only once the splash panel has
  // fully covered the viewport. If we pushed the route immediately, the page
  // underneath would change while the splash is still mid-slide-in and the
  // user would briefly see the destination page through the uncovered area.
  const pendingNavRef = useRef<string | null>(null);

  // Splash visibility:
  // - "initial": first visit to "/" → splash sits in place and plays its timeline.
  // - "replay":  triggered by clicking the site title from anywhere → splash
  //              slides up from below, plays its timeline, slides up off-screen.
  // - null:      not visible.
  // We pair the mode with an instance id so consecutive replays remount the
  // splash component (ensuring the slide-in animation plays from scratch).
  const [splashState, setSplashState] = useState<{
    mode: SplashMode;
    id: number;
    /** Mobile-only fast replay: solid colour, no copy; slides stay 1000ms. */
    minimalReplay?: boolean;
  } | null>(() => {
    if (!splashData) return null;
    return pathname === "/" ? { mode: "initial", id: 0 } : null;
  });

  const handleSplashComplete = useCallback(() => {
    writeMobileSplashSeen();
    setSplashState(null);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  const triggerSplashReplay = useCallback(() => {
    if (!splashData) {
      if (pathname !== "/") router.push("/");
      return;
    }
    // Defer the actual route change until the splash has fully covered the
    // viewport (see `handleSplashCovered`). The remaining splash timeline
    // — huddle hold + word swaps + settle ≈ 2.7s — gives Next.js plenty of
    // time to stream the homepage before the splash slides off, so there's
    // still no blank flash between splash and home.
    pendingNavRef.current = pathname !== "/" ? "/" : null;
    const minimalReplay =
      typeof window !== "undefined" &&
      window.matchMedia(MOBILE_SPLASH_MQ).matches &&
      readMobileSplashSeen();
    setSplashState((current) => ({
      mode: "replay" as const,
      id: (current?.id ?? 0) + 1,
      minimalReplay,
    }));
  }, [splashData, pathname]);

  const handleSplashCovered = useCallback(() => {
    const href = pendingNavRef.current;
    pendingNavRef.current = null;
    if (href) {
      router.push(href);
      return;
    }
    /* Replay on `/`: reset scroll while the splash fully masks the page. */
    if (pathname === "/" && typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [router, pathname]);

  useLayoutEffect(() => {
    setMobileInfoOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    if (transitionPhase === "idle") return;
    setMobileInfoOpen(false);
  }, [transitionPhase]);

  return (
    <SplashHomeContext.Provider value={triggerSplashReplay}>
      <div className="jw-site">
        <IdleScreensaver />
        <SubtleScrollSmooth />
        {!hideNavFor404 && (
          <Nav
            siteTitle={settings.siteTitle}
            navLinks={settings.navLinks}
            onSiteTitleClick={triggerSplashReplay}
            onInquiriesClick={() => setInquiriesOpen(true)}
            mobileInfoOpen={mobileInfoOpen}
            onToggleMobileInfo={() => setMobileInfoOpen((o) => !o)}
          />
        )}
        {children}
        <Footer
          email={settings.email}
          instagramHandle={settings.instagramHandle}
          phone={settings.phone}
          location={settings.location}
          footerDarkLabel={settings.footerDarkLabel}
          footerLightLabel={settings.footerLightLabel}
        />
        <InquiriesPanel
          isOpen={inquiriesOpen}
          onClose={() => setInquiriesOpen(false)}
          email={settings.email}
          phone={settings.phone}
          instagramHandle={settings.instagramHandle}
          location={settings.location}
        />
        <MobileInfoPanel
          isOpen={mobileInfoOpen}
          onClose={() => setMobileInfoOpen(false)}
          footerDarkLabel={settings.footerDarkLabel}
          footerLightLabel={settings.footerLightLabel}
          settings={{
            email: settings.email,
            phone: settings.phone,
            instagramHandle: settings.instagramHandle,
            location: settings.location,
          }}
          about={aboutPayload}
        />
        {splashData && splashState !== null && (
          <SplashIntro
            key={`${splashState.mode}-${splashState.id}`}
            backgroundColour={splashData.backgroundColour}
            siteTitle={settings.siteTitle}
            taglinePrefix={splashData.taglinePrefix}
            cyclingWords={splashData.cyclingWords}
            slideIn={splashState.mode === "replay"}
            minimal={Boolean(splashState.minimalReplay)}
            onCovered={handleSplashCovered}
            onComplete={handleSplashComplete}
          />
        )}
      </div>
    </SplashHomeContext.Provider>
  );
}
