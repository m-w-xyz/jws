"use client";

import { useEffect } from "react";
import styles from "./InquiriesPanel.module.css";

type InquiriesPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  phone: string;
  instagramHandle: string;
  location: string;
};

export default function InquiriesPanel({
  isOpen,
  onClose,
  email,
  phone,
  instagramHandle,
  location,
}: InquiriesPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} type="button">
          Close
        </button>

        <div className={styles.contactInfo}>
          <a href={`mailto:${email}`} className={styles.contactLine}>
            {email}
          </a>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className={styles.contactLine}
          >
            {phone}
          </a>

          <a
            href={`https://instagram.com/${instagramHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.contactLine} ${styles.contactGap}`}
          >
            ig {instagramHandle}
          </a>

          <span className={`${styles.contactLine} ${styles.contactGap}`}>
            {location}
          </span>
        </div>
      </div>
    </div>
  );
}
