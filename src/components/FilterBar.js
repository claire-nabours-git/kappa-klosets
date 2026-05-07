import React from 'react';
import styles from './FilterBar.module.css';

const SIZES  = ['XS', 'S', 'M', 'L', 'XL', '0–2', '4–6', '8–10', '12+', 'One Size'];
const COLORS = ['Black', 'White', 'Blue', 'Pink', 'Red', 'Green', 'Yellow', 'Purple', 'Gold', 'Silver', 'Multi'];

export default function FilterPanel({ open, filters, onChange }) {
  function toggle(key, val) {
    const cur = filters[key];
    const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
    onChange({ ...filters, [key]: next });
  }

  const hasAny = filters.sizes.length + filters.colors.length > 0;

  if (!open) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.inner}>
        <Section label="Size"  items={SIZES}  active={filters.sizes}  onToggle={v => toggle('sizes', v)} />
        <Section label="Color" items={COLORS} active={filters.colors} onToggle={v => toggle('colors', v)} />
        {hasAny && (
          <div className={styles.footer}>
            <button className={styles.clear} onClick={() => onChange({ ...filters, sizes: [], colors: [] })}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ label, items, active, onToggle }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>{label}</div>
      <div className={styles.chips}>
        {items.map(item => (
          <button
            key={item}
            className={`${styles.chip} ${active.includes(item) ? styles.chipOn : ''}`}
            onClick={() => onToggle(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
