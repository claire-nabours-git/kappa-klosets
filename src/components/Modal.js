import React, { useEffect } from "react";
import styles from "./Modal.module.css";

export default function Modal({ open, onClose, title, sub, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.sub}>{sub}</p>
        {children}
      </div>
    </div>
  );
}
