import { defineArrayMember, defineField, defineType } from "sanity";

const cvListItem = defineArrayMember({
  type: "object",
  name: "aboutCvItem",
  fields: [
    defineField({
      name: "year",
      type: "string",
      title: "Year",
      description:
        "One year per item. On the site, the year shows once per block of consecutive same-year rows. Lists sort newest first.",
    }),
    defineField({
      name: "name",
      type: "string",
      title: "Title",
      description: "Exhibition, competition, residency, or publication name (main line).",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "link",
      type: "url",
      title: "Link (optional)",
      description:
        "When set, the title becomes a link on the site and opens in a new browser tab.",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
          allowRelative: false,
        }),
    }),
  ],
  preview: {
    select: { title: "name", year: "year", link: "link" },
    prepare({ title, year, link }) {
      const subtitle = [year || "—", link ? "↗" : ""].filter(Boolean).join(" ");
      return { title: title || "Untitled", subtitle };
    },
  },
});

export const aboutPageType = defineType({
  name: "aboutPage",
  title: "Info page",
  type: "document",
  // Singleton — fixed preview title so Studio doesn't auto-generate a
  // giant header by dumping the entire bio.
  preview: {
    prepare() {
      return { title: "Info page" };
    },
  },
  fields: [
    defineField({
      name: "portrait",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "bio", type: "text", rows: 10 }),
    defineField({
      name: "exhibitions",
      title: "Exhibitions",
      type: "array",
      of: [cvListItem],
    }),
    defineField({
      name: "competitions",
      title: "Competitions",
      type: "array",
      of: [cvListItem],
    }),
    defineField({
      name: "residencies",
      title: "Residencies",
      type: "array",
      of: [cvListItem],
    }),
    defineField({
      name: "publications",
      title: "Publications",
      type: "array",
      of: [cvListItem],
    }),
  ],
});
