"use client";

import { useMemo } from "react";

type GravitySplitTextProps = {
  text: string;
  className?: string;
};

/** Splits copy into word spans tagged for the info-page gravity / physics pass. */
export default function GravitySplitText({ text, className }: GravitySplitTextProps) {
  const pieces = useMemo(() => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((tok, i) => ({
      key: i,
      isSpace: /^\s+$/.test(tok),
      tok,
    }));
  }, [text]);

  return (
    <span className={className}>
      {pieces.map((p) =>
        p.isSpace ? (
          <span key={p.key}>{p.tok}</span>
        ) : (
          <span key={p.key} data-gravity-word>
            {p.tok}
          </span>
        ),
      )}
    </span>
  );
}
