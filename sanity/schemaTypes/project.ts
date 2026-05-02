import { defineArrayMember, defineField, defineType } from "sanity";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { ProjectSlugInput } from "../components/ProjectSlugInput";
import { ProjectColourInput } from "../components/ProjectColourInput";
import { normalizeHexColour } from "../../src/lib/get-transition-colours";
import { SPECS_CONTACT_EMAIL } from "../../src/lib/specs-contact-email";

export const projectType = defineType({
  name: "project",
  title: "Project",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "project" }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      components: {
        input: ProjectSlugInput,
      },
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "images",
      title: "Gallery",
      type: "array",
      of: [
        defineArrayMember({ type: "image", options: { hotspot: true } }),
        defineArrayMember({
          type: "object",
          name: "galleryVideo",
          title: "Video",
          fields: [
            defineField({
              name: "url",
              title: "Video URL",
              type: "url",
              validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }),
              description:
                "YouTube, Vimeo, or direct .mp4 / .webm link. Embed plays muted with no controls overlay.",
            }),
            defineField({
              name: "thumbnail",
              title: "Thumbnail",
              type: "image",
              options: { hotspot: true },
              description:
                "Optional. Recommended if this slide is first—used as the Works/Home card image and page transition cue.",
            }),
          ],
          preview: {
            select: { url: "url", media: "thumbnail" },
            prepare({ url, media }) {
              return {
                title: "Video",
                subtitle: url || "",
                media,
              };
            },
          },
        }),
      ],
      description:
        "Mixed gallery: images plus optional videos (YouTube, Vimeo, or hosted file URLs). First image = homepage card; second image = Works hover thumbnail. Order matches the carousel.",
    }),
    defineField({
      name: "projectColour",
      title: "Project colour",
      type: "string",
      components: {
        input: ProjectColourInput,
      },
      validation: (Rule) =>
        Rule.custom((val) => {
          const s = typeof val === "string" ? val.trim() : "";
          if (!s) return true;
          const n = normalizeHexColour(s)?.toLowerCase();
          if (
            !n ||
            (!/^#[0-9a-f]{3}$/.test(n) && !/^#[0-9a-f]{6}$/.test(n))
          ) {
            return "Use #rgb or #rrggbb (e.g. #c45a3c)";
          }
          return true;
        }),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 8,
    }),
    defineField({
      name: "specs",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Heading",
              type: "string",
              description:
                "Shown in the left column on the project page. Suggestions (not enforced): Dimensions, Materials, Colours, Photography, Order — or enter any wording you like.",
            }),
            defineField({
              name: "value",
              title: "Description",
              type: "string",
              description: "Shown in the right column on the project page.",
            }),
            defineField({
              name: "useSpecsContactEmail",
              title: "Link to specs contact email",
              type: "boolean",
              initialValue: false,
              description: `When on, the description links to mailto:${SPECS_CONTACT_EMAIL}. Turn off to use Link instead.`,
              validation: (Rule) =>
                Rule.custom((val, ctx) => {
                  const parent = ctx.parent as { url?: string | null };
                  if (
                    val &&
                    typeof parent.url === "string" &&
                    parent.url.trim() !== ""
                  ) {
                    return "Clear Link to use this option.";
                  }
                  return true;
                }),
            }),
            defineField({
              name: "url",
              title: "Link",
              type: "url",
              description:
                "Optional. Opens the description as a web link—http(s) in a new tab; paths like /contact in this tab. For the specs inbox, use Link to specs contact email.",
              validation: (Rule) =>
                Rule.custom((urlVal, ctx) => {
                  const url =
                    typeof urlVal === "string" ? urlVal.trim() : "";
                  if (!url) return true;
                  if (ctx.parent && (ctx.parent as { useSpecsContactEmail?: boolean }).useSpecsContactEmail) {
                    return "Turn off Link to specs contact email to use a custom link.";
                  }
                  if (url.toLowerCase().startsWith("mailto:")) {
                    return "Use Link to specs contact email for a mail link.";
                  }
                  return true;
                }),
            }),
          ],
          preview: {
            select: {
              label: "label",
              value: "value",
              url: "url",
              useSpecsContactEmail: "useSpecsContactEmail",
            },
            prepare({ label, value, url, useSpecsContactEmail }) {
              const parts: string[] = [];
              if (useSpecsContactEmail) {
                parts.push(`mailto:${SPECS_CONTACT_EMAIL}`);
              }
              if (typeof url === "string" && url.trim()) {
                parts.push(url.trim());
              }
              if (typeof value === "string" && value.trim()) {
                parts.push(value.trim());
              }
              return {
                title: label || "Untitled spec",
                subtitle: parts.join(" · ") || "Empty",
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "images.0",
    },
    prepare({ title, media }) {
      return {
        title: title || "Untitled",
        media,
      };
    },
  },
});
