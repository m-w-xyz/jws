"use client";

import type { CvRow } from "@/lib/about-cv";
import GravitySplitText from "./GravitySplitText";

export type AboutCvClassNames = {
  cvSection: string;
  cvSectionTitle: string;
  cvEntry: string;
  cvYear: string;
  cvMain: string;
  cvName: string;
  cvNameLink: string;
};

type CvSectionBlockProps = {
  title: string;
  items: CvRow[];
  cls: AboutCvClassNames;
};

export function CvSectionBlock({ title, items, cls }: CvSectionBlockProps) {
  if (!items.length) return null;
  return (
    <div className={cls.cvSection}>
      <h3 className={cls.cvSectionTitle}>
        <GravitySplitText text={title} />
      </h3>
      {items.map((row, idx) => {
        const yearDisplay =
          idx === 0 || row.year !== items[idx - 1].year ? row.year : "";
        return (
          <div key={row._key} className={cls.cvEntry}>
            <span className={cls.cvYear}>
              {yearDisplay ? <GravitySplitText text={yearDisplay} /> : null}
            </span>
            <div className={cls.cvMain}>
              {row.link ? (
                <a
                  href={row.link}
                  className={`${cls.cvName} ${cls.cvNameLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GravitySplitText text={row.name} />
                </a>
              ) : (
                <span className={cls.cvName}>
                  <GravitySplitText text={row.name} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
