"use client";

import { useEffect, useRef } from "react";

const IDLE_MS = 60_000;
const SPAWN_INTERVAL_MS = 2000;
const BLOB_SIZE = 50;
const GRAVITY_PX_S2 = 2600;
const EXPLODE_SPEED_MIN = 280;
const EXPLODE_SPEED_MAX = 720;

type Blob = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function spawnBlob(container: HTMLDivElement): Blob {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const x = Math.random() * Math.max(0, vw - BLOB_SIZE);
  const y = Math.random() * Math.max(0, vh - BLOB_SIZE);

  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.width = `${BLOB_SIZE}px`;
  el.style.height = `${BLOB_SIZE}px`;
  el.style.borderRadius = "50%";
  el.style.backgroundColor = "var(--color-accent)";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.pointerEvents = "none";
  container.appendChild(el);

  return { el, x, y, vx: 0, vy: 0 };
}

export default function IdleScreensaver() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const saverActiveRef = useRef(false);
  const explodingRef = useRef(false);
  const lastFrameTRef = useRef(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onMq = () => {
      reducedMotionRef.current = mq.matches;
    };
    mq.addEventListener("change", onMq);

    const clearIdleTimer = () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const clearSpawnInterval = () => {
      if (spawnIntervalRef.current !== null) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };

    const cancelPhysics = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const clearBlobs = () => {
      for (const b of blobsRef.current) {
        b.el.remove();
      }
      blobsRef.current = [];
    };

    const stopScreensaver = () => {
      saverActiveRef.current = false;
      clearSpawnInterval();
      cancelPhysics();
      explodingRef.current = false;
      clearBlobs();
    };

    const armIdleTimer = () => {
      clearIdleTimer();
      if (reducedMotionRef.current) return;
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        if (document.hidden) return;
        if (explodingRef.current) return;
        const container = containerRef.current;
        if (!container) return;

        saverActiveRef.current = true;
        clearSpawnInterval();

        const addOne = () => {
          if (!saverActiveRef.current || explodingRef.current) return;
          if (!containerRef.current) return;
          blobsRef.current.push(spawnBlob(containerRef.current));
        };

        addOne();
        spawnIntervalRef.current = setInterval(addOne, SPAWN_INTERVAL_MS);
      }, IDLE_MS);
    };

    const runExplosion = () => {
      if (explodingRef.current) return;
      const list = blobsRef.current;
      if (list.length === 0) {
        saverActiveRef.current = false;
        clearSpawnInterval();
        return;
      }

      explodingRef.current = true;
      saverActiveRef.current = false;
      clearSpawnInterval();

      for (const b of list) {
        const angle = Math.random() * Math.PI * 2;
        const speed =
          EXPLODE_SPEED_MIN +
          Math.random() * (EXPLODE_SPEED_MAX - EXPLODE_SPEED_MIN);
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
      }

      lastFrameTRef.current = performance.now();

      const step = (now: number) => {
        const dt = Math.min(0.05, (now - lastFrameTRef.current) / 1000);
        lastFrameTRef.current = now;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = BLOB_SIZE * 3;

        for (const b of blobsRef.current) {
          b.vy += GRAVITY_PX_S2 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.el.style.left = `${b.x}px`;
          b.el.style.top = `${b.y}px`;
        }

        const next: Blob[] = [];
        for (const b of blobsRef.current) {
          if (
            b.x < -margin ||
            b.x > vw + margin ||
            b.y < -margin ||
            b.y > vh + margin
          ) {
            b.el.remove();
          } else {
            next.push(b);
          }
        }
        blobsRef.current = next;

        if (blobsRef.current.length > 0) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          explodingRef.current = false;
        }
      };

      rafRef.current = requestAnimationFrame(step);
    };

    const onActivity = () => {
      clearIdleTimer();
      if (saverActiveRef.current || blobsRef.current.length > 0) {
        runExplosion();
      }
      armIdleTimer();
    };

    const onVisibility = () => {
      if (document.hidden) {
        clearIdleTimer();
        if (saverActiveRef.current || blobsRef.current.length > 0) {
          stopScreensaver();
        }
      } else {
        armIdleTimer();
      }
    };

    armIdleTimer();

    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("mousedown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true, capture: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("scroll", onActivity, true);
      document.removeEventListener("visibilitychange", onVisibility);
      clearIdleTimer();
      stopScreensaver();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="jw-idle-screensaver"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 380,
        pointerEvents: "none",
        overflow: "visible",
        contain: "layout style",
      }}
    />
  );
}
