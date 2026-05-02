import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { specialGothic } from "@/lib/fonts";
import { getSiteSettings } from "@/lib/get-site-settings";
import { getTransitionColours } from "@/lib/get-transition-colours";
import { getSplashData } from "@/lib/get-splash-data";
import { getAboutPagePayload } from "@/lib/get-about-payload";
import SiteShell from "@/components/SiteShell";
import { NotFoundChromeProvider } from "@/contexts/NotFoundChromeContext";
import ConsoleErrorFilter from "@/components/ConsoleErrorFilter";
import ImageContextMenuBlock from "@/components/ImageContextMenuBlock";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "James Walsh Studio",
  description: "Objects of curiousity",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, transitionColours, splashData, aboutPayload] =
    await Promise.all([
      getSiteSettings(),
      getTransitionColours(),
      getSplashData(),
      getAboutPagePayload(),
    ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={specialGothic.variable}>
        <ConsoleErrorFilter />
        <Suspense fallback={null}>
          <ImageContextMenuBlock />
        </Suspense>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          disableTransitionOnChange={false}
        >
          <NotFoundChromeProvider>
            <SiteShell
              settings={settings}
              transitionColours={transitionColours}
              splashData={splashData}
              aboutPayload={aboutPayload}
            >
              {children}
            </SiteShell>
          </NotFoundChromeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
