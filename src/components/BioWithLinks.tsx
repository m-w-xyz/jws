"use client";

import type { ReactNode } from "react";
import GravitySplitText from "./GravitySplitText";

function segmentToNode(
  segment: string,
  i: number,
  email: string,
  instagramUsername: string,
): ReactNode {
  const lower = segment.toLowerCase();
  if (lower === "email") {
    return (
      <a key={i} href={`mailto:${email}`}>
        <GravitySplitText text={segment} />
      </a>
    );
  }
  if (lower === "instagram") {
    return (
      <a
        key={i}
        href={`https://instagram.com/${instagramUsername}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GravitySplitText text={segment} />
      </a>
    );
  }
  return <GravitySplitText key={i} text={segment} />;
}

export function bioParagraphToNodes(
  text: string,
  email: string,
  instagramUsername: string,
): ReactNode {
  const segments = text.split(/(\b(?:email|instagram)\b)/gi);
  return segments.map((segment, i) =>
    segmentToNode(segment, i, email, instagramUsername),
  );
}

type BioParagraphsProps = {
  paragraphs: string[];
  email: string;
  instagramUsername: string;
};

/** Renders bio lines with “email” / “instagram” linked (matches `/info` behaviour). */
export default function BioParagraphs({
  paragraphs,
  email,
  instagramUsername,
}: BioParagraphsProps) {
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{bioParagraphToNodes(p, email, instagramUsername)}</p>
      ))}
    </>
  );
}
