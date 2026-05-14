import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Hero from '../components/Hero';
import SortBar from '../components/TabBar';
import ListingsGrid from '../components/ListingsGrid';
import NavBar from '../components/NavBar';
import PostModal from '../components/PostModal';
import ProfileModal from '../components/ProfileModal';
import MyClosetPage from './MyClosetPage';
import MessagesPage from './MessagesPage';
import UserProfilePage from './UserProfilePage';
import styles from './HomePage.module.css';

const EMPTY_FILTERS = { categories: [], sizes: [], colors: [], freeOnly: false };

export default function HomePage({ isGuest = false, requireAuth }) {
  const { currentUser } = useAuth();
  const [page, setPage]             = useState('home');
  const [prevPage, setPrevPage]     = useState('home');
  const [sort, setSort]             = useState('newest');
  const [filters, setFilters]       = useState(EMPTY_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState({ topId: null, subId: null });
  const [postOpen, setPostOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [profileUid, setProfileUid] = useState(null);
  const [dmUid, setDmUid]           = useState(null);
  const [dmData, setDmData]         = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const q = query(collection(db, 'dms'), where('participants', 'array-contains', uid));
    return onSnapshot(q, snap => {
      let count = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.lastMessageAt) return;
        if (data.lastSenderUid === uid) return;
        const myLastRead = data.lastRead?.[uid];
        if (!myLastRead || data.lastMessageAt.seconds > myLastRead.seconds) count++;
      });
      setUnreadCount(count);
    });
  }, [currentUser]);

  const [closetActionCount, setClosetActionCount] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    let sellerOffers = [], buyerOffers = [];
    function recompute() {
      const count =
        sellerOffers.filter(o => o.status === 'pending' || o.status === 'payment_sent').length +
        buyerOffers.filter(o => o.status === 'accepted').length;
      setClosetActionCount(count);
    }
    const unsubSeller = onSnapshot(
      query(collection(db, 'offers'), where('sellerUid', '==', uid)),
      snap => { sellerOffers = snap.docs.map(d => d.data()); recompute(); }
    );
    const unsubBuyer = onSnapshot(
      query(collection(db, 'offers'), where('buyerUid', '==', uid)),
      snap => { buyerOffers = snap.docs.map(d => d.data()); recompute(); }
    );
    return () => { unsubSeller(); unsubBuyer(); };
  }, [currentUser]);

  function handleCatSelect(topId, subId, freeOnly) {
    setSelectedCat({ topId, subId });
    setFilters(f => ({ ...f, categories: subId ? [subId] : [], freeOnly: !!freeOnly }));
  }

  function viewProfile(uid) {
    if (!uid) return;
    setPrevPage(page); setProfileUid(uid); setPage('profile');
  }

  function startDm(uid, data) {
    if (!uid) return;
    setDmUid(uid); setDmData(data || null); setPage('messages');
  }

  function goBack() { setPage(prevPage || 'home'); }

  function handleNavPage(p) {
    setPage(p);
    if (p !== 'profile')  setProfileUid(null);
    if (p !== 'messages') { setDmUid(null); setDmData(null); }
  }

  return (
    <div className={styles.page}>
      <Header
        onPost={() => isGuest ? requireAuth('post a listing') : setPostOpen(true)}
        onProfile={() => isGuest ? requireAuth('edit your profile') : setProfileOpen(true)}
        isGuest={isGuest}
        onSearch={setSearchQuery}
        page={page}
      />

      {page === 'home' && (
        <>
          <Hero />
          <SortBar
            sort={sort} onSort={setSort}
            filters={filters} onFilters={setFilters}
            selectedCat={selectedCat} onCatSelect={handleCatSelect}
          />
          <ListingsGrid sort={sort} filters={filters} searchQuery={searchQuery} onViewProfile={viewProfile} isGuest={isGuest} requireAuth={requireAuth} />
        </>
      )}

      {page === 'messages' && <MessagesPage initialUid={dmUid} initialUidData={dmData} searchQuery={searchQuery} />}
      {page === 'closet'   && <MyClosetPage onViewProfile={viewProfile} onDm={startDm} />}
      {page === 'profile' && profileUid && (
        <UserProfilePage uid={profileUid} onBack={goBack} onDm={startDm} />
      )}

      {page !== 'profile' && <NavBar page={page} onPage={p => { if (isGuest && (p === 'closet' || p === 'messages')) { requireAuth('access your closet and messages'); } else { handleNavPage(p); } }} unreadCount={unreadCount} closetActionCount={closetActionCount} />}

      {postOpen    && !isGuest && <PostModal    onClose={() => setPostOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}

      {page !== 'profile' && (
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerWord}>kappa klosets</div>
            <div className={styles.footerCopy}>Buy, sell &amp; swap.</div>
          </div>
        </footer>
      )}
    </div>
  );
}
