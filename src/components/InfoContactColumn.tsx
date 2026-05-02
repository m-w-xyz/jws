"use client";

import GravitySplitText from "./GravitySplitText";

type InfoContactColumnProps = {
  email: string;
  phone: string;
  instagramHandle: string;
  instagramUsername: string;
  location: string;
  contactLineClass: string;
  contactGapClass: string;
};

export default function InfoContactColumn({
  email,
  phone,
  instagramHandle,
  instagramUsername,
  location,
  contactLineClass,
  contactGapClass,
}: InfoContactColumnProps) {
  return (
    <>
      <a href={`mailto:${email}`} className={contactLineClass}>
        <GravitySplitText text={email} />
      </a>
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        className={contactLineClass}
      >
        <GravitySplitText text={phone} />
      </a>
      <a
        href={`https://instagram.com/${instagramUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${contactLineClass} ${contactGapClass}`}
      >
        <GravitySplitText text={`ig ${instagramHandle}`} />
      </a>
      <span className={`${contactLineClass} ${contactGapClass}`}>
        <GravitySplitText text={location} />
      </span>
    </>
  );
}
