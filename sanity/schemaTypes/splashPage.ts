import { defineArrayMember, defineField, defineType } from "sanity";

export const splashPageType = defineType({
  name: "splashPage",
  title: "Splash screen",
  type: "document",
  preview: {
    prepare() {
      return { title: "Splash screen" };
    },
  },
  fields: [
    defineField({
      name: "backgroundColour",
      type: "string",
      title: "Background (hex)",
      initialValue: "#8f392b",
    }),
    defineField({
      name: "taglinePrefix",
      type: "string",
      title: "Tagline prefix",
      description: 'The static part shown before the cycling word (e.g. "Objects of")',
      initialValue: "Objects of",
    }),
    defineField({
      name: "cyclingWords",
      title: "Cycling words",
      description:
        "Words that cycle after the prefix. They play in order; the first word shows during the initial hold and returns as the last step before the fade.",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      initialValue: ["intrigue", "desire", "curiosity"],
    }),
  ],
});
