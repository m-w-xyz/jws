"use client";

import { useState } from "react";
import Image from "next/image";
import { TransitionLink } from "./PageTransitionProvider";
import styles from "./ProjectCard.module.css";

type ProjectCardProps = {
  title: string;
  href: string | null;
  orderNumber?: number;
  projectColour?: string | null;
  thumbnailUrl: string | null;
  hoverThumbnailUrl?: string | null;
  blurDataURL?: string;
  hoverBlurDataURL?: string;
};

export default function ProjectCard({
  title,
  href,
  orderNumber,
  projectColour,
  thumbnailUrl,
  hoverThumbnailUrl,
  blurDataURL,
  hoverBlurDataURL,
}: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);

  const inner = (
    <>
      <div className={styles.imageWrap}>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
            placeholder={blurDataURL ? "blur" : "empty"}
            blurDataURL={blurDataURL}
            className={styles.featuredImage}
          />
        ) : (
          <div className={styles.placeholder} />
        )}
        {hoverThumbnailUrl && (
          <Image
            src={hoverThumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
            placeholder={hoverBlurDataURL ? "blur" : "empty"}
            blurDataURL={hoverBlurDataURL}
            className={`${styles.hoverImage} ${hovered ? styles.visible : ""}`}
            aria-hidden
          />
        )}
      </div>
      <div className={`${styles.meta} ${hovered ? styles.faded : ""}`}>
        {orderNumber !== undefined && (
          <span className={styles.number}>{orderNumber}</span>
        )}
        <span className={styles.title}>{title}</span>
      </div>
    </>
  );

  if (href) {
    return (
      <TransitionLink
        href={href}
        transitionColour={projectColour ?? null}
        className={styles.card}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </TransitionLink>
    );
  }

  return <div className={`${styles.card} ${styles.static}`}>{inner}</div>;
}
