import React, { useState } from 'react';
import ListingsGrid from '../components/ListingsGrid';
import styles from './DiscoverPage.module.css';

export const TOP_CATS = [
  {
    id: 'events',
    label: 'Events',
    desc: 'Formals, raids, recruitment & more',
    bg: '#1d2545',
    subs: [
      { id: 'formal',      label: 'Formals'     },
      { id: 'recruitment', label: 'Recruitment' },
      { id: 'raids',       label: 'Raids'       },
      { id: 'festival',    label: 'Festival'    },
      { id: 'party',       label: 'Party'       },
      { id: 'holidays',    label: 'Holidays'    },
      { id: 'gamedays',    label: 'Gamedays'    },
    ],
  },
  {
    id: 'clothing',
    label: 'Clothing',
    desc: 'Dresses, tops, shoes & accessories',
    bg: '#1d2545',
    subs: [
      { id: 'dresses',     label: 'Dresses'         },
      { id: 'tops',        label: 'Tops'            },
      { id: 'bottoms',     label: 'Bottoms'         },
      { id: 'shoes',       label: 'Shoes'           },
      { id: 'accessories', label: 'Accessories'     },
      { id: 'sets',        label: 'Sets'            },
      { id: 'costumes',    label: 'Costumes'        },
    ],
  },
  {
    id: 'housing',
    label: 'Housing & More',
    desc: 'Furniture, subleases & tickets',
    bg: '#1d2545',
    subs: [
      { id: 'furniture',  label: 'Furniture'  },
      { id: 'subleasing', label: 'Subleasing' },
      { id: 'tickets',    label: 'Tickets'    },
      { id: 'other',      label: 'Other'      },
    ],
  },
  {
    id: 'free',
    label: 'Free',
    desc: 'Free items from sisters',
    bg: '#1d2545',
    subs: [],
  },
];

const EMPTY = { categories: [], sizes: [], colors: [], freeOnly: false };

export default function DiscoverPage({ searchQuery, onViewProfile }) {
  const [sideOpen, setSideOpen]       = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [selectedTop, setSelectedTop] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  function handleTopClick(top) {
    if (top.subs.length === 0) {
      setSelectedTop(top.id);
      setSelectedSub(null);
      setExpanded(top.id);
    } else {
      setExpanded(e => e === top.id ? null : top.id);
    }
  }

  function handleSubClick(topId, subId) {
    setSelectedTop(topId);
    setSelectedSub(subId);
  }

  const showListings = selectedSub !== null || selectedTop === 'free';
  const activeSub    = TOP_CATS.flatMap(t => t.subs).find(s => s.id === selectedSub);
  const activeTop    = TOP_CATS.find(t => t.id === selectedTop);

  const filters = {
    ...EMPTY,
    categories: selectedSub ? [selectedSub] : [],
    freeOnly:   selectedTop === 'free' && !selectedSub,
  };

  return (
    <div className={styles.page}>

      {/* ── Left sidebar ── */}
      <div className={`${styles.sidebar} ${sideOpen ? '' : styles.sidebarCollapsed}`}>
        <button className={styles.hamburger} onClick={() => setSideOpen(o => !o)}>
          <div className={styles.hamLines}>
            <span /><span /><span />
          </div>
          {sideOpen && <span className={styles.browseLabel}>Browse</span>}
        </button>

        {sideOpen && (
          <nav className={styles.nav}>
            {TOP_CATS.map(top => (
              <div key={top.id} className={styles.navGroup}>
                <button
                  className={`${styles.topItem} ${selectedTop === top.id ? styles.topItemOn : ''}`}
                  onClick={() => handleTopClick(top)}
                >
                  <span className={styles.topItemLabel}>{top.label}</span>
                  {top.subs.length > 0 && (
                    <span className={`${styles.chevron} ${expanded === top.id ? styles.chevronOpen : ''}`}>›</span>
                  )}
                </button>

                {expanded === top.id && top.subs.length > 0 && (
                  <div className={styles.subList}>
                    {top.subs.map(sub => (
                      <button
                        key={sub.id}
                        className={`${styles.subItem} ${selectedSub === sub.id ? styles.subItemOn : ''}`}
                        onClick={() => handleSubClick(top.id, sub.id)}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* ── Main content ── */}
      <div className={styles.main}>
        {showListings ? (
          <>
            <div className={styles.mainHead}>
              {activeTop && (
                <span className={styles.breadTop}
                  onClick={() => { setSelectedSub(null); if (activeTop.subs.length === 0) setSelectedTop(null); }}
                  style={{ cursor: activeSub ? 'pointer' : 'default' }}>
                  {activeTop.label}
                </span>
              )}
              {activeSub && (
                <><span className={styles.breadSep}>›</span>
                <span className={styles.breadSub}>{activeSub.label}</span></>
              )}
              {selectedTop === 'free' && !activeSub && (
                <><span className={styles.breadSep}>›</span>
                <span className={styles.breadSub}>Free Items</span></>
              )}
            </div>
            <ListingsGrid
              sort="newest"
              filters={filters}
              searchQuery={searchQuery}
              onViewProfile={onViewProfile}
            />
          </>
        ) : (
          <div className={styles.welcome}>
            <div className={styles.welcomeLines}>
              <span /><span /><span />
            </div>
            <p>Open the menu and select a category to browse</p>
          </div>
        )}
      </div>
    </div>
  );
}
