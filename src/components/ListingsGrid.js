import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingDetail from './ListingDetail';
import styles from './ListingsGrid.module.css';

const CATEGORY_BG = {
  formal: '#D6ECFF', formals: '#D6ECFF',
  recruitment: '#FFE8F0',
  raids: '#E0F2FF',
  festival: '#FFF0D6',
  party: '#F0E8FF', holidays: '#FFE8E8',
  dresses: '#F8E4FF',
  tops: '#E4F0FF',
  bottoms: '#E8F4E8',
  shoes: '#FFF4E0',
  accessories: '#E4F3FF',
  sets: '#F4E4FF', costumes: '#EDE4FF',
  furniture: '#D8EEF8',
  subleasing: '#EAF4FF', sublease: '#EAF4FF',
  tickets: '#E8FFE8',
  other: '#F0F0F0',
};


function applyFilters(listings, filters, sort, searchQuery) {
  let out = listings.filter(l => l.status !== 'sold');
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    out = out.filter(l => l.title?.toLowerCase().includes(q) || (l.sellerName || '').toLowerCase().includes(q));
  }
  if (filters.categories.length > 0) {
    out = out.filter(l => {
      const listingCats = Array.isArray(l.categories) && l.categories.length > 0
        ? l.categories
        : [l.category || ''];
      return filters.categories.some(fc =>
        listingCats.some(lc => {
          const a = lc.toLowerCase(), b = fc.toLowerCase();
          return a === b || a.startsWith(b) || b.startsWith(a);
        })
      );
    });
  }
  if (filters.sizes.length > 0) {
    out = out.filter(l => filters.sizes.some(s => (l.size || '').toLowerCase().includes(s.toLowerCase())));
  }
  if (filters.colors.length > 0) {
    out = out.filter(l => filters.colors.some(c => c.toLowerCase() === (l.color || '').toLowerCase()));
  }
  if (filters.freeOnly) out = out.filter(l => Number(l.price) === 0);
  if (sort === 'price_asc')  out.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sort === 'price_desc') out.sort((a, b) => (b.price || 0) - (a.price || 0));
  return out;
}

export default function ListingsGrid({ sort, filters, searchQuery, onViewProfile, isGuest, requireAuth }) {
  const [live, setLive]         = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setLive(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const filtered = applyFilters(live, filters, sort, searchQuery);

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.head}>
          <span className={styles.count}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIco}>◌</div>
            <h3>Nothing matches</h3>
            <p>Try different filters or clear them all</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((l, i) => (
              <ListingCard key={l.id} listing={l} delay={i * 0.03} onOpen={setSelected} onViewProfile={onViewProfile} isGuest={isGuest} requireAuth={requireAuth} />
            ))}
          </div>
        )}
      </div>

      {selected && <ListingDetail listing={selected} onClose={() => setSelected(null)} onViewProfile={onViewProfile} isGuest={isGuest} requireAuth={requireAuth} />}
    </>
  );
}

function ListingCard({ listing: l, delay, onOpen, onViewProfile, isGuest, requireAuth }) {
  const { userProfile, toggleLike } = useAuth();
  const hearted = (userProfile?.likedListings || []).includes(l.id);
  const cat     = (l.category || 'other').toLowerCase();
  const bg      = CATEGORY_BG[cat] || '#E8EFF4';
  const allCats = Array.isArray(l.categories) && l.categories.length > 0 ? l.categories : [l.category];
  const label   = allCats.filter(Boolean).map(c =>
    c.charAt(0).toUpperCase() + c.slice(1)
  ).join(', ');
  const thumb   = l.photos?.[0] || l.imageUrl;
  const price   = typeof l.price === 'number'
    ? (['sublease','subleasing'].includes(cat) ? `$${l.price}/mo` : l.price === 0 ? 'Free' : `$${l.price}`)
    : (l.price || '');

  return (
    <div className={styles.card} style={{ animationDelay: `${delay}s` }} onClick={() => onOpen(l)}>
      <div className={styles.img} style={{ background: thumb ? '#f0f4f8' : bg }}>
        {thumb && <img src={thumb} alt={l.title} className={styles.photo} />}
        {l.status === 'sold' && <div className={styles.soldBadge}>SOLD</div>}
        <button
          className={`${styles.heart} ${hearted ? styles.heartOn : ''}`}
          onClick={e => { e.stopPropagation(); isGuest ? requireAuth('like listings') : toggleLike(l.id); }}
        >
          {hearted ? '♥ Liked' : '♡ Like'}
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.cardTitle}>{l.title}</div>
        <div className={styles.meta}>
          {[l.size && l.size !== '—' ? l.size : null, l.color && l.color !== '—' ? l.color : null, l.condition].filter(Boolean).join(' · ')}
        </div>
        <div className={styles.foot}>
          <div className={styles.price}>{price}</div>
          <div
            className={styles.seller}
            onClick={e => { e.stopPropagation(); onViewProfile?.(l.sellerUid); }}
            style={{ cursor: l.sellerUid ? 'pointer' : 'default' }}
          >
            <div className={styles.sellerDot}>{l.sellerInitials || '?'}</div>
            {l.sellerName || l.seller}
          </div>
        </div>
      </div>
    </div>
  );
}
