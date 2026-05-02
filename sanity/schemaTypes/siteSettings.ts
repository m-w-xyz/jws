import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  preview: {
    prepare() {
      return { title: "Site settings" };
    },
  },
  fields: [
    defineField({ name: "siteTitle", type: "string", validation: (r) => r.required() }),
    defineField({ name: "email", type: "string", validation: (r) => r.required() }),
    defineField({ name: "phone", type: "string" }),
    defineField({
      name: "instagramHandle",
      type: "string",
      description: "Instagram handle for display (e.g. @jameswalshstudio). Used for links too; @ is stripped in URLs.",
    }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "footerDarkLabel", type: "string", initialValue: "Dark" }),
    defineField({ name: "footerLightLabel", type: "string", initialValue: "Light" }),
  ],
});
