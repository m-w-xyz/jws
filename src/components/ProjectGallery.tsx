"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeHexColour } from "@/lib/hex-format";
import {
  normalizeGalleryItems,
  type SanityGalleryRow,
} from "@/lib/normalize-gallery";
import styles from "./ProjectGallery.module.css";

const AUTO_ADVANCE_MS = 5000;

type ProjectGalleryProps = {
  gallery: SanityGalleryRow[];
  projectTitle: string;
  /** Behind letterboxed video when Fit is enabled. */
  projectColour?: string | null;
};

export default function ProjectGallery({
  gallery,
  projectTitle,
  projectColour,
}: ProjectGalleryProps) {
  const items = useMemo(() => normalizeGalleryItems(gallery), [gallery]);
  const normalizedProjectColour = useMemo(
    () => normalizeHexColour(projectColour ?? undefined),
    [projectColour],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const pauseCarouselForActiveSlide =
    items[activeIndex]?.kind === "video";

  const activeItem = items[activeIndex];
  const activeVideoSlide = activeItem?.kind === "video";
  const activeNativeVideo =
    activeVideoSlide && activeItem.resolved.embedType === "file";
  const activeIframeVideo =
    activeVideoSlide && activeItem.resolved.embedType === "iframe";

  const [nativeVideoPlaying, setNativeVideoPlaying] = useState(false);
  const [iframeVideoReady, setIframeVideoReady] = useState(false);
  const [videoFitContain, setVideoFitContain] = useState(false);

  useEffect(() => {
    setNativeVideoPlaying(false);
    setIframeVideoReady(false);
    setVideoFitContain(false);
  }, [activeIndex]);

  const hideNavArrows =
    items.length > 1 &&
    ((activeNativeVideo && nativeVideoPlaying) ||
      (activeIframeVideo && iframeVideoReady));

  const goToPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    if (pauseCarouselForActiveSlide) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [items.length, activeIndex, pauseCarouselForActiveSlide]);

  if (!items.length) {
    return (
      <div
        className={styles.gallery}
        aria-label={`${projectTitle} — no gallery items yet`}
      >
        <div
          className={styles.mainImage}
          style={{ backgroundColor: "var(--color-bg)", minHeight: 400 }}
        />
      </div>
    );
  }

  const first = items[0];
  const transitionPoster =
    first?.kind === "video" ? first.posterAsset : undefined;

  const galleryFitStyle =
    activeVideoSlide && videoFitContain && normalizedProjectColour
      ? ({
          ["--gallery-video-fit-bg"]: normalizedProjectColour,
        } as CSSProperties)
      : undefined;

  return (
    <div className={styles.gallery} style={galleryFitStyle}>
      <div className={styles.mainImage}>
        {transitionPoster?.url ? (
          <Image
            src={transitionPoster.url}
            alt=""
            width={3}
            height={3}
            sizes="1px"
            className={styles.transitionGate}
            priority
            fetchPriority="high"
            placeholder={transitionPoster.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={transitionPoster.metadata?.lqip}
            data-transition-primary=""
            aria-hidden
          />
        ) : null}
        {items.map((item, i) =>
          item.kind === "image" ? (
            <Image
              key={item._key}
              src={item.asset.url}
              alt={`${projectTitle} — image ${i + 1}`}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 55vw"
              {...(i === 0 && first?.kind === "image"
                ? {
                    priority: true,
                    fetchPriority: "high" as const,
                    "data-transition-primary": "" as const,
                  }
                : {
                    loading: "eager" as const,
                    fetchPriority: "low" as const,
                  })}
              placeholder={item.asset.metadata?.lqip ? "blur" : "empty"}
              blurDataURL={item.asset.metadata?.lqip}
              aria-hidden={i !== activeIndex}
              className={styles.slideImage}
              style={{ opacity: i === activeIndex ? 1 : 0 }}
            />
          ) : (
            <div
              key={item._key}
              className={`${styles.slideLayer} ${i === activeIndex && videoFitContain ? styles.slideLayerVideoContain : ""}`}
              style={{ opacity: i === activeIndex ? 1 : 0 }}
              aria-hidden={i !== activeIndex}
            >
              {i === activeIndex ? (
                item.resolved.embedType === "iframe" ? (
                  <div
                    className={
                      videoFitContain
                        ? styles.embedSizerContain
                        : styles.embedSizer
                    }
                  >
                    <iframe
                      title=""
                      src={item.resolved.src}
                      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                      referrerPolicy="strict-origin-when-cross-origin"
                      className={
                        videoFitContain
                          ? styles.embedCoverContain
                          : styles.embedCover
                      }
                      loading="eager"
                      onLoad={() => setIframeVideoReady(true)}
                    />
                  </div>
                ) : (
                  <video
                    className={`${styles.nativeVideo} ${videoFitContain ? styles.nativeVideoFit : ""}`}
                    src={item.resolved.src}
                    muted
                    playsInline
                    autoPlay
                    loop
                    disablePictureInPicture
                    controls={false}
                    preload="metadata"
                    onPlay={() => setNativeVideoPlaying(true)}
                    onPause={() => setNativeVideoPlaying(false)}
                    onError={() =>
                      setActiveIndex((i) =>
                        items.length <= 1 ? i : (i + 1) % items.length,
                      )
                    }
                  />
                )
              ) : null}
            </div>
          ),
        )}
        {!hideNavArrows && items.length > 1 ? (
          <>
            <button
              type="button"
              className={styles.prevHalf}
              onClick={goToPrev}
              aria-label="Previous slide"
            />
            <button
              type="button"
              className={styles.nextHalf}
              onClick={goToNext}
              aria-label="Next slide"
            />
          </>
        ) : null}
        {activeVideoSlide ? (
          <button
            type="button"
            className={styles.videoFitButton}
            aria-pressed={videoFitContain}
            onClick={() => setVideoFitContain((prev) => !prev)}
          >
            {videoFitContain ? "Fill" : "Fit"}
          </button>
        ) : null}
      </div>

      {items.length > 1 && (
        <div className={styles.thumbnails}>
          {items.map((item, i) =>
            item.kind === "image" ? (
              <button
                key={item._key}
                type="button"
                className={`${styles.thumb} ${i === activeIndex ? styles.active : ""}`}
                onClick={() => setActiveIndex(i)}
              >
                <Image
                  src={item.asset.url}
                  alt=""
                  fill
                  sizes="60px"
                  loading="lazy"
                  fetchPriority="low"
                />
              </button>
            ) : (
              <button
                key={item._key}
                type="button"
                className={`${styles.thumb} ${i === activeIndex ? styles.active : ""} ${styles.thumbVideo}`}
                onClick={() => setActiveIndex(i)}
              >
                {item.posterAsset?.url ? (
                  <Image
                    src={item.posterAsset.url}
                    alt=""
                    fill
                    sizes="60px"
                    loading="lazy"
                    fetchPriority="low"
                  />
                ) : (
                  <span className={styles.videoThumbSolid} aria-hidden />
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
