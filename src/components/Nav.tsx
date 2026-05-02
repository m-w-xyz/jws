"use client";

import { TransitionLink } from "./PageTransitionProvider";
import styles from "./Nav.module.css";

type NavLink = {
  _key: string;
  label: string;
  href: string;
};

type NavProps = {
  siteTitle: string;
  navLinks: NavLink[];
  onSiteTitleClick: () => void;
  onInquiriesClick: () => void;
  mobileInfoOpen: boolean;
  onToggleMobileInfo: () => void;
};

export default function Nav({
  siteTitle,
  navLinks,
  onSiteTitleClick,
  onInquiriesClick,
  mobileInfoOpen,
  onToggleMobileInfo,
}: NavProps) {
  const pageLinks = navLinks.filter((l) => l.href !== "#inquiries");
  const inquiriesLink = navLinks.find((l) => l.href === "#inquiries");

  return (
    <>
      <nav
        className={styles.nav}
        aria-label="Site"
      >
        <button
          type="button"
          className={`${styles.siteTitle} ${styles.link}`}
          onClick={onSiteTitleClick}
        >
          {siteTitle}
        </button>

        <div className={styles.centerLinks}>
          {pageLinks.map((link) => (
            <TransitionLink key={link._key} href={link.href} className={styles.link}>
              {link.label}
            </TransitionLink>
          ))}
        </div>

        {inquiriesLink && (
          <button
            type="button"
            className={`${styles.inquiriesBtn} ${styles.link}`}
            onClick={onInquiriesClick}
          >
            {inquiriesLink.label}
          </button>
        )}
      </nav>

      <button
        type="button"
        className={`${styles.infoTap} ${mobileInfoOpen ? styles.infoTapOpen : ""}`}
        aria-expanded={mobileInfoOpen}
        aria-controls="mobile-info-panel"
        onClick={onToggleMobileInfo}
        aria-label={mobileInfoOpen ? "Close info" : "Open info"}
      >
        Info
      </button>
    </>
  );
}
