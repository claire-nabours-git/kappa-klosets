import React, { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, doc,
  updateDoc, deleteDoc, writeBatch, documentId, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import styles from './MyClosetPage.module.css';

const SUBTABS = [
  { id: 'listings',  label: 'My Listings' },
  { id: 'liked',     label: 'Liked' },
  { id: 'offers',    label: 'Offers' },
  { id: 'sold',      label: 'Sold' },
  { id: 'purchased', label: 'Purchased' },
];

const CATEGORY_EMOJI = { formal: '👗', formals: '👗', raids: '⚡', furniture: '🛋️', subleasing: '🏠', sublease: '🏠', accessories: '💎', recruitment: '🌸', festival: '🎪', party: '🎉', tickets: '🎟️', other: '✨' };
const CATEGORY_BG    = { formal: '#D6ECFF', formals: '#D6ECFF', raids: '#E0F2FF', furniture: '#D8EEF8', subleasing: '#EAF4FF', sublease: '#EAF4FF', accessories: '#E4F3FF', recruitment: '#FFE8F0', festival: '#FFF0D6', party: '#F0E8FF', tickets: '#E8FFE8', other: '#DDF0FF' };

export default function MyClosetPage({ onViewProfile, onDm }) {
  const { currentUser, userProfile, toggleLike } = useAuth();
  const [tab, setTab]               = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [likedItems, setLikedItems] = useState([]);
  const [offersIn, setOffersIn]     = useState([]);
  const [offersOut, setOffersOut]   = useState([]);
  const [paymentOffer, setPaymentOffer] = useState(null);

  const uid = currentUser?.uid;

  // My listings (real-time)
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'listings'), where('sellerUid', '==', uid));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyListings(items);
    });
  }, [uid]);

  // Liked listings — stable string key avoids stale array reference comparisons
  const likedIds    = userProfile?.likedListings || [];
  const likedIdsKey = likedIds.join(',');

  useEffect(() => {
    if (!uid) return;
    const ids = likedIds;
    if (ids.length === 0) { setLikedItems([]); return; }

    // IDs starting with 's' are sample data — resolve them locally
    const SAMPLE_MAP = {
      s1: { id: 's1', category: 'formal',      title: 'Dusty Blue Satin Gown',   size: '4',  condition: 'Like New', price: 45,  sellerName: 'Ava K.',    sellerInitials: 'AK' },
      s2: { id: 's2', category: 'formal',      title: 'Ice Blue Sequin Mini',     size: 'S',  condition: 'Like New', price: 55,  sellerName: 'Mia R.',    sellerInitials: 'MR' },
      s3: { id: 's3', category: 'raids',       title: 'Electric Blue Bodysuit',   size: 'M',  condition: 'Good',     price: 18,  sellerName: 'Sophia L.', sellerInitials: 'SL' },
      s4: { id: 's4', category: 'furniture',   title: 'Powder Blue Desk Chair',   size: '—',  condition: 'Like New', price: 65,  sellerName: 'Chloe T.',  sellerInitials: 'CT' },
      s5: { id: 's5', category: 'sublease',    title: '1BR Near Campus — Summer', size: '—',  condition: '—',        price: 750, sellerName: 'Lily P.',   sellerInitials: 'LP' },
      s6: { id: 's6', category: 'formal',      title: 'Silver Strappy Heels',     size: '7',  condition: 'Like New', price: 28,  sellerName: 'Emma W.',   sellerInitials: 'EW' },
      s7: { id: 's7', category: 'accessories', title: 'Sapphire Drop Earrings',   size: '—',  condition: 'Like New', price: 14,  sellerName: 'Nora B.',   sellerInitials: 'NB' },
      s8: { id: 's8', category: 'raids',       title: 'Cowboys & Aliens Set',     size: 'XS', condition: 'Good',     price: 22,  sellerName: 'Grace H.',  sellerInitials: 'GH' },
    };
    const sampleItems  = ids.filter(id => SAMPLE_MAP[id]).map(id => SAMPLE_MAP[id]);
    const firestoreIds = ids.filter(id => !SAMPLE_MAP[id]).slice(0, 30);

    if (firestoreIds.length === 0) {
      setLikedItems(sampleItems);
      return;
    }
    getDocs(query(collection(db, 'listings'), where(documentId(), 'in', firestoreIds)))
      .then(snap => {
        const real = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLikedItems([...real, ...sampleItems]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, likedIdsKey]);

  // Offers received (real-time)
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'offers'), where('sellerUid', '==', uid));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOffersIn(items);
    });
  }, [uid]);

  // Offers sent (real-time)
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'offers'), where('buyerUid', '==', uid));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOffersOut(items);
    });
  }, [uid]);

  async function markSold(listingId) {
    await updateDoc(doc(db, 'listings', listingId), { status: 'sold' });
  }

  async function markActive(listingId) {
    await updateDoc(doc(db, 'listings', listingId), { status: 'active' });
  }

  async function deleteListing(listingId) {
    if (!window.confirm('Delete this listing?')) return;
    await deleteDoc(doc(db, 'listings', listingId));
  }

  async function acceptOffer(offer) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'offers', offer.id), { status: 'accepted' });
    if (offer.listingId) batch.update(doc(db, 'listings', offer.listingId), { status: 'sold' });
    await batch.commit();
  }

  async function declineOffer(offerId) {
    await updateDoc(doc(db, 'offers', offerId), { status: 'declined' });
  }

  async function confirmReceived(offerId) {
    await updateDoc(doc(db, 'offers', offerId), { status: 'complete' });
  }

  const sold      = myListings.filter(l => l.status === 'sold');
  const purchased = offersOut.filter(o => ['accepted','payment_sent','complete'].includes(o.status));

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topInner}>
          <h2 className={styles.pageTitle}>My Closet</h2>
          <div className={styles.tabs}>
            {SUBTABS.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {tab === 'listings' && (
          <Section
            items={myListings.filter(l => l.status !== 'sold')}
            empty="You haven't posted anything yet."
            renderItem={l => (
              <ItemCard key={l.id} listing={l}>
                <button className={styles.actBtn} onClick={() => markSold(l.id)}>Mark Sold</button>
                <button className={`${styles.actBtn} ${styles.actDanger}`} onClick={() => deleteListing(l.id)}>Delete</button>
              </ItemCard>
            )}
          />
        )}

        {tab === 'liked' && (
          <Section
            items={likedItems}
            empty="You haven't liked anything yet."
            renderItem={l => (
              <ItemCard key={l.id} listing={l}>
                <button
                  className={`${styles.actBtn} ${styles.actDanger}`}
                  onClick={() => toggleLike(l.id)}
                >
                  ♡ Unlike
                </button>
              </ItemCard>
            )}
          />
        )}

        {tab === 'offers' && (
          <div>
            <div className={styles.sectionHead}>Received</div>
            {offersIn.length === 0
              ? <p className={styles.empty}>No offers received yet.</p>
              : offersIn.map(o => (
                <OfferCard key={o.id} offer={o} side="received" onViewProfile={onViewProfile}>
                  {o.status === 'pending' && (
                    <>
                      <button className={styles.actBtn} onClick={() => acceptOffer(o)}>Accept</button>
                      <button className={`${styles.actBtn} ${styles.actGhost}`} onClick={() => declineOffer(o.id)}>Decline</button>
                    </>
                  )}
                  {o.status === 'payment_sent' && (
                    <button className={styles.actBtn} onClick={() => confirmReceived(o.id)}>Confirm Received</button>
                  )}
                </OfferCard>
              ))
            }
            <div className={styles.sectionHead} style={{ marginTop: '2rem' }}>Sent</div>
            {offersOut.length === 0
              ? <p className={styles.empty}>You haven't sent any offers yet.</p>
              : offersOut.map(o => <OfferCard key={o.id} offer={o} side="sent" onViewProfile={onViewProfile} />)
            }
          </div>
        )}

        {tab === 'sold' && (
          <Section
            items={sold}
            empty="No sold items yet."
            renderItem={l => (
              <ItemCard key={l.id} listing={l} badge="SOLD">
                <button className={styles.actBtn} onClick={() => markActive(l.id)}>Relist</button>
              </ItemCard>
            )}
          />
        )}

        {tab === 'purchased' && (
          <Section
            items={purchased}
            empty="No purchases yet."
            renderItem={o => (
              <OfferCard key={o.id} offer={o} side="purchased" onViewProfile={onViewProfile}>
                {o.status === 'accepted' && (
                  <button className={styles.actBtn} onClick={() => setPaymentOffer(o)}>Send Payment</button>
                )}
                {o.status === 'payment_sent' && (
                  <span className={`${styles.statusBadge} ${styles.statusPending}`}>Payment Sent</span>
                )}
              </OfferCard>
            )}
          />
        )}
      </div>

      {paymentOffer && (
        <PaymentModal offer={paymentOffer} onClose={() => setPaymentOffer(null)} />
      )}
    </div>
  );
}

function Section({ items, empty, renderItem }) {
  if (items.length === 0) return <p className={styles.empty}>{empty}</p>;
  return <div className={styles.itemList}>{items.map(renderItem)}</div>;
}

function ItemCard({ listing: l, badge, children }) {
  const cat   = (l.category || 'other').toLowerCase();
  const emoji = CATEGORY_EMOJI[cat] || '✨';
  const bg    = CATEGORY_BG[cat]    || '#DDF0FF';
  const price = typeof l.price === 'number'
    ? (['sublease','subleasing'].includes(cat) ? `$${l.price}/mo` : `$${l.price}`)
    : (l.price || '');

  return (
    <div className={styles.itemCard}>
      <div className={styles.thumb} style={{ background: l.imageUrl ? '#f0f4f8' : bg }}>
        {l.imageUrl
          ? <img src={l.imageUrl} alt={l.title} className={styles.thumbImg} />
          : <span className={styles.thumbEmoji}>{emoji}</span>
        }
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.itemInfo}>
        <div className={styles.itemTitle}>{l.title}</div>
        <div className={styles.itemMeta}>
          {[l.category, l.size && l.size !== '—' ? l.size : null, l.condition].filter(Boolean).join(' · ')}
        </div>
        <div className={styles.itemPrice}>{price}</div>
        {children && <div className={styles.itemActions}>{children}</div>}
      </div>
    </div>
  );
}

function OfferCard({ offer: o, side, onViewProfile, children }) {
  const cat   = (o.listingCategory || 'other').toLowerCase();
  const bg    = CATEGORY_BG[cat] || '#DDF0FF';
  const emoji = CATEGORY_EMOJI[cat] || '✨';

  const STATUS_LABEL = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined', payment_sent: 'Payment Sent', complete: 'Complete' };
  const STATUS_COLOR = { pending: styles.statusPending, accepted: styles.statusAccepted, declined: styles.statusDeclined, payment_sent: styles.statusPending, complete: styles.statusComplete };

  return (
    <div className={styles.offerCard}>
      <div className={styles.offerThumb} style={{ background: o.listingImageUrl ? '#f0f4f8' : bg }}>
        {o.listingImageUrl
          ? <img src={o.listingImageUrl} alt={o.listingTitle} className={styles.thumbImg} />
          : <span className={styles.thumbEmoji}>{emoji}</span>
        }
      </div>
      <div className={styles.offerInfo}>
        <div className={styles.itemTitle}>{o.listingTitle}</div>
        <div className={styles.offerPrices}>
          <span className={styles.offerAmount}>${o.amount}</span>
          <span className={styles.offerAsking}>(listed ${o.listingPrice})</span>
        </div>
        <div className={styles.itemMeta}>
          {side === 'received'
            ? <span onClick={() => onViewProfile?.(o.buyerUid)} style={{ cursor: o.buyerUid ? 'pointer' : 'default', textDecoration: o.buyerUid ? 'underline' : 'none' }}>from {o.buyerName}</span>
            : <span onClick={() => onViewProfile?.(o.sellerUid)} style={{ cursor: o.sellerUid ? 'pointer' : 'default', textDecoration: o.sellerUid ? 'underline' : 'none' }}>to {o.sellerName || 'seller'}</span>
          }
        </div>
        {o.message ? <div className={styles.offerMsg}>"{o.message}"</div> : null}
        <div className={styles.offerBottom}>
          <span className={`${styles.statusBadge} ${STATUS_COLOR[o.status] || ''}`}>
            {STATUS_LABEL[o.status] || o.status}
          </span>
          {children && <div className={styles.itemActions}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
