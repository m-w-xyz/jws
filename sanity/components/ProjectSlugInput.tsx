import { SlugInput, type SlugInputProps } from "sanity";

/**
 * Shows the `/works/[slug]` path next to (or stacked with) the default slug editor.
 */
export function ProjectSlugInput(props: SlugInputProps) {
  const slug = props.value?.current?.trim();
  const pathPreview = slug ? `/works/${slug}` : `/works/(slug)`;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px 20px",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div style={{ flex: "2 1 220px", minWidth: 0 }}>
        <SlugInput {...props} />
      </div>
      <div
        style={{
          flex: "1 1 200px",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          fontSize: "12px",
          lineHeight: 1.4,
          opacity: slug ? 0.85 : 0.55,
          wordBreak: "break-word",
        }}
      >
        <span style={{ opacity: 0.65 }}>Live URL:&nbsp;</span>
        <span>{pathPreview}</span>
      </div>
    </div>
  );
}
