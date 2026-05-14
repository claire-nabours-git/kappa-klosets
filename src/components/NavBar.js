import React from 'react';
import styles from './NavBar.module.css';

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  );
}

function ClosetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

const TABS = [
  { id: 'home',     label: 'Home',      Icon: HomeIcon },
  { id: 'closet',   label: 'My Closet', Icon: ClosetIcon },
  { id: 'messages', label: 'Messages',  Icon: MessagesIcon },
];

export default function NavBar({ page, onPage, unreadCount = 0, closetActionCount = 0 }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map(({ id, label, Icon }) => {
          const count = id === 'messages' ? unreadCount : id === 'closet' ? closetActionCount : 0;
          return (
            <button
              key={id}
              className={`${styles.tab} ${page === id ? styles.on : ''}`}
              onClick={() => onPage(id)}
            >
              <div className={styles.iconWrap}>
                <Icon />
                {count > 0 && (
                  <span className={styles.badge}>{count > 9 ? '9+' : count}</span>
                )}
              </div>
              <span className={styles.label}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
