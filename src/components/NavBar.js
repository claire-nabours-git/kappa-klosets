import React from 'react';
import styles from './NavBar.module.css';

const TABS = [
  { id: 'home',     label: 'Home',      icon: '⌂' },
  { id: 'closet',   label: 'My Closet', icon: '♡' },
  { id: 'messages', label: 'Messages',  icon: '✉' },
];

export default function NavBar({ page, onPage, unreadCount = 0, closetActionCount = 0 }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map(t => {
          const count = t.id === 'messages' ? unreadCount : t.id === 'closet' ? closetActionCount : 0;
          return (
            <button
              key={t.id}
              className={`${styles.tab} ${page === t.id ? styles.on : ''}`}
              onClick={() => onPage(t.id)}
            >
              <div className={styles.iconWrap}>
                <span className={styles.icon}>{t.icon}</span>
                {count > 0 && (
                  <span className={styles.badge}>{count > 9 ? '9+' : count}</span>
                )}
              </div>
              <span className={styles.label}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
