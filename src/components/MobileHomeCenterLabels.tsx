"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import desktopStyles from "./DesktopHomeCenterLabels.module.css";
import styles from "./MobileHomeCenterLabels.module.css";

export type MobileHomeLabelProject = {
  title: string;
  orderNumber?: number;
};

type MobileHomeCenterLabelsProps = {
  projects: MobileHomeLabelProject[];
  sectionRefs: MutableRefObject<(HTMLElement | null)[]>;
};

const MOBILE_MQ = "(max-width: 767px)";
const DESKTOP_GRID_MQ = "(min-width: 1024px)";
const FADE_OUT_MS = 420;
const SWAP_BEAT_MS = 32;

/** Section whose bounds contain the viewport vertical midpoint. */
function indexForViewportCenter(elements: HTMLElement[]): number {
  if (elements.length === 0) return 0;

  const centerY =
    typeof window !== "undefined" ? window.innerHeight * 0.5 : 0;

  for (let i = 0; i < elements.length; i++) {
    const rect = elements[i].getBoundingClientRect();
    if (rect.top <= centerY && rect.bottom >= centerY) return i;
  }

  for (let i = 0; i < elements.length; i++) {
    const top = elements[i].getBoundingClientRect().top;
    if (top > centerY) return Math.max(0, i - 1);
  }

  return elements.length - 1;
}

/**
 * Homepage overlays: scroll-synced order number + title at viewport mid-height.
 * Mobile (`max-width: 767px`) uses MobileHomeCenterLabels.module.css; desktop grid
 * uses DesktopHomeCenterLabels.module.css (`min-width: 1024px`, matches `.nav` anchors).
 * Pointer-events disabled so hero links remain usable.
 */
export default function MobileHomeCenterLabels({
  projects,
  sectionRefs,
}: MobileHomeCenterLabelsProps) {
  const [mobile, setMobile] = useState(false);
  const [desktopGrid, setDesktopGrid] = useState(false);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [shownIdx, setShownIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const shownIdxRef = useRef(0);
  const fadeGenerationRef = useRef(0);

  const activeCaption = mobile || desktopGrid;
  const active = projects[shownIdx];

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const updateMq = () => setMobile(mq.matches);
    updateMq();
    mq.addEventListener("change", updateMq);
    return () => mq.removeEventListener("change", updateMq);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_GRID_MQ);
    const updateMq = () => setDesktopGrid(mq.matches);
    updateMq();
    mq.addEventListener("change", updateMq);
    return () => mq.removeEventListener("change", updateMq);
  }, []);

  const measureScrollIndex = useCallback(() => {
    const els = sectionRefs.current.filter(
      (node): node is HTMLElement => Boolean(node),
    );
    const next = indexForViewportCenter(els);
    setScrollIdx((prev) => (prev === next ? prev : next));
  }, [sectionRefs]);

  useEffect(() => {
    if (!activeCaption || projects.length === 0) return;

    let rafScheduled = false;
    const queue = () => {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        measureScrollIndex();
      });
    };

    measureScrollIndex();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });

    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, [activeCaption, projects.length, measureScrollIndex]);

  useEffect(() => {
    if (!activeCaption || projects.length === 0) return;
    const reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const instant = reduceMotionMq.matches;

    let fadeOutTimer: number | null = null;
    let fadeInTimer: number | null = null;

    if (scrollIdx === shownIdxRef.current) return undefined;

    if (instant) {
      shownIdxRef.current = scrollIdx;
      setShownIdx(scrollIdx);
      setFading(false);
      return undefined;
    }

    fadeGenerationRef.current += 1;
    const ticket = fadeGenerationRef.current;

    setFading(true);

    fadeOutTimer = window.setTimeout(() => {
      fadeOutTimer = null;
      if (ticket !== fadeGenerationRef.current) return;

      shownIdxRef.current = scrollIdx;
      setShownIdx(scrollIdx);

      fadeInTimer = window.setTimeout(() => {
        fadeInTimer = null;
        if (ticket !== fadeGenerationRef.current) return;
        setFading(false);
      }, SWAP_BEAT_MS);
    }, FADE_OUT_MS);

    return () => {
      if (fadeOutTimer !== null) window.clearTimeout(fadeOutTimer);
      if (fadeInTimer !== null) window.clearTimeout(fadeInTimer);
    };
  }, [scrollIdx, activeCaption, projects.length]);

  if (projects.length === 0) return null;

  return (
    <>
      {mobile ? (
        <div className={styles.strip} aria-hidden role="presentation">
          <div className={styles.inner}>
            <div className={styles.blendWrap}>
              {active?.orderNumber !== undefined && (
                <span
                  className={`${styles.number} ${fading ? styles.dimmed : ""}`}
                >
                  {active.orderNumber}
                </span>
              )}
              {active && (
                <span
                  className={`${styles.title} ${fading ? styles.dimmed : ""}`}
                >
                  {active.title}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {desktopGrid ? (
        <div
          className={desktopStyles.strip}
          aria-hidden
          role="presentation"
        >
          <div className={desktopStyles.inner}>
            {active?.orderNumber !== undefined && (
              <span
                className={`${desktopStyles.number} ${fading ? desktopStyles.dimmed : ""}`}
              >
                {active.orderNumber}
              </span>
            )}
            {active && (
              <span
                className={`${desktopStyles.title} ${fading ? desktopStyles.dimmed : ""}`}
              >
                {active.title}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
