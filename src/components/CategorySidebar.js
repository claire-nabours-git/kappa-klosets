import React from 'react';
import { TOP_CATS } from '../pages/DiscoverPage';
import styles from './CategorySidebar.module.css';

export default function CategorySidebar({ open, onToggle, expanded, onExpand, selected, onSelect }) {
  function handleTopClick(top) {
    if (top.subs.length === 0) {
      onSelect(top.id, null, top.id === 'free');
      onExpand(top.id);
    } else {
      onExpand(expanded === top.id ? null : top.id);
    }
  }

  return (
    <aside className={`${styles.sidebar} ${open ? '' : styles.collapsed}`}>
      <button className={styles.toggle} onClick={onToggle} title={open ? 'Collapse' : 'Expand'}>
        <span className={styles.line} />
        <span className={styles.line} />
        <span className={styles.line} />
      </button>

      {open && (
        <nav className={styles.nav}>
          {TOP_CATS.map(top => (
            <div key={top.id} className={styles.group}>
              <button
                className={`${styles.topBtn} ${selected.topId === top.id ? styles.topBtnOn : ''}`}
                onClick={() => handleTopClick(top)}
              >
                <span className={styles.topLabel}>{top.label}</span>
                {top.subs.length > 0 && (
                  <span className={`${styles.chevron} ${expanded === top.id ? styles.chevronOpen : ''}`}>›</span>
                )}
              </button>

              {expanded === top.id && top.subs.length > 0 && (
                <div className={styles.subList}>
                  {top.subs.map(sub => (
                    <button
                      key={sub.id}
                      className={`${styles.subBtn} ${selected.subId === sub.id ? styles.subBtnOn : ''}`}
                      onClick={() => onSelect(top.id, sub.id, false)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {selected.topId && (
            <button
              className={styles.clearBtn}
              onClick={() => { onSelect(null, null, false); onExpand(null); }}
            >
              Clear category
            </button>
          )}
        </nav>
      )}
    </aside>
  );
}
