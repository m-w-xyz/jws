"use client";

import { useTheme } from "next-themes";
import styles from "./Footer.module.css";

type FooterProps = {
  email: string;
  instagramHandle: string;
  phone: string;
  location: string;
  footerDarkLabel: string;
  footerLightLabel: string;
};

export default function Footer({
  email,
  instagramHandle,
  phone,
  location,
  footerDarkLabel,
  footerLightLabel,
}: FooterProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <footer className={styles.footer}>
      <button className={`${styles.themeToggle} ${styles.link}`} onClick={toggleTheme}>
        {theme === "dark" ? footerLightLabel : footerDarkLabel}
      </button>

      <a href={`mailto:${email}`} className={`${styles.email} ${styles.link}`}>
        {email}
      </a>

      <div className={styles.centerLinks}>
        <a
          href={`https://instagram.com/${instagramHandle.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.instagram} ${styles.link}`}
        >
          {instagramHandle}
        </a>

        <a href={`tel:${phone.replace(/\s/g, "")}`} className={`${styles.phone} ${styles.link}`}>
          {phone}
        </a>
      </div>

      <span className={`${styles.location} ${styles.locationDesktop} ${styles.link}`}>
        {location}
      </span>
      <a
        href={`https://instagram.com/${instagramHandle.replace("@", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.location} ${styles.instagramMobile} ${styles.link}`}
      >
        {instagramHandle}
      </a>
    </footer>
  );
}
