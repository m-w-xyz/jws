import type { SiteSettings } from "@/components/SiteShell";

export const fallbackSettings: SiteSettings = {
  siteTitle: "James Walsh Studio",
  email: "jameswalsh.id@gmail.com",
  phone: "+61 421 768 145",
  instagramHandle: "@jameswalshstudio",
  location: "Melbourne",
  navLinks: [
    { _key: "works", label: "Works", href: "/works" },
    { _key: "info", label: "Info", href: "/info" },
    { _key: "inquiries", label: "Inquiries", href: "#inquiries" },
  ],
  footerDarkLabel: "Dark",
  footerLightLabel: "Light",
};
