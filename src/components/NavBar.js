import React from 'react';
import styles from './NavBar.module.css';

const TABS = [
  { id: 'home',     label: 'Home',      icon: '⌂' },
  { id: 'closet',   label: 'My Closet', icon: '♡' },
  { id: 'messages', label: 'Messages',  icon: '✉' },
];

export default function NavBar({ page, onPage }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${page === t.id ? styles.on : ''}`}
            onClick={() => onPage(t.id)}
          >
            <span className={styles.icon}>{t.icon}</span>
            <span className={styles.label}>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
