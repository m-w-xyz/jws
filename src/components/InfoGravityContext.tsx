"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gravityStyles from "./InfoGravity.module.css";
import InfoGravityFixOverlay from "./InfoGravityFixOverlay";
import InfoGravityPhysics from "./InfoGravityPhysics";

export type InfoGravityContextValue = {
  gravityActive: boolean;
  physicsLive: boolean;
  triggerGravity: () => void;
  fixGravity: () => void;
  bindPhysicsCleanup: (fn: (() => void) | null) => void;
  setPhysicsLive: (live: boolean) => void;
};

const InfoGravityContext = createContext<InfoGravityContextValue | null>(null);

export function InfoGravityProvider({ children }: { children: ReactNode }) {
  const [gravityActive, setGravityActive] = useState(false);
  const [physicsLive, setPhysicsLive] = useState(false);
  const physicsCleanupRef = useRef<(() => void) | null>(null);

  const bindPhysicsCleanup = useCallback((fn: (() => void) | null) => {
    physicsCleanupRef.current = fn;
  }, []);

  const fixGravity = useCallback(() => {
    const run = physicsCleanupRef.current;
    physicsCleanupRef.current = null;
    run?.();
    setPhysicsLive(false);
    setGravityActive(false);
  }, []);

  const triggerGravity = useCallback(() => {
    setGravityActive(true);
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      fixGravity();
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [fixGravity]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fixGravity();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [fixGravity]);

  const value = useMemo(
    () => ({
      gravityActive,
      physicsLive,
      triggerGravity,
      fixGravity,
      bindPhysicsCleanup,
      setPhysicsLive,
    }),
    [
      gravityActive,
      physicsLive,
      triggerGravity,
      fixGravity,
      bindPhysicsCleanup,
    ],
  );

  return (
    <InfoGravityContext.Provider value={value}>
      {children}
      <InfoGravityFixOverlay />
    </InfoGravityContext.Provider>
  );
}

export function useOptionalInfoGravity() {
  return useContext(InfoGravityContext);
}

export function InfoGravityMain({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const mainRef = useRef<HTMLElement>(null);
  const ctx = useOptionalInfoGravity();
  const gravityActive = ctx?.gravityActive ?? false;

  return (
    <main
      ref={mainRef}
      className={`${className} ${gravityStyles.gravityRoot}`}
      data-gravity={gravityActive ? "true" : undefined}
    >
      {children}
      {ctx ? <InfoGravityPhysics mainRef={mainRef} /> : null}
    </main>
  );
}
