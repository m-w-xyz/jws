"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from "react";
import { useOptionalInfoGravity } from "./InfoGravityContext";
import gravityStyles from "./InfoGravity.module.css";

/** Settle beat after teardown before easing opacity (ms). */
const BEFORE_FADE_MS = 380;
/** Long opacity ease — “slowly”. */
const FADE_OUT_DURATION_MS = 5200;

export default function InfoGravityFixOverlay() {
  const ctx = useOptionalInfoGravity();
  const [retortAfterFix, setRetortAfterFix] = useState(false);
  const [retortFading, setRetortFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current !== null) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!retortAfterFix) {
      setRetortFading(false);
      return;
    }

    fadeTimerRef.current = window.setTimeout(() => {
      fadeTimerRef.current = null;
      setRetortFading(true);
    }, BEFORE_FADE_MS);

    return () => {
      if (fadeTimerRef.current !== null) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [retortAfterFix]);

  /** If `transitionend` is flaky, still clears the retort overlay. */
  useEffect(() => {
    if (!retortAfterFix || !retortFading) return undefined;
    const id = window.setTimeout(() => {
      setRetortAfterFix(false);
      setRetortFading(false);
    }, FADE_OUT_DURATION_MS + 600);
    return () => window.clearTimeout(id);
  }, [retortAfterFix, retortFading]);

  if (!ctx) return null;

  if (!ctx.physicsLive && !retortAfterFix) return null;

  const endRetortOnFade = () => {
    setRetortAfterFix(false);
    setRetortFading(false);
  };

  const onTransitionEndCapture = (
    event: TransitionEvent<HTMLDivElement>,
  ) => {
    if (
      event.propertyName === "opacity" &&
      event.target === event.currentTarget &&
      retortFading
    ) {
      endRetortOnFade();
    }
  };

  if (!ctx.physicsLive && retortAfterFix) {
    return (
      <div
        className={gravityStyles.fixOverlay}
        role="status"
        aria-live="polite"
      >
        <div
          className={`${gravityStyles.fixRetortText} ${retortFading ? gravityStyles.fixRetortFade : ""}`}
          style={
            {
              "--fix-retort-fade-ms": `${FADE_OUT_DURATION_MS}ms`,
            } as CSSProperties
          }
          onTransitionEnd={onTransitionEndCapture}
        >
          I think you&apos;re imagining things...
        </div>
      </div>
    );
  }

  const onFixClick = () => {
    ctx.fixGravity();
    setRetortAfterFix(true);
    setRetortFading(false);
  };

  return (
    <div
      className={gravityStyles.fixOverlay}
      role="region"
      aria-label="Restore page layout"
    >
      <button
        type="button"
        className={gravityStyles.fixButton}
        onClick={onFixClick}
      >
        Fix it please
      </button>
    </div>
  );
}
