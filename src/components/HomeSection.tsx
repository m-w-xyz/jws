"use client";

import { forwardRef, useState } from "react";
import Image from "next/image";
import { TransitionLink } from "./PageTransitionProvider";
import styles from "./HomeSection.module.css";

export type HomeSectionProps = {
  title: string;
  href: string | null;
  orderNumber?: number;
  projectColour?: string | null;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  imagePosition: "left" | "right";
  blurDataURL?: string;
  hoverBlurDataURL?: string;
  /** First section only: tagged for mobile page transitions (see PageTransitionProvider). */
  transitionPrimary?: boolean;
};

const HomeSection = forwardRef<HTMLElement, HomeSectionProps>(function HomeSection(
  {
    title,
    href,
    orderNumber,
    projectColour,
    imageUrl,
    hoverImageUrl,
    imagePosition,
    blurDataURL,
    hoverBlurDataURL,
    transitionPrimary,
  },
  ref,
) {
  const [hovered, setHovered] = useState(false);
  const isLeft = imagePosition === "left";
  const primaryClass = isLeft ? styles.primaryLeft : styles.primaryRight;
  const secondaryClass = isLeft ? styles.secondaryRight : styles.secondaryLeft;

  const primaryInner = imageUrl ? (
    <Image
      src={imageUrl}
      alt={title}
      fill
      sizes="(max-width: 1023px) 100vw, 50vw"
      quality={90}
      placeholder={blurDataURL ? "blur" : "empty"}
      blurDataURL={blurDataURL}
      {...(transitionPrimary
        ? {
            priority: true,
            fetchPriority: "high" as const,
            "data-transition-primary": "",
          }
        : {})}
    />
  ) : (
    <div className={styles.placeholder} />
  );

  const primaryStack = (
    <div className={styles.primaryImageStack}>{primaryInner}</div>
  );

  const handleEnter = () => setHovered(true);
  const handleLeave = () => setHovered(false);

  return (
    <section ref={ref} className={styles.section}>
      {/* Only the primary (large) image is hoverable + clickable. */}
      {href ? (
        <TransitionLink
          href={href}
          transitionColour={projectColour ?? null}
          className={`${styles.primaryImage} ${primaryClass}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {primaryStack}
        </TransitionLink>
      ) : (
        <div
          className={`${styles.primaryImage} ${primaryClass} ${styles.static}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {primaryStack}
        </div>
      )}

      {/* Decorative siblings — outside the link, so they aren't clickable
          and don't extend the hover hit area. */}
      {hoverImageUrl && (
        <div
          className={`${styles.secondaryImage} ${secondaryClass} ${
            hovered ? styles.visible : ""
          }`}
          aria-hidden
        >
          <Image
            src={hoverImageUrl}
            alt=""
            fill
            sizes="(max-width: 1023px) 0px, 28vw"
            quality={90}
            placeholder={hoverBlurDataURL ? "blur" : "empty"}
            blurDataURL={hoverBlurDataURL}
          />
        </div>
      )}

      {orderNumber !== undefined && (
        <span
          className={`${styles.hoverNumber} ${hovered ? styles.visible : ""}`}
          data-home-project-caption
          aria-hidden
        >
          {orderNumber}
        </span>
      )}
      <span
        className={`${styles.hoverTitle} ${hovered ? styles.visible : ""}`}
        data-home-project-caption
        aria-hidden
      >
        {title}
      </span>
    </section>
  );
});

HomeSection.displayName = "HomeSection";

export default HomeSection;
