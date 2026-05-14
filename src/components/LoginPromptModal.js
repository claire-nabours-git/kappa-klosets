import React from 'react';
import styles from './LoginPromptModal.module.css';

export default function LoginPromptModal({ action = 'do that', onAuth, onClose }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.x} onClick={onClose}>✕</button>
        <div className={styles.heart}>
          <svg viewBox="0 0 24 24" fill="#fff" width="28" height="28">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div className={styles.title}>Join to continue</div>
        <div className={styles.sub}>You need an account to {action}.</div>
        <button className={styles.primary} onClick={onAuth}>Sign In</button>
        <button className={styles.secondary} onClick={onAuth}>Create Account</button>
        <button className={styles.cancel} onClick={onClose}>Keep browsing</button>
      </div>
    </div>
  );
}
