"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type TransitionEvent,
} from "react";
import { EASTER_EGG_HOVER_MS } from "@/lib/easter-egg";
import { useSplashHome } from "@/components/SiteShell";
import { useNotFoundChrome } from "@/contexts/NotFoundChromeContext";
import styles from "./not-found.module.css";

const EYES_SRC = "/images/jws-eyes.svg";

const EASE_SNAP =
  "cubic-bezier(0.58, 0.08, 0.13, 1)";
const EASE_DRIFT = "cubic-bezier(0.19, 1, 0.22, 1)";

/** Max cursor-follow offset (px); PARALLAX_DEPTH scales per digit for layered motion. */
const PARALLAX_MAX_PX = 48;
const PARALLAX_LERP = 0.12;
const PARALLAX_DEPTH = { four1: 0.2, four2: 0.52, zero: 1 } as const;

/** Whole 404 block eases toward cursor (slower / wider than per-digit parallax). */
const CONTAINER_FOLLOW_MAX_PX = 168;
const CONTAINER_FOLLOW_LERP = 0.048;

/** Go back: every frame while fleeing, steps away from last pointer + lerps (keeps moving). */
const GO_BACK_FLEE_PER_FRAME = 18;
const GO_BACK_LERP_NEAR = 0.52;
const GO_BACK_LERP_FAR = 0.16;
/** Normalize separation by ½ viewport — past ~1 on either axis, speed eases toward floor. */
const GO_BACK_FAR_HALF = 0.5;
const GO_BACK_SPEED_FLOOR = 0.14;
const GO_BACK_SPEED_SMOOTH = 0.15;

type Offset = { x: number; y: number };

type DragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
};

type EyesPlacement = {
  left: number;
  top: number;
  rotateDeg: number;
};

function eyesBoxPx(): { w: number; h: number } {
  if (typeof window === "undefined") return { w: 84, h: 34 };
  const w = Math.min(window.innerWidth * 0.16, 84);
  return { w, h: w * (8 / 20) };
}

function bottomRightPlacement(): EyesPlacement {
  const margin = 12;
  const { w, h } = eyesBoxPx();
  return {
    left: Math.max(margin, window.innerWidth - margin - w),
    top: Math.max(margin, window.innerHeight - margin - h),
    rotateDeg: 0,
  };
}

function randomPlacement(): EyesPlacement {
  const margin = 16;
  const { w, h } = eyesBoxPx();
  const maxL = Math.max(margin, window.innerWidth - margin - w);
  const maxT = Math.max(margin, window.innerHeight - margin - h);
  return {
    left: margin + Math.random() * (maxL - margin),
    top: margin + Math.random() * (maxT - margin),
    rotateDeg: Math.random() * 360,
  };
}

function useDigitDrag() {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const drag = useRef<DragState | null>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const o = offsetRef.current;
    drag.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: o.x,
      originY: o.y,
    };
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    setOffset({
      x: d.originX + (e.clientX - d.startClientX),
      y: d.originY + (e.clientY - d.startClientY),
    });
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  return { offset, onPointerDown, onPointerMove, onPointerUp };
}

function useCursorParallax() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const t = targetRef.current;
    const c = currentRef.current;
    const k = PARALLAX_LERP;
    c.x += (t.x - c.x) * k;
    c.y += (t.y - c.y) * k;
    setParallax({ x: c.x, y: c.y });

    const still =
      Math.abs(t.x - c.x) > 0.02 || Math.abs(t.y - c.y) > 0.02;
    if (still) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    const enabled = () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const onMove = (e: MouseEvent) => {
      if (!enabled()) return;
      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const nx = (e.clientX - cx) / Math.max(cx, 1);
      const ny = (e.clientY - cy) / Math.max(cy, 1);
      targetRef.current = {
        x: nx * PARALLAX_MAX_PX,
        y: ny * PARALLAX_MAX_PX,
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onLeave = () => {
      targetRef.current = { x: 0, y: 0 };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      stopLoop();
    };
  }, [stopLoop, tick]);

  return parallax;
}

function useNumbersFollowMouse(ref: RefObject<HTMLDivElement | null>) {
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const t = targetRef.current;
    const c = currentRef.current;
    const k = CONTAINER_FOLLOW_LERP;
    c.x += (t.x - c.x) * k;
    c.y += (t.y - c.y) * k;

    const el = ref.current;
    const eps = 0.06;
    const chasing = Math.abs(t.x - c.x) > eps || Math.abs(t.y - c.y) > eps;

    if (el) {
      if (!chasing && Math.abs(c.x) < eps && Math.abs(c.y) < eps) {
        c.x = 0;
        c.y = 0;
        el.style.removeProperty("transform");
      } else {
        el.style.transform = `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px))`;
      }
    }

    if (chasing) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = null;
    }
  }, [ref]);

  useEffect(() => {
    const enabled = () =>
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const onMove = (e: MouseEvent) => {
      if (!enabled()) return;
      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const nx = (e.clientX - cx) / Math.max(cx, 1);
      const ny = (e.clientY - cy) / Math.max(cy, 1);
      targetRef.current = {
        x: nx * CONTAINER_FOLLOW_MAX_PX,
        y: ny * CONTAINER_FOLLOW_MAX_PX,
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onLeave = () => {
      targetRef.current = { x: 0, y: 0 };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      stopLoop();
      targetRef.current = { x: 0, y: 0 };
      currentRef.current = { x: 0, y: 0 };
      if (ref.current) ref.current.style.removeProperty("transform");
    };
  }, [ref, stopLoop, tick]);
}

type EggAnim = "idle" | "in" | "out";

type Props = {
  linkText: string;
};

export default function NotFoundClient({ linkText }: Props) {
  const router = useRouter();
  const splashHome = useSplashHome();
  const notFoundChrome = useNotFoundChrome();
  const set404Active = notFoundChrome?.set404Active;

  useEffect(() => {
    set404Active?.(true);
    return () => set404Active?.(false);
  }, [set404Active]);
  const d1 = useDigitDrag();
  const d2 = useDigitDrag();
  const d0 = useDigitDrag();
  const parallax = useCursorParallax();
  const numbersRef = useRef<HTMLDivElement | null>(null);
  useNumbersFollowMouse(numbersRef);

  const [eggState, setEggState] = useState<EggAnim>("idle");
  const [placement, setPlacement] = useState<EyesPlacement>({
    left: 0,
    top: 0,
    rotateDeg: 0,
  });
  const [floatY, setFloatY] = useState(28);
  const [eyesTransition, setEyesTransition] = useState("none");
  const [goBackPos, setGoBackPos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const [goBackFleeing, setGoBackFleeing] = useState(false);

  const goBackBtnRef = useRef<HTMLButtonElement | null>(null);
  const goBackPosRef = useRef({ left: 0, top: 0 });
  const goBackTargetRef = useRef({ left: 0, top: 0 });
  const goBackActiveRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const goBackSlideHoldRef = useRef<{ x: number; y: number } | null>(null);
  const goBackSpeedSmoothRef = useRef(1);

  const eggTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);
  const finePointerRef = useRef(true);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    finePointerRef.current = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
  }, []);

  const clearEggTimer = useCallback(() => {
    if (eggTimerRef.current) {
      clearTimeout(eggTimerRef.current);
      eggTimerRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    if (eggState !== "in") {
      if (eggState === "idle") {
        setFloatY(28);
        setEyesTransition("none");
      }
      if (eggState === "out") {
        setEyesTransition("opacity 0.35s ease-in, transform 0.35s ease-in");
      }
      return;
    }

    if (reducedMotionRef.current) return;

    setPlacement(bottomRightPlacement());
    setFloatY(28);
    setEyesTransition("none");

    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setFloatY(0);
        setEyesTransition(
          `opacity 5.5s ease-out, transform 5.5s ${EASE_DRIFT}`,
        );
      });
    });

    return () => window.cancelAnimationFrame(id);
  }, [eggState]);

  useEffect(() => {
    if (!goBackFleeing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const EPS = 0.28;
    const moved = (nl: number, nt: number, ol: number, ot: number) =>
      Math.abs(nl - ol) > EPS || Math.abs(nt - ot) > EPS;

    const loop = () => {
      const el = goBackBtnRef.current;
      const lp = lastPointerRef.current;
      if (el && goBackActiveRef.current && lp) {
        const rect = el.getBoundingClientRect();
        const bcx = rect.left + rect.width / 2;
        const bcy = rect.top + rect.height / 2;
        let dx = bcx - lp.x;
        let dy = bcy - lp.y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) {
          dx = 1;
          dy = 0;
        } else {
          dx /= len;
          dy /= len;
        }
        const estW = rect.width;
        const estH = rect.height;
        const margin = 12;
        const maxX = Math.max(margin, window.innerWidth - estW - margin);
        const maxY = Math.max(margin, window.innerHeight - estH - margin);
        const clampX = (v: number) => Math.min(Math.max(margin, v), maxX);
        const clampY = (v: number) => Math.min(Math.max(margin, v), maxY);

        const halfW = window.innerWidth * GO_BACK_FAR_HALF;
        const halfH = window.innerHeight * GO_BACK_FAR_HALF;
        const farMetric = Math.max(
          Math.abs(bcx - lp.x) / Math.max(halfW, 1),
          Math.abs(bcy - lp.y) / Math.max(halfH, 1),
        );
        const targetSpeed = Math.max(
          GO_BACK_SPEED_FLOOR,
          1 -
            Math.min(1, Math.max(0, farMetric - 0.12) / 0.88) *
              (1 - GO_BACK_SPEED_FLOOR),
        );
        goBackSpeedSmoothRef.current +=
          (targetSpeed - goBackSpeedSmoothRef.current) * GO_BACK_SPEED_SMOOTH;
        const speedMult = goBackSpeedSmoothRef.current;
        const step = GO_BACK_FLEE_PER_FRAME * speedMult;
        const k =
          GO_BACK_LERP_FAR +
          (GO_BACK_LERP_NEAR - GO_BACK_LERP_FAR) * speedMult;

        const t = goBackTargetRef.current;
        let nl = t.left;
        let nt = t.top;

        const tryPrimary = () => {
          const pl = clampX(t.left + dx * step);
          const pt = clampY(t.top + dy * step);
          return { pl, pt, ok: moved(pl, pt, t.left, t.top) };
        };

        const primary = tryPrimary();
        if (primary.ok) {
          goBackSlideHoldRef.current = null;
          nl = primary.pl;
          nt = primary.pt;
        } else if (goBackSlideHoldRef.current) {
          const h = goBackSlideHoldRef.current;
          nl = clampX(t.left + h.x * step);
          nt = clampY(t.top + h.y * step);
          if (!moved(nl, nt, t.left, t.top)) {
            goBackSlideHoldRef.current = null;
            nl = t.left;
            nt = t.top;
          }
        } else {
          const px = -dy;
          const py = dx;
          nl = clampX(t.left + px * step);
          nt = clampY(t.top + py * step);
          if (moved(nl, nt, t.left, t.top)) {
            goBackSlideHoldRef.current = { x: px, y: py };
          } else {
            nl = t.left;
            nt = t.top;
          }
        }

        goBackTargetRef.current = { left: nl, top: nt };

        const c = goBackPosRef.current;
        const tt = goBackTargetRef.current;
        c.left += (tt.left - c.left) * k;
        c.top += (tt.top - c.top) * k;
        setGoBackPos({ left: c.left, top: c.top });
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      goBackSlideHoldRef.current = null;
      goBackSpeedSmoothRef.current = 1;
    };
  }, [goBackFleeing]);

  useEffect(() => {
    if (!goBackFleeing) return;
    const onMove = (e: MouseEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [goBackFleeing]);

  const handleZeroEnter = useCallback(() => {
    if (leaveDebounceRef.current) {
      clearTimeout(leaveDebounceRef.current);
      leaveDebounceRef.current = null;
    }
    if (reducedMotionRef.current || !finePointerRef.current) return;
    clearEggTimer();
    eggTimerRef.current = setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setEggState("in");
    }, EASTER_EGG_HOVER_MS);
  }, [clearEggTimer]);

  const handleZeroLeave = useCallback(() => {
    setEggState((prev) => (prev === "in" ? "out" : prev));
    leaveDebounceRef.current = setTimeout(() => {
      clearEggTimer();
      leaveDebounceRef.current = null;
    }, 250);
  }, [clearEggTimer]);

  const handleGoBackEnter = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
        if (!goBackActiveRef.current) {
          goBackActiveRef.current = true;
          const r = e.currentTarget.getBoundingClientRect();
          goBackPosRef.current = { left: r.left, top: r.top };
          goBackTargetRef.current = { left: r.left, top: r.top };
          setGoBackPos({ left: r.left, top: r.top });
          setGoBackFleeing(true);
        }
      }

      if (eggState !== "in") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPlacement(randomPlacement());
        return;
      }
      setEyesTransition(
        `left 0.42s ${EASE_SNAP}, top 0.42s ${EASE_SNAP}, transform 0.42s ${EASE_SNAP}`,
      );
      setPlacement(randomPlacement());
    },
    [eggState],
  );

  const handleGoBackClick = useCallback(() => {
    (splashHome ?? (() => router.push("/")))();
  }, [splashHome, router]);

  useEffect(
    () => () => {
      clearEggTimer();
      if (leaveDebounceRef.current) clearTimeout(leaveDebounceRef.current);
    },
    [clearEggTimer],
  );

  const handleEggTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "opacity") return;
      setEggState((prev) => (prev === "out" ? "idle" : prev));
    },
    [],
  );

  const opacity = eggState === "in" ? 1 : 0;
  const transform = `translate3d(0, ${floatY}px, 0) rotate(${placement.rotateDeg}deg) scale(0.5)`;

  const goBackStyle =
    goBackPos === null
      ? undefined
      : {
          position: "fixed" as const,
          left: goBackPos.left,
          top: goBackPos.top,
          transform: "none",
          transformOrigin: "center center" as const,
          zIndex: 200,
        };

  return (
    <main className={styles.page}>
      <div className={styles.numbers} ref={numbersRef}>
        <div
          className={`${styles.dragWrap} ${styles.four1Wrap}`}
          style={{
            transform: `translate3d(${d1.offset.x + parallax.x * PARALLAX_DEPTH.four1}px, ${d1.offset.y + parallax.y * PARALLAX_DEPTH.four1}px, 0)`,
          }}
          onPointerDown={d1.onPointerDown}
          onPointerMove={d1.onPointerMove}
          onPointerUp={d1.onPointerUp}
          onPointerCancel={d1.onPointerUp}
        >
          <span className={styles.four1}>4</span>
        </div>
        <div
          className={`${styles.dragWrap} ${styles.four2Wrap}`}
          style={{
            transform: `translate3d(${d2.offset.x + parallax.x * PARALLAX_DEPTH.four2}px, ${d2.offset.y + parallax.y * PARALLAX_DEPTH.four2}px, 0)`,
          }}
          onPointerDown={d2.onPointerDown}
          onPointerMove={d2.onPointerMove}
          onPointerUp={d2.onPointerUp}
          onPointerCancel={d2.onPointerUp}
        >
          <span className={styles.four2}>4</span>
        </div>
        <div
          className={`${styles.dragWrap} ${styles.zeroWrap}`}
          style={{
            transform: `translate3d(${d0.offset.x + parallax.x * PARALLAX_DEPTH.zero}px, ${d0.offset.y + parallax.y * PARALLAX_DEPTH.zero}px, 0)`,
          }}
          onPointerDown={d0.onPointerDown}
          onPointerMove={d0.onPointerMove}
          onPointerUp={d0.onPointerUp}
          onPointerCancel={d0.onPointerUp}
          onPointerEnter={handleZeroEnter}
          onPointerLeave={handleZeroLeave}
        >
          <span className={styles.zero}>0</span>
        </div>
      </div>

      <div className={styles.textRow}>
        <button
          ref={goBackBtnRef}
          type="button"
          className={`${styles.goBack} ${goBackPos ? styles.goBackFloating : ""}`}
          style={goBackStyle}
          onClick={handleGoBackClick}
          onPointerEnter={handleGoBackEnter}
        >
          {linkText}
        </button>
      </div>

      <div
        className={styles.eyesViewport}
        data-state={eggState}
        aria-hidden
        onTransitionEnd={handleEggTransitionEnd}
        style={{
          left: placement.left,
          top: placement.top,
          opacity,
          transform,
          transition: eyesTransition,
        }}
      >
        <img src={EYES_SRC} alt="" width={20} height={8} decoding="async" />
      </div>
    </main>
  );
}
