import { useEffect, useState } from "react";
import { PatchEvent, set, type StringInputProps, unset } from "sanity";

import { normalizeHexColour } from "../../src/lib/hex-format";

/** `#rgb` → `#rrggbb` for `<input type="color">`. */
function expandToSixDigit(hex: string): string {
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    const a = hex[1]!;
    const b = hex[2]!;
    const c = hex[3]!;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return "#000000";
}

function hexToRgbTuple(hexSix: string): [number, number, number] {
  const h = hexSix.replace("#", "");
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbTupleToHex(r: number, g: number, b: number): string {
  const clamp = (x: number) => Math.min(255, Math.max(0, Math.round(x)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}

function isStrictHex(s: string | undefined | null): s is string {
  if (!s) return false;
  const lower = s.toLowerCase();
  return /^#[0-9a-f]{3}$/.test(lower) || /^#[0-9a-f]{6}$/.test(lower);
}

/** Canonical `#rgb` / `#rrggbb` from document string, if valid. */
function strictFromStored(val: unknown): string | undefined {
  const n = normalizeHexColour(typeof val === "string" ? val : "")?.toLowerCase();
  return isStrictHex(n) ? n : undefined;
}

/** Normalise pasted string and only persist strict hex so partial `#` never saves. */
function patchHex(raw: string, onChange: StringInputProps["onChange"]) {
  const t = raw.trim();
  if (!t) {
    onChange(unset());
    return;
  }
  const n = normalizeHexColour(t)?.toLowerCase();
  if (!isStrictHex(n)) return;
  onChange(PatchEvent.from(set(n)));
}

export function ProjectColourInput(props: StringInputProps) {
  const { value, elementProps, onChange } = props;
  const readOnly = elementProps.readOnly;

  const canonical = strictFromStored(value);

  const [hexDraft, setHexDraft] = useState(
    () => canonical ?? (typeof value === "string" ? value : ""),
  );

  useEffect(() => {
    const c = strictFromStored(value);
    setHexDraft(c ?? (typeof value === "string" ? value : ""));
  }, [value]);

  const colorPickerValue = canonical
    ? expandToSixDigit(canonical)
    : "#000000";

  let r = 0;
  let g = 0;
  let b = 0;
  if (canonical) {
    [r, g, b] = hexToRgbTuple(expandToSixDigit(canonical));
  }

  const draftTrimmed = hexDraft.trim();
  const hexHint =
    draftTrimmed !== "" &&
    !isStrictHex(normalizeHexColour(draftTrimmed)?.toLowerCase());

  return (
    <div style={{ width: "100%" }}>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 13,
          lineHeight: 1.45,
          color: "var(--card-muted-fg-color, rgba(0, 0, 0, 0.62))",
        }}
      >
        Mark suggests{" "}
        <code
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            fontSize: "0.95em",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--card-code-bg-color, rgba(0, 0, 0, 0.06))",
          }}
        >
          {canonical ? expandToSixDigit(canonical) : "—"}
        </code>
        {`, but you do you <3. This is for the page transitions as the project page loads.`}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <input
          type="color"
          value={colorPickerValue}
          disabled={readOnly}
          onChange={(e) => patchHex(e.target.value, onChange)}
          aria-label="Pick colour visually"
          title="Colour picker"
          style={{
            flex: "0 0 auto",
            width: 44,
            height: 44,
            padding: 0,
            border: "none",
            borderRadius: 4,
            cursor: readOnly ? "default" : "pointer",
          }}
        />

        <label
          style={{
            flex: "1 1 180px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 11, whiteSpace: "nowrap", opacity: 0.7 }}>
            Hex
          </span>
          <input
            type="text"
            value={hexDraft}
            disabled={readOnly}
            spellCheck={false}
            placeholder="#c45a3c"
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(e) => {
              const raw = e.target.value;
              setHexDraft(raw);
              if (!raw.trim()) patchHex("", onChange);
              else {
                const n = normalizeHexColour(raw.trim())?.toLowerCase();
                if (isStrictHex(n)) patchHex(raw, onChange);
              }
            }}
            onBlur={() => {
              const t = hexDraft.trim();
              if (!t) {
                setHexDraft("");
                patchHex("", onChange);
                return;
              }
              const n = normalizeHexColour(t)?.toLowerCase();
              if (isStrictHex(n)) {
                setHexDraft(n);
                patchHex(t, onChange);
              } else {
                setHexDraft(canonical ?? "");
              }
            }}
            style={{
              flex: "1",
              padding: "7px 9px",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
              fontSize: 13,
              border: "1px solid var(--card-border-color, rgba(0,0,0,0.08))",
              borderRadius: 4,
              boxSizing: "border-box",
            }}
          />
        </label>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 12px",
            alignItems: "center",
          }}
        >
          {(["R", "G", "B"] as const).map((label, idx) => {
            const num = idx === 0 ? r : idx === 1 ? g : b;
            return (
              <label
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <span style={{ opacity: 0.7 }}>{label}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  disabled={readOnly || !canonical}
                  value={canonical ? num : ""}
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    const vv = Number.isFinite(v) ? v : 0;
                    const rr = idx === 0 ? vv : r;
                    const gg = idx === 1 ? vv : g;
                    const bb = idx === 2 ? vv : b;
                    const next = rgbTupleToHex(rr, gg, bb);
                    setHexDraft(next);
                    patchHex(next, onChange);
                  }}
                  style={{
                    width: 58,
                    padding: "7px 6px",
                    fontSize: 13,
                    border:
                      "1px solid var(--card-border-color, rgba(0,0,0,0.08))",
                    borderRadius: 4,
                    boxSizing: "border-box",
                  }}
                />
              </label>
            );
          })}
        </div>
      </div>

      {hexHint ? (
        <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.8 }}>
          Enter hex as #rgb or #rrggbb (digits 0–9, a–f).
        </p>
      ) : null}
    </div>
  );
}
