import React, { useState, useRef, useEffect } from 'react';
import { TOP_CATS } from '../pages/DiscoverPage';
import styles from './TabBar.module.css';

const SORTS  = [
  { id: 'newest',     label: 'Newest'  },
  { id: 'price_asc',  label: 'Price ↑' },
  { id: 'price_desc', label: 'Price ↓' },
];
const SIZES  = ['XS', 'S', 'M', 'L', 'XL', '0–2', '4–6', '8–10', '12+', 'One Size'];
const COLORS = ['Black', 'White', 'Blue', 'Pink', 'Red', 'Green', 'Yellow', 'Purple', 'Gold', 'Silver', 'Multi'];

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  return { open, setOpen, ref };
}

export default function SortBar({ sort, onSort, filters, onFilters, selectedCat, onCatSelect }) {
  const cat    = useDropdown();
  const filter = useDropdown();
  const [expandedCat, setExpandedCat] = useState(null);

  function handleTopClick(top) {
    if (top.subs.length === 0) {
      onCatSelect(top.id, null, top.id === 'free');
      cat.setOpen(false);
    } else {
      setExpandedCat(e => e === top.id ? null : top.id);
    }
  }

  function handleSubClick(topId, subId) {
    onCatSelect(topId, subId, false);
    cat.setOpen(false);
  }

  function toggleFilter(key, val) {
    const cur  = filters[key] || [];
    const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
    onFilters({ ...filters, [key]: next });
  }

  function clearFilters() {
    onFilters({ ...filters, sizes: [], colors: [] });
  }

  const activeSub = selectedCat?.subId
    ? TOP_CATS.flatMap(t => t.subs).find(s => s.id === selectedCat.subId)?.label
    : selectedCat?.topId === 'free' ? 'Free' : null;

  const catActive   = !!activeSub;
  const filterCount = (filters.sizes?.length || 0) + (filters.colors?.length || 0);
  const filterActive = filterCount > 0;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>

        {/* Left — sort buttons */}
        <div className={styles.sorts}>
          {SORTS.map(s => (
            <button
              key={s.id}
              className={`${styles.sortBtn} ${sort === s.id ? styles.on : ''}`}
              onClick={() => onSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Right — Category + Filter */}
        <div className={styles.rightBtns}>

          {/* Category */}
          <div className={styles.ddWrap} ref={cat.ref}>
            <button
              className={`${styles.sortBtn} ${catActive ? styles.on : ''}`}
              onClick={() => cat.setOpen(o => !o)}
            >
              {activeSub || 'Category'}
              {catActive
                ? <span className={styles.xBtn} onClick={e => { e.stopPropagation(); onCatSelect(null, null, false); setExpandedCat(null); }}>✕</span>
                : <span className={styles.chevronBtn}>{cat.open ? '▲' : '▼'}</span>
              }
            </button>

            {cat.open && (
              <div className={styles.dropdown} style={{ right: 0, left: 'auto' }}>
                {TOP_CATS.map(top => (
                  <div key={top.id}>
                    <button
                      className={`${styles.ddTopItem} ${selectedCat?.topId === top.id ? styles.ddTopOn : ''}`}
                      onClick={() => handleTopClick(top)}
                    >
                      <span>{top.label}</span>
                      {top.subs.length > 0 && (
                        <span className={`${styles.ddChevron} ${expandedCat === top.id ? styles.ddChevronOpen : ''}`}>›</span>
                      )}
                    </button>
                    {expandedCat === top.id && top.subs.map(sub => (
                      <button
                        key={sub.id}
                        className={`${styles.ddSubItem} ${selectedCat?.subId === sub.id ? styles.ddSubOn : ''}`}
                        onClick={() => handleSubClick(top.id, sub.id)}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter */}
          <div className={styles.ddWrap} ref={filter.ref}>
            <button
              className={`${styles.sortBtn} ${filterActive ? styles.on : ''}`}
              onClick={() => filter.setOpen(o => !o)}
            >
              Filter {filterActive && <span className={styles.badge}>{filterCount}</span>}
              {!filterActive && <span className={styles.chevronBtn}>{filter.open ? '▲' : '▼'}</span>}
              {filterActive && <span className={styles.xBtn} onClick={e => { e.stopPropagation(); clearFilters(); }}>✕</span>}
            </button>

            {filter.open && (
              <div className={styles.dropdown} style={{ minWidth: 240, right: 0, left: 'auto' }}>
                <div className={styles.filterSection}>
                  <div className={styles.filterSectionLabel}>Size</div>
                  <div className={styles.filterChips}>
                    {SIZES.map(s => (
                      <button key={s}
                        className={`${styles.chip} ${(filters.sizes || []).includes(s) ? styles.chipOn : ''}`}
                        onClick={() => toggleFilter('sizes', s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.filterSection}>
                  <div className={styles.filterSectionLabel}>Color</div>
                  <div className={styles.filterChips}>
                    {COLORS.map(c => (
                      <button key={c}
                        className={`${styles.chip} ${(filters.colors || []).includes(c) ? styles.chipOn : ''}`}
                        onClick={() => toggleFilter('colors', c)}>{c}</button>
                    ))}
                  </div>
                </div>
                {filterActive && (
                  <button className={styles.clearAll} onClick={clearFilters}>Clear all</button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
