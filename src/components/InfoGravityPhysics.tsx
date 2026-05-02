"use client";

import { useEffect, useRef } from "react";
import type { Body } from "matter-js";
import { useOptionalInfoGravity } from "./InfoGravityContext";
import physicsStyles from "./InfoGravity.module.css";

type MainRef = React.RefObject<HTMLElement | null>;

type TargetKind = "word" | "portrait";

type MatterNs = typeof import("matter-js");

const BAR_WALL_T = 140;

function readPhysicsViewport(layer: HTMLElement) {
  const r = layer.getBoundingClientRect();
  const iw =
    typeof window !== "undefined" ? Math.round(window.innerWidth) : 800;
  const ih =
    typeof window !== "undefined" ? Math.round(window.innerHeight) : 600;
  return {
    vw: Math.max(140, Math.round(r.width) || iw),
    vh: Math.max(140, Math.round(r.height) || ih),
  };
}

/** Static floor + side walls spanning the viewport; positions use layer pixel space. */
function createViewportBarriers(Matter: MatterNs, vw: number, vh: number) {
  const floorY = vh - 6 + BAR_WALL_T / 2;
  const span = Math.max(vh, vw) * 6;
  const floor = Matter.Bodies.rectangle(
    vw / 2,
    floorY,
    vw + BAR_WALL_T * 8,
    BAR_WALL_T,
    {
      isStatic: true,
      friction: 0.92,
      restitution: 0.18,
      label: "viewportFloor",
    },
  );
  const leftWall = Matter.Bodies.rectangle(
    -BAR_WALL_T / 2 + 4,
    vh / 2,
    BAR_WALL_T,
    span,
    {
      isStatic: true,
      friction: 0.32,
      restitution: 0.48,
      label: "viewportLeftWall",
    },
  );
  const rightWall = Matter.Bodies.rectangle(
    vw + BAR_WALL_T / 2 - 4,
    vh / 2,
    BAR_WALL_T,
    span,
    {
      isStatic: true,
      friction: 0.32,
      restitution: 0.48,
      label: "viewportRightWall",
    },
  );
  return { floor, leftWall, rightWall };
}

/** Keep draggable bodies whose DOM mirrors carry w/h inside the playable bounds when the window shrinks. */
function clampDraggablesIntoViewport(
  Matter: MatterNs,
  syncPairs: { body: Body; w: number; h: number }[],
  vw: number,
  vh: number,
) {
  const padX = 16;
  const padTop = 12;
  const floorTopSurface = vh - 6;
  const clearanceAboveFloor = 8;

  for (const { body: b, w, h } of syncPairs) {
    const ext = Math.hypot(w, h) / 2 + 4;
    const minX = padX + ext;
    const maxX = vw - padX - ext;
    const minY = padTop + ext;
    const maxY = floorTopSurface - ext - clearanceAboveFloor;

    let nx = b.position.x;
    let ny = b.position.y;
    if (minX <= maxX) nx = Math.min(Math.max(nx, minX), maxX);
    if (minY <= maxY) ny = Math.min(Math.max(ny, minY), maxY);

    if (nx !== b.position.x || ny !== b.position.y) {
      Matter.Sleeping.set(b, false);
      Matter.Body.setPosition(b, { x: nx, y: ny });
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(b, 0);
    }
  }
}

/** `mix-blend-mode` is usually set on section wrappers, not on each word span. */
function nearestMixBlendMode(el: HTMLElement, root: HTMLElement): string | undefined {
  for (let p: HTMLElement | null = el; p && p !== root; p = p.parentElement) {
    const m = window.getComputedStyle(p).mixBlendMode;
    if (m && m !== "normal") return m;
  }
  return undefined;
}

function buildTextMirror(
  source: HTMLElement,
  w: number,
  h: number,
  root: HTMLElement,
  blackText: boolean,
): HTMLDivElement {
  const cs = window.getComputedStyle(source);
  const div = document.createElement("div");
  div.textContent = source.textContent ?? "";
  div.style.boxSizing = "border-box";
  div.style.position = "absolute";
  div.style.left = "0";
  div.style.top = "0";
  div.style.width = `${w}px`;
  div.style.height = `${h}px`;
  if (blackText) {
    div.style.color = "#000";
    div.style.mixBlendMode = "normal";
  } else {
    div.style.color = cs.color;
    const blendFromTree = nearestMixBlendMode(source, root);
    const blend =
      blendFromTree ??
      (cs.mixBlendMode && cs.mixBlendMode !== "normal" ? cs.mixBlendMode : undefined);
    if (blend) div.style.mixBlendMode = blend;
  }
  div.style.fontFamily = cs.fontFamily;
  div.style.fontSize = cs.fontSize;
  div.style.fontWeight = cs.fontWeight;
  div.style.fontStyle = cs.fontStyle;
  div.style.letterSpacing = cs.letterSpacing;
  div.style.lineHeight = cs.lineHeight;
  div.style.textDecoration = cs.textDecoration;
  div.style.opacity = cs.opacity;
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.justifyContent = "flex-start";
  div.style.overflow = "hidden";
  div.style.whiteSpace = "nowrap";
  div.style.pointerEvents = "none";
  div.style.willChange = "transform";
  return div;
}

function buildPortraitMirror(
  portraitRoot: HTMLElement,
  root: HTMLElement,
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.boxSizing = "border-box";
  wrap.style.position = "absolute";
  wrap.style.left = "0";
  wrap.style.top = "0";
  wrap.style.overflow = "hidden";
  wrap.style.pointerEvents = "none";
  wrap.style.willChange = "transform";
  const portraitBlend = nearestMixBlendMode(portraitRoot, root);
  if (portraitBlend) wrap.style.mixBlendMode = portraitBlend;
  const img = portraitRoot.querySelector("img");
  if (img) {
    const clone = img.cloneNode(true) as HTMLImageElement;
    clone.removeAttribute("sizes");
    const o = window.getComputedStyle(img).objectFit || "cover";
    clone.style.width = "100%";
    clone.style.height = "100%";
    clone.style.objectFit = o;
    clone.style.display = "block";
    clone.style.pointerEvents = "none";
    wrap.appendChild(clone);
  }
  return wrap;
}

export default function InfoGravityPhysics({ mainRef }: { mainRef: MainRef }) {
  const ctx = useOptionalInfoGravity();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const abortedRef = useRef(false);
  const runGenerationRef = useRef(0);
  const gravityActive = ctx?.gravityActive ?? false;

  useEffect(() => {
    if (!gravityActive) return;

    const g = ctxRef.current;
    if (!g) return;
    const { fixGravity, bindPhysicsCleanup, setPhysicsLive } = g;
    const runId = ++runGenerationRef.current;
    abortedRef.current = false;
    bindPhysicsCleanup(null);

    const run = async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        fixGravity();
        return;
      }

      const Matter = await import("matter-js");
      if (abortedRef.current || runId !== runGenerationRef.current) {
        fixGravity();
        return;
      }

      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (abortedRef.current || runId !== runGenerationRef.current) {
        fixGravity();
        return;
      }

      const mainEl = mainRef.current;
      if (!mainEl) {
        fixGravity();
        return;
      }

      const words = Array.from(
        mainEl.querySelectorAll<HTMLElement>("[data-gravity-word]"),
      );
      const portraitRoots = Array.from(
        mainEl.querySelectorAll<HTMLElement>("[data-physics-portrait]"),
      );

      const targets: {
        source: HTMLElement;
        rect: DOMRectReadOnly;
        kind: TargetKind;
      }[] = [];

      for (const el of words) {
        const r = el.getBoundingClientRect();
        if (r.width >= 1 && r.height >= 1) {
          targets.push({ source: el, rect: r, kind: "word" });
        }
      }
      for (const el of portraitRoots) {
        const r = el.getBoundingClientRect();
        if (r.width >= 8 && r.height >= 8) {
          targets.push({ source: el, rect: r, kind: "portrait" });
        }
      }

      if (targets.length === 0) {
        fixGravity();
        return;
      }

      const layer = document.createElement("div");
      layer.className = physicsStyles.physicsLayer;
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
      if (abortedRef.current || runId !== runGenerationRef.current) {
        layer.remove();
        fixGravity();
        return;
      }

      const bodies: Body[] = [];
      const syncPairs: {
        body: Body;
        mirror: HTMLElement;
        w: number;
        h: number;
      }[] = [];

      for (const { source, rect, kind } of targets) {
        const w = rect.width;
        const h = rect.height;
        const cx = rect.left + w / 2;
        const cy = rect.top + h / 2;

        const mirror =
          kind === "portrait"
            ? buildPortraitMirror(source, mainEl)
            : buildTextMirror(source, w, h, mainEl, true);
        mirror.style.width = `${w}px`;
        mirror.style.height = `${h}px`;
        layer.appendChild(mirror);

        mirror.style.transform = `translate3d(${cx - w / 2}px, ${cy - h / 2}px, 0) rotate(0rad)`;

        const chamferR = Math.min(2, w * 0.06, h * 0.06);
        const density = kind === "portrait" ? 0.0024 : 0.0009;
        const body = Matter.Bodies.rectangle(cx, cy, w, h, {
          frictionAir: 0.001,
          friction: 0.38,
          frictionStatic: 0.52,
          restitution: kind === "portrait" ? 0.24 : 0.56,
          density,
          chamfer: chamferR > 0 ? { radius: chamferR } : undefined,
        });

        Matter.Body.setAngle(body, (Math.random() - 0.5) * 0.1);
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 1.4,
          y: (Math.random() - 0.5) * 0.35,
        });

        bodies.push(body);
        syncPairs.push({ body, mirror, w, h });
      }

      const viewport0 = readPhysicsViewport(layer);
      const barriers0 = createViewportBarriers(Matter, viewport0.vw, viewport0.vh);
      const boundaryState = {
        vw: viewport0.vw,
        vh: viewport0.vh,
        floor: barriers0.floor,
        leftWall: barriers0.leftWall,
        rightWall: barriers0.rightWall,
      };

      const engine = Matter.Engine.create({ enableSleeping: true });
      engine.gravity.y = 1;
      engine.gravity.scale = 0.00195;
      engine.positionIterations = 11;
      engine.velocityIterations = 9;

      Matter.Composite.add(engine.world, [
        ...bodies,
        boundaryState.floor,
        boundaryState.leftWall,
        boundaryState.rightWall,
      ]);

      if (abortedRef.current || runId !== runGenerationRef.current) {
        Matter.Composite.clear(engine.world, false);
        Matter.Engine.clear(engine);
        layer.remove();
        fixGravity();
        return;
      }

      mainEl.classList.add(physicsStyles.ghostOriginals);
      const prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";

      const onAfterUpdate = () => {
        for (const { body, mirror, w, h } of syncPairs) {
          mirror.style.transform = `translate3d(${body.position.x - w / 2}px, ${body.position.y - h / 2}px, 0) rotate(${body.angle}rad)`;
        }
      };
      Matter.Events.on(engine, "afterUpdate", onAfterUpdate);

      /*
       * Body coords = layout pixels from getBoundingClientRect(). Matter’s HiDPI
       * scaling via data-pixel-ratio misaligns the mouse from those bodies.
       */
      const mouse = Matter.Mouse.create(layer);
      mouse.scale = { x: 1, y: 1 };
      mouse.offset = { x: 0, y: 0 };
      mouse.pixelRatio = 1;

      let pointerSynced = false;
      const syncPointerFromClient = (clientX: number, clientY: number) => {
        pointerSynced = true;
        const r = layer.getBoundingClientRect();
        mouse.absolute.x = clientX - r.left;
        mouse.absolute.y = clientY - r.top;
        mouse.position.x = mouse.absolute.x * mouse.scale.x + mouse.offset.x;
        mouse.position.y = mouse.absolute.y * mouse.scale.y + mouse.offset.y;
      };

      const onWinMouseMove = (e: MouseEvent) => {
        syncPointerFromClient(e.clientX, e.clientY);
      };
      const onWinTouch = (e: TouchEvent) => {
        const t = e.touches[0] ?? e.changedTouches[0];
        if (t) syncPointerFromClient(t.clientX, t.clientY);
      };

      syncPointerFromClient(
        typeof window !== "undefined" ? window.innerWidth / 2 : 0,
        typeof window !== "undefined" ? window.innerHeight / 2 : 0,
      );

      window.addEventListener(
        "mousemove",
        onWinMouseMove,
        { capture: true, passive: true },
      );
      window.addEventListener(
        "touchstart",
        onWinTouch,
        { capture: true, passive: true },
      );
      window.addEventListener(
        "touchmove",
        onWinTouch,
        { capture: true, passive: false },
      );

      /* Layer listeners overwrite our coords with wrongly scaled values; drag still uses mousedown/up on layer. */
      const mouseWire = mouse as unknown as {
        mousemove: (e: Event) => void;
        mousewheel: (e: Event) => void;
      };
      layer.removeEventListener("mousemove", mouseWire.mousemove);
      layer.removeEventListener("touchmove", mouseWire.mousemove);
      layer.removeEventListener("wheel", mouseWire.mousewheel);
      const dragConstraint = Matter.Constraint.create({
        label: "Mouse Constraint",
        pointA: mouse.position,
        pointB: { x: 0, y: 0 },
        length: 0.02,
        stiffness: 0.19,
        damping: 0.04,
        render: { visible: false },
      });
      const mouseConstraint = {
        type: "mouseConstraint" as const,
        mouse,
        body: null as unknown as Body,
        constraint: dragConstraint,
        collisionFilter: {
          category: 0x0001,
          mask: 0xffffffff,
          group: 0,
        },
      } as import("matter-js").MouseConstraint;
      Matter.Composite.add(engine.world, mouseConstraint);

      const draggableBodies = bodies;

      const MC = Matter.MouseConstraint as unknown as {
        update: (
          mc: import("matter-js").MouseConstraint,
          bodyList: Body[],
        ) => void;
        _triggerEvents: (mc: import("matter-js").MouseConstraint) => void;
      };

      /** Strong push away from cursor (viewport px); skips body being dragged. */
      const REPEL_RADIUS = 360;
      const REPEL_SOFT = 6400;
      const REPEL_GAIN = 0.00205;

      const onBeforeUpdateMouse = () => {
        const mx = mouse.position.x;
        const my = mouse.position.y;
        const dragged = mouseConstraint.constraint.bodyB;

        if (pointerSynced && Number.isFinite(mx) && Number.isFinite(my)) {
          for (const b of draggableBodies) {
            if (b === dragged) continue;

            const dx = b.position.x - mx;
            const dy = b.position.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy + REPEL_SOFT);
            if (dist >= REPEL_RADIUS) continue;

            const nx = dx / dist;
            const ny = dy / dist;
            const edge = 1 - dist / REPEL_RADIUS;
            const mag = REPEL_GAIN * edge * edge * edge * b.mass * 125;

            Matter.Body.applyForce(b, b.position, {
              x: nx * mag,
              y: ny * mag,
            });
          }
        }

        MC.update(mouseConstraint, draggableBodies);
        MC._triggerEvents(mouseConstraint);
      };
      Matter.Events.on(engine, "beforeUpdate", onBeforeUpdateMouse);

      const onStartDrag = () => {
        layer.classList.add(physicsStyles.physicsLayerDragging);
      };
      const onEndDrag = () => {
        layer.classList.remove(physicsStyles.physicsLayerDragging);
      };
      Matter.Events.on(mouseConstraint, "startdrag", onStartDrag);
      Matter.Events.on(mouseConstraint, "enddrag", onEndDrag);

      const mouseInput = mouse as unknown as {
        mouseup: (e: MouseEvent | TouchEvent) => void;
      };
      const onGlobalPointerEnd = (e: MouseEvent | TouchEvent) => {
        if (mouseConstraint.body) {
          mouseInput.mouseup(e);
        }
      };
      window.addEventListener("mouseup", onGlobalPointerEnd, true);
      window.addEventListener("touchend", onGlobalPointerEnd, true);

      const runner = Matter.Runner.create();
      Matter.Runner.run(runner, engine);

      let disposed = false;
      let viewportRaf = 0;

      const visualViewport =
        typeof window !== "undefined" ? window.visualViewport : null;

      const applyPhysicsViewportResize = () => {
        if (disposed) return;
        const { vw: nw, vh: nh } = readPhysicsViewport(layer);
        if (nw === boundaryState.vw && nh === boundaryState.vh) return;

        Matter.Composite.remove(engine.world, boundaryState.floor);
        Matter.Composite.remove(engine.world, boundaryState.leftWall);
        Matter.Composite.remove(engine.world, boundaryState.rightWall);

        const rebuilt = createViewportBarriers(Matter, nw, nh);
        boundaryState.vw = nw;
        boundaryState.vh = nh;
        boundaryState.floor = rebuilt.floor;
        boundaryState.leftWall = rebuilt.leftWall;
        boundaryState.rightWall = rebuilt.rightWall;

        Matter.Composite.add(engine.world, [
          rebuilt.floor,
          rebuilt.leftWall,
          rebuilt.rightWall,
        ]);
        clampDraggablesIntoViewport(Matter, syncPairs, nw, nh);
      };

      const scheduleViewportFit = () => {
        cancelAnimationFrame(viewportRaf);
        viewportRaf = requestAnimationFrame(() => {
          viewportRaf = 0;
          applyPhysicsViewportResize();
        });
      };

      const resizeObserver = new ResizeObserver(scheduleViewportFit);
      resizeObserver.observe(layer);

      visualViewport?.addEventListener?.("resize", scheduleViewportFit);
      window.addEventListener("resize", scheduleViewportFit);

      const fullCleanup = () => {
        if (disposed) return;
        disposed = true;
        cancelAnimationFrame(viewportRaf);
        resizeObserver.disconnect();
        visualViewport?.removeEventListener?.("resize", scheduleViewportFit);
        window.removeEventListener("resize", scheduleViewportFit);
        layer.classList.remove(physicsStyles.physicsLayerDragging);
        window.removeEventListener(
          "mousemove",
          onWinMouseMove as EventListener,
          true,
        );
        window.removeEventListener(
          "touchstart",
          onWinTouch as EventListener,
          true,
        );
        window.removeEventListener(
          "touchmove",
          onWinTouch as EventListener,
          true,
        );
        window.removeEventListener("mouseup", onGlobalPointerEnd, true);
        window.removeEventListener("touchend", onGlobalPointerEnd, true);
        Matter.Events.off(mouseConstraint, "startdrag", onStartDrag);
        Matter.Events.off(mouseConstraint, "enddrag", onEndDrag);
        Matter.Runner.stop(runner);
        Matter.Events.off(engine, "beforeUpdate", onBeforeUpdateMouse);
        Matter.Events.off(engine, "afterUpdate", onAfterUpdate);
        Matter.Composite.remove(engine.world, mouseConstraint);
        Matter.Composite.clear(engine.world, false);
        Matter.Engine.clear(engine);
        document.documentElement.style.overflow = prevOverflow;
        mainEl.classList.remove(physicsStyles.ghostOriginals);
        layer.remove();
      };

      if (abortedRef.current || runId !== runGenerationRef.current) {
        fullCleanup();
        fixGravity();
        return;
      }

      bindPhysicsCleanup(fullCleanup);
      setPhysicsLive(true);
    };

    void run();

    return () => {
      abortedRef.current = true;
      ctxRef.current?.fixGravity();
    };
  }, [gravityActive, mainRef]);

  return null;
}
