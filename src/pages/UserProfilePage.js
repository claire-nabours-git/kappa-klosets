import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListingDetail from '../components/ListingDetail';
import styles from './UserProfilePage.module.css';

const CATEGORY_EMOJI = { formal: '👗', formals: '👗', raids: '⚡', furniture: '🛋️', subleasing: '🏠', sublease: '🏠', accessories: '💎', recruitment: '🌸', festival: '🎪', party: '🎉', tickets: '🎟️', other: '✨' };
const CATEGORY_BG    = { formal: '#D6ECFF', formals: '#D6ECFF', raids: '#E0F2FF', furniture: '#D8EEF8', subleasing: '#EAF4FF', sublease: '#EAF4FF', accessories: '#E4F3FF', recruitment: '#FFE8F0', festival: '#FFF0D6', party: '#F0E8FF', tickets: '#E8FFE8', other: '#DDF0FF' };

export default function UserProfilePage({ uid, onBack, onDm }) {
  const { currentUser } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [listings, setListings]   = useState([]);
  const [tab, setTab]             = useState('active');
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDocs(query(collection(db, 'listings'), where('sellerUid', '==', uid))),
    ]).then(([userSnap, listSnap]) => {
      if (userSnap.exists()) setProfile({ uid, ...userSnap.data() });
      const items = listSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setListings(items);
      setLoading(false);
    });
  }, [uid]);

  const isOwn    = currentUser?.uid === uid;
  const name     = profile ? `${profile.first || ''} ${profile.last || ''}`.trim() : '';
  const initials = (profile?.first?.[0] || '') + (profile?.last?.[0] || '');
  const active   = listings.filter(l => l.status !== 'sold');
  const sold     = listings.filter(l => l.status === 'sold');
  const shown    = tab === 'active' ? active : sold;

  function handleDm() {
    onDm(uid, { name, initials });
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={onBack}>← Back</button>
      </div>

      {loading ? (
        <div className={styles.skeleton}>
          <div className={styles.skelHeader}>
            <div className={`${styles.skelCircle} ${styles.shimmer}`} />
            <div className={styles.skelLines}>
              <div className={`${styles.skelLine} ${styles.skelLineLg} ${styles.shimmer}`} />
              <div className={`${styles.skelLine} ${styles.skelLineSm} ${styles.shimmer}`} />
              <div className={`${styles.skelLine} ${styles.skelLineMd} ${styles.shimmer}`} />
            </div>
          </div>
          <div className={styles.skelGrid}>
            {[1,2,3,4].map(i => <div key={i} className={`${styles.skelCard} ${styles.shimmer}`} />)}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.avatar}>
              {profile?.photoUrl
                ? <img src={profile.photoUrl} alt={name} className={styles.avatarPhoto} />
                : <span>{initials || '?'}</span>
              }
            </div>
            <div className={styles.info}>
              <h2 className={styles.name}>{name || 'Kappa Sister'}</h2>
              <div className={styles.meta}>
                {[profile?.grade, profile?.pc && profile.pc !== '—' ? profile.pc : null].filter(Boolean).join(' · ')}
              </div>
              <div className={styles.stats}>
                <span><strong>{active.length}</strong> active</span>
                <span><strong>{sold.length}</strong> sold</span>
              </div>
              {profile?.venmo && (
                <div className={styles.venmo}>Venmo: @{profile.venmo}</div>
              )}
            </div>
            {!isOwn && (
              <button className={styles.dmBtn} onClick={handleDm}>Message</button>
            )}
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'active' ? styles.tabOn : ''}`} onClick={() => setTab('active')}>
              Listings ({active.length})
            </button>
            <button className={`${styles.tab} ${tab === 'sold' ? styles.tabOn : ''}`} onClick={() => setTab('sold')}>
              Sold ({sold.length})
            </button>
          </div>

          {shown.length === 0 ? (
            <p className={styles.empty}>{tab === 'active' ? 'No active listings.' : 'No sold items yet.'}</p>
          ) : (
            <div className={styles.grid}>
              {shown.map(l => (
                <ProfileCard key={l.id} listing={l} onClick={() => setSelected(l)} />
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <ListingDetail listing={selected} onClose={() => setSelected(null)} onViewProfile={() => {}} />
      )}
    </div>
  );
}

function ProfileCard({ listing: l, onClick }) {
  const cat   = (l.category || 'other').toLowerCase();
  const emoji = CATEGORY_EMOJI[cat] || '✨';
  const bg    = CATEGORY_BG[cat]    || '#DDF0FF';
  const thumb = l.photos?.[0] || l.imageUrl;
  const price = typeof l.price === 'number'
    ? (['sublease','subleasing'].includes(cat) ? `$${l.price}/mo` : `$${l.price}`)
    : (l.price || '');

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardImg} style={{ background: thumb ? '#f0f4f8' : bg }}>
        {thumb
          ? <img src={thumb} alt={l.title} className={styles.cardPhoto} />
          : <span className={styles.cardEmoji}>{emoji}</span>
        }
        {l.status === 'sold' && <div className={styles.soldBadge}>SOLD</div>}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{l.title}</div>
        <div className={styles.cardPrice}>{price}</div>
      </div>
    </div>
  );
}
