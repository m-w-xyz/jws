"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SplashIntro.module.css";

type SplashIntroProps = {
  backgroundColour: string;
  siteTitle: string;
  /**
   * Static portion of the tagline (e.g. "Objects of").
   */
  taglinePrefix: string;
  /**
   * Words to cycle through after the initial huddle hold. The FIRST word is
   * shown before cycling starts and is shown again as the final step so the
   * loop closes cleanly. For
   *   cyclingWords = ["intrigue", "desire", "curiosity"]
   * the rendered sequence is: intrigue → desire → curiosity → intrigue.
   */
  cyclingWords: string[];
  onComplete: () => void;
  /**
   * Fires once the splash panel fully covers the viewport (i.e. after the
   * slide-in finishes, or immediately on mount when {@link slideIn} is
   * false). Use this to defer side effects — most importantly the route
   * change for a replay — until nothing on the page underneath can be seen.
   */
  onCovered?: () => void;
  /**
   * If true, splash slides up into the viewport from below (1000ms, figma
   * ease) on mount. If false, it sits in place immediately (used for the
   * very first visit to "/").
   */
  slideIn?: boolean;
  /**
   * Mobile fast path after the full splash has played once this session:
   * solid colour only, no title/tagline — slide timing matches the 1000ms
   * page-transition curtain.
   */
  minimal?: boolean;
};

const SLIDE_DURATION = 1000; // splash panel slide in / out (matches PageTransitionOverlay)
const MINIMAL_HOLD_MS = 140;
const FADE_IN_DURATION = 600; // text fade + 10px rise (entrance)
const HUDDLE_HOLD = 400; // sit at centre before word cycling starts
const WORD_SWAP_STEP = 380; // time between successive word changes
const WORD_SWAP_SETTLE = 550; // pause on final word before exit begins
const TEXT_FADE_OUT_DURATION = 600; // mirror of FADE_IN_DURATION (fade + 10px rise)
const FIGMA_EASE = "cubic-bezier(0.58, 0.08, 0.13, 1)";

type WordState = "pre" | "active" | "post";

export default function SplashIntro({
  backgroundColour,
  siteTitle,
  taglinePrefix,
  cyclingWords,
  onComplete,
  onCovered,
  slideIn = false,
  minimal = false,
}: SplashIntroProps) {
  const splashRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Stash the latest callbacks in refs so the timeline / slide-in effects
  // don't have to depend on them (which would otherwise restart the
  // animations whenever the parent re-renders with new closures).
  const onCompleteRef = useRef(onComplete);
  const onCoveredRef = useRef(onCovered);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    onCoveredRef.current = onCovered;
  }, [onCovered]);

  const wordSequence = useMemo(() => {
    // First word → … → last → first again before exit.
    const cleaned = cyclingWords.map((w) => w.trim()).filter(Boolean);
    if (cleaned.length === 0) return [] as string[];
    if (cleaned.length === 1) return [cleaned[0]];
    const first = cleaned[0];
    return [first, ...cleaned.slice(1), first];
  }, [cyclingWords]);

  const [activeWordIdx, setActiveWordIdx] = useState(0);

  // Slide-in entrance for the splash panel itself via the Web Animations API
  // (works around React batching edge cases that can prevent CSS keyframes
  // from running on initial mount). Fires `onCovered` exactly once, the
  // moment the panel has fully covered the viewport — before that point,
  // anything underneath is partially visible and any route change kicked
  // off here would be seen by the user.
  useEffect(() => {
    if (!slideIn) {
      // No entrance animation → the splash is already covering on mount.
      onCoveredRef.current?.();
      return;
    }
    if (!splashRef.current) return;
    const el = splashRef.current;
    const animation = el.animate(
      [
        { transform: "translateY(100%)" },
        { transform: "translateY(0)" },
      ],
      { duration: SLIDE_DURATION, easing: FIGMA_EASE, fill: "forwards" }
    );
    let cancelled = false;
    animation.finished
      .then(() => {
        if (!cancelled) onCoveredRef.current?.();
      })
      .catch(() => {
        /* animation cancelled — no-op */
      });
    return () => {
      cancelled = true;
      animation.cancel();
    };
  }, [slideIn]);

  // Slide-up exit — also driven by WAAPI so it composes cleanly with the
  // entrance animation's `fill: "forwards"` hold (a CSS transform transition
  // would be blocked by the lingering WAAPI value, which is why the panel
  // appeared to just vanish on replay).
  useEffect(() => {
    if (!exiting || !splashRef.current) return;
    const el = splashRef.current;
    const animation = el.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-100%)" },
      ],
      { duration: SLIDE_DURATION, easing: FIGMA_EASE, fill: "forwards" }
    );
    return () => animation.cancel();
  }, [exiting]);

  // Full timeline:
  //   (optional splash slide-in, SLIDE_DURATION)
  //   → text fades + rises 10px into huddle (FADE_IN_DURATION)
  //   → huddle hold showing the first word (HUDDLE_HOLD)
  //   → cycle one word at a time through the rest and back to the first
  //     (WORD_SWAP_STEP each)
  //   → brief settle on the closing first word (WORD_SWAP_SETTLE)
  //   → text fades + rises 10px back out AND splash panel slides up
  //     simultaneously (exit phase, max(TEXT_FADE_OUT_DURATION, SLIDE_DURATION))
  useEffect(() => {
    if (minimal) {
      const enterDelay = slideIn ? SLIDE_DURATION : 0;
      const exitAt = enterDelay + MINIMAL_HOLD_MS;
      const doneAt = exitAt + SLIDE_DURATION;
      const timers: ReturnType<typeof setTimeout>[] = [
        setTimeout(() => {
          setFadingOut(true);
          setExiting(true);
        }, exitAt),
        setTimeout(() => onCompleteRef.current?.(), doneAt),
      ];
      return () => timers.forEach(clearTimeout);
    }

    const enterDelay = slideIn ? SLIDE_DURATION : 0;
    const enterAt = enterDelay + 16;
    const cycleStartAt = enterAt + FADE_IN_DURATION + HUDDLE_HOLD;

    // Number of actual word swaps == wordSequence.length - 1 (first frame is
    // the initial word already shown during the huddle hold).
    const swapCount = Math.max(0, wordSequence.length - 1);
    const cycleEndAt = cycleStartAt + swapCount * WORD_SWAP_STEP;

    const exitAt = cycleEndAt + WORD_SWAP_SETTLE;
    const doneAt = exitAt + Math.max(TEXT_FADE_OUT_DURATION, SLIDE_DURATION);

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setEntered(true), enterAt));

    for (let i = 1; i <= swapCount; i++) {
      const at = cycleStartAt + i * WORD_SWAP_STEP - WORD_SWAP_STEP; // i=1 → cycleStartAt
      timers.push(setTimeout(() => setActiveWordIdx(i), at));
    }

    // Text fade-out and panel slide-up fire together so the splash starts
    // exiting while the labels are still transitioning out.
    timers.push(
      setTimeout(() => {
        setFadingOut(true);
        setExiting(true);
      }, exitAt)
    );
    timers.push(setTimeout(() => onCompleteRef.current?.(), doneAt));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [minimal, slideIn, wordSequence.length]);

  const textRowClass = [
    styles.textRow,
    entered ? styles.entered : "",
    fadingOut ? styles.fadingOut : "",
  ]
    .filter(Boolean)
    .join(" ");

  const wordStateFor = (i: number): WordState => {
    if (i === activeWordIdx) return "active";
    if (i < activeWordIdx) return "post";
    return "pre";
  };

  // The text row is rendered as a SIBLING of the splash panel (not a child),
  // so when the panel's transform slides it up off-screen, the text stays
  // pinned in place and only transitions via its own opacity + translateY.
  return (
    <>
      <div
        ref={splashRef}
        className={styles.splash}
        style={{ backgroundColor: backgroundColour }}
        aria-hidden
      />
      {!minimal && (
        <div className={textRowClass} aria-hidden>
          <span className={styles.title}>{siteTitle}</span>
          <span className={styles.tagline}>
            {taglinePrefix ? <>{taglinePrefix}&nbsp;</> : null}
            <span className={styles.wordSwap}>
              {wordSequence.map((word, i) => (
                <span
                  key={i}
                  className={styles.word}
                  data-state={wordStateFor(i)}
                >
                  {word}
                </span>
              ))}
            </span>
          </span>
        </div>
      )}
    </>
  );
}
