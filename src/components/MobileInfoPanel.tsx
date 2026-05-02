"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import BioParagraphs from "@/components/BioWithLinks";
import { CvSectionBlock, type AboutCvClassNames } from "@/components/AboutCvBlocks";
import type { AboutPagePayload } from "@/lib/get-about-payload";
import styles from "./MobileInfoPanel.module.css";

const cvCls: AboutCvClassNames = {
  cvSection: styles.cvSection,
  cvSectionTitle: styles.cvSectionTitle,
  cvEntry: styles.cvEntry,
  cvYear: styles.cvYear,
  cvMain: styles.cvMain,
  cvName: styles.cvName,
  cvNameLink: styles.cvNameLink,
};

type MobileInfoSettingsPick = {
  email: string;
  phone: string;
  instagramHandle: string;
  location: string;
};

type MobileInfoPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  footerDarkLabel: string;
  footerLightLabel: string;
  settings: MobileInfoSettingsPick;
  about: AboutPagePayload | null;
};

export default function MobileInfoPanel({
  isOpen,
  onClose,
  footerDarkLabel,
  footerLightLabel,
  settings,
  about,
}: MobileInfoPanelProps) {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const viewportNoLongerMobile = () => {
      if (!mq.matches && isOpen) onClose();
    };
    viewportNoLongerMobile();
    mq.addEventListener("change", viewportNoLongerMobile);
    return () => mq.removeEventListener("change", viewportNoLongerMobile);
  }, [isOpen, onClose]);

  const bioParagraphs = about?.bio?.split("\n").filter(Boolean) ?? [];
  const instagramUsername = settings.instagramHandle.replace("@", "");
  const instagramUrl = `https://instagram.com/${instagramUsername}`;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <div
        id="mobile-info-panel"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        {...(!isOpen ? { inert: true as const } : {})}
      >
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Close
        </button>

        <div className={styles.scroll}>
          <div className={styles.grid}>
            {bioParagraphs.length > 0 && (
              <section className={`${styles.section} ${styles.intro}`}>
                <BioParagraphs
                  paragraphs={bioParagraphs}
                  email={settings.email}
                  instagramUsername={instagramUsername}
                />
              </section>
            )}

            <section className={`${styles.section} ${styles.contactBlock}`}>
              <a href={`mailto:${settings.email}`} className={styles.contactLine}>
                {settings.email}
              </a>
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className={styles.contactLine}
              >
                {settings.phone}
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.contactLine} ${styles.contactGap}`}
              >
                ig {settings.instagramHandle}
              </a>
              <span className={`${styles.contactLine} ${styles.contactGap}`}>
                {settings.location}
              </span>
            </section>

            {about?.portraitSrc ? (
              <section className={styles.section}>
                <div className={styles.portrait}>
                  <Image
                    src={about.portraitSrc}
                    alt="James Walsh"
                    fill
                    sizes="100vw"
                    placeholder={about.portraitBlur ? "blur" : "empty"}
                    blurDataURL={about.portraitBlur ?? undefined}
                  />
                </div>
              </section>
            ) : null}

            <CvSectionBlock
              title="Exhibitions"
              items={about?.exhibitions ?? []}
              cls={cvCls}
            />
            <CvSectionBlock
              title="Competitions"
              items={about?.competitions ?? []}
              cls={cvCls}
            />
            <CvSectionBlock
              title="Residencies"
              items={about?.residencies ?? []}
              cls={cvCls}
            />
            <CvSectionBlock
              title="Publications"
              items={about?.publications ?? []}
              cls={cvCls}
            />
          </div>

          <div className={styles.themeBar}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? `Switch to ${footerLightLabel}`
                  : `Switch to ${footerDarkLabel}`
              }
            >
              {theme === "dark" ? footerLightLabel : footerDarkLabel}
            </button>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.themeBarInstagram}
            >
              {settings.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
