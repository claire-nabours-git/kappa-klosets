import React from "react";
import styles from "./Tabs.module.css";

export default function Tabs({ tabs, active, counts, onSwitch }) {
  return (
    <div className={styles.bar}>
      <div className={styles.scroll}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${active === t.key ? styles.on : ""}`}
            onClick={() => onSwitch(t.key)}
          >
            {t.label}
            <span className={styles.badge}>{counts[t.key] || 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
