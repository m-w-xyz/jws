"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  INFO_PORTRAIT_EYES_CLICKS,
  INFO_PORTRAIT_GRAVITY_HOVER_MS,
} from "@/lib/easter-egg";
import { useOptionalInfoGravity } from "./InfoGravityContext";
import styles from "./InfoPortraitHoverEyes.module.css";

/** Base scale of the eyes graphic; each post-reveal click adds `EYES_GROW_PER_CLICK`. */
const EYES_BASE_SCALE = 0.5;
const EYES_GROW_PER_CLICK = 0.045;
const EYES_MAX_SCALE = 2.75;

const VIEWPORT_MARGIN = 12;
const EASE_MOVE = "cubic-bezier(0.58, 0.08, 0.13, 1)";
const EASE_OUT_SOFT = "cubic-bezier(0.19, 1, 0.22, 1)";

/** “oh hello…” fade-in, then a short beat before content fades out */
const HELLO_FADE_MS = 900;
const HELLO_HOLD_MS = 520;
const FINALE_CONTENT_FADE_S = 1.35;

const DEFAULT_EYES_HELLO_SRC = "/images/jws-eyes-hello.svg";

type EyeAnimState = "idle" | "in" | "out";
type FinalePhase = "off" | "hello" | "fadeout";

type Props = {
  children: ReactElement;
  eyesSrc: string;
  /** Second asset shown once the eyes reach the centre (finale). */
  eyesHelloSrc?: string;
};

function readViewport(): { w: number; h: number } {
  if (typeof window === "undefined") return { w: 0, h: 0 };
  return { w: window.innerWidth, h: window.innerHeight };
}

function eyesBoxPx(w: number): { boxW: number; boxH: number } {
  const boxW = Math.min(w * 0.16, 84);
  return { boxW, boxH: boxW * (8 / 20) };
}

export default function InfoPortraitHoverEyes({
  children,
  eyesSrc,
  eyesHelloSrc = DEFAULT_EYES_HELLO_SRC,
}: Props) {
  const [eyeState, setEyeState] = useState<EyeAnimState>("idle");
  const [eyesGrowSteps, setEyesGrowSteps] = useState(0);
  const [finalePhase, setFinalePhase] = useState<FinalePhase>("off");
  const [helloOpaque, setHelloOpaque] = useState(false);
  const [finaleFadeOpacity, setFinaleFadeOpacity] = useState(1);
  const [finaleFadeTransition, setFinaleFadeTransition] = useState("none");
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState(readViewport);
  const eyesClickRef = useRef(0);
  const gravityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);
  const finePointerRef = useRef(true);
  const eyeStateRef = useRef(eyeState);
  const finalePhaseRef = useRef(finalePhase);
  const gravityCtx = useOptionalInfoGravity();

  eyeStateRef.current = eyeState;
  finalePhaseRef.current = finalePhase;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    finePointerRef.current = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
  }, []);

  useEffect(() => {
    if (eyeState === "idle") setEyesGrowSteps(0);
  }, [eyeState]);

  useEffect(() => {
    if (eyeState !== "in") {
      setFinalePhase("off");
      setHelloOpaque(false);
      setFinaleFadeOpacity(1);
      setFinaleFadeTransition("none");
    }
  }, [eyeState]);

  useEffect(() => {
    if (!mounted) return;
    const onResize = () => setViewport(readViewport());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]);

  /* At max scale the eyes sit at the viewport centre — start the hello + fade-out sequence. */
  useEffect(() => {
    if (eyeState !== "in" || finalePhase !== "off") return;
    if (reducedMotionRef.current) return;
    const inner = Math.min(
      EYES_MAX_SCALE,
      EYES_BASE_SCALE + eyesGrowSteps * EYES_GROW_PER_CLICK,
    );
    if (inner < EYES_MAX_SCALE - 1e-6) return;
    setFinalePhase("hello");
  }, [eyeState, eyesGrowSteps, finalePhase]);

  /* Fade “oh hello…” in after paint (bundle opacity carries both during finale fade-out). */
  useEffect(() => {
    if (finalePhase !== "hello") return undefined;
    setHelloOpaque(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setHelloOpaque(true));
    });
    return () => cancelAnimationFrame(id);
  }, [finalePhase]);

  /* Then fade out only the eyes + hello wrapper (outer stack unchanged). */
  useEffect(() => {
    if (finalePhase !== "hello") return;
    const total = HELLO_FADE_MS + HELLO_HOLD_MS;
    const t = window.setTimeout(() => setFinalePhase("fadeout"), total);
    return () => clearTimeout(t);
  }, [finalePhase]);

  useEffect(() => {
    if (finalePhase !== "fadeout") {
      setFinaleFadeOpacity(1);
      setFinaleFadeTransition("none");
      return;
    }
    setFinaleFadeOpacity(1);
    setFinaleFadeTransition("none");
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFinaleFadeOpacity(0);
        setFinaleFadeTransition(
          `opacity ${FINALE_CONTENT_FADE_S}s ${EASE_OUT_SOFT}`,
        );
      });
    });
    return () => cancelAnimationFrame(id);
  }, [finalePhase]);

  const clearGravityTimer = useCallback(() => {
    if (gravityTimerRef.current) {
      clearTimeout(gravityTimerRef.current);
      gravityTimerRef.current = null;
    }
  }, []);

  const handlePointerEnter = useCallback(() => {
    clearGravityTimer();
    if (reducedMotionRef.current || !finePointerRef.current) return;
    if (gravityCtx) {
      gravityTimerRef.current = setTimeout(() => {
        gravityCtx.triggerGravity();
        gravityTimerRef.current = null;
      }, INFO_PORTRAIT_GRAVITY_HOVER_MS);
    }
  }, [clearGravityTimer, gravityCtx]);

  const handlePointerLeave = useCallback(() => {
    if (finalePhaseRef.current !== "off") return;
    clearGravityTimer();
    setEyeState((prev) => {
      if (prev === "in") return "out";
      return prev;
    });
  }, [clearGravityTimer]);

  const handlePhotoPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (reducedMotionRef.current) return;
      if (finalePhaseRef.current !== "off") return;
      if (eyeStateRef.current === "in") {
        setEyesGrowSteps((s) => {
          const nextScale = EYES_BASE_SCALE + (s + 1) * EYES_GROW_PER_CLICK;
          if (nextScale > EYES_MAX_SCALE) return s;
          return s + 1;
        });
        return;
      }
      if (eyeStateRef.current !== "idle") return;
      eyesClickRef.current += 1;
      if (eyesClickRef.current >= INFO_PORTRAIT_EYES_CLICKS) {
        eyesClickRef.current = 0;
        setEyesGrowSteps(0);
        setEyeState("in");
      }
    },
    [],
  );

  const handleFinaleFadeEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "opacity") return;
      if (finalePhaseRef.current !== "fadeout") return;
      setFinalePhase("off");
      setHelloOpaque(false);
      setEyeState("idle");
      eyesClickRef.current = 0;
    },
    [],
  );

  const handleStackTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "opacity") return;
      setEyeState((prev) => {
        if (prev === "out") {
          eyesClickRef.current = 0;
          return "idle";
        }
        return prev;
      });
    },
    [],
  );

  const child = Children.only(children);
  const imageChild = child as ReactElement<{ className?: string }>;
  const mergedChild = isValidElement(child)
    ? cloneElement(imageChild, {
        className: [imageChild.props.className, styles.portraitImg]
          .filter(Boolean)
          .join(" "),
      })
    : child;

  const innerScale = Math.min(
    EYES_MAX_SCALE,
    EYES_BASE_SCALE + eyesGrowSteps * EYES_GROW_PER_CLICK,
  );

  const denom = EYES_MAX_SCALE - EYES_BASE_SCALE;
  const towardCenterT =
    denom > 0
      ? Math.min(1, Math.max(0, (innerScale - EYES_BASE_SCALE) / denom))
      : 0;

  const { w: vw, h: vh } = viewport;
  const { boxW, boxH } = eyesBoxPx(vw || 1);
  const m = VIEWPORT_MARGIN;

  const leftCorner = m;
  const topCorner = (vh || 1) - m - boxH;
  const leftCenter = (vw || 1) / 2 - boxW / 2;
  const topCenter = (vh || 1) / 2 - boxH / 2;

  const reducedMotion = reducedMotionRef.current;
  const t = reducedMotion ? 0 : towardCenterT;
  const moverLeft = leftCorner + (leftCenter - leftCorner) * t;
  const moverTop = topCorner + (topCenter - topCorner) * t;

  const showHelloCopy = finalePhase === "hello" || finalePhase === "fadeout";
  const eyesImgSrc =
    finalePhase === "hello" || finalePhase === "fadeout"
      ? eyesHelloSrc
      : eyesSrc;

  const eyesLayer =
    mounted &&
    vw > 0 &&
    vh > 0 &&
    createPortal(
      <div
        className={styles.eyesStack}
        data-state={eyeState}
        aria-hidden
        onTransitionEnd={handleStackTransitionEnd}
      >
        <div
          className={styles.eyesFinaleFade}
          style={{
            opacity: finaleFadeOpacity,
            transition: finaleFadeTransition,
          }}
          onTransitionEnd={handleFinaleFadeEnd}
        >
          <div
            className={styles.eyesMover}
            style={{
              left: moverLeft,
              top: moverTop,
              transition:
                eyeState === "in"
                  ? `left 0.22s ${EASE_MOVE}, top 0.22s ${EASE_MOVE}`
                  : "none",
            }}
          >
            <div
              className={styles.eyesInner}
              style={{ transform: `scale(${innerScale})` }}
            >
              <img
                key={eyesImgSrc}
                src={eyesImgSrc}
                alt=""
                width={20}
                height={8}
                decoding="async"
              />
            </div>
          </div>
          {showHelloCopy && (
            <p
              className={styles.helloLine}
              style={{
                opacity: helloOpaque ? 1 : 0,
                transition: "opacity 1.05s ease-out",
              }}
            >
              oh hello...
            </p>
          )}
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <div
        className={styles.host}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div
          className={styles.photoClip}
          onPointerDown={handlePhotoPointerDown}
        >
          {mergedChild}
        </div>
      </div>
      {eyesLayer}
    </>
  );
}
