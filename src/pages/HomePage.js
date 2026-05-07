import React, { useState } from 'react';
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

export default function HomePage() {
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
        onPost={() => setPostOpen(true)}
        onProfile={() => setProfileOpen(true)}
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
          <ListingsGrid sort={sort} filters={filters} searchQuery={searchQuery} onViewProfile={viewProfile} />
        </>
      )}

      {page === 'messages' && <MessagesPage initialUid={dmUid} initialUidData={dmData} searchQuery={searchQuery} />}
      {page === 'closet'   && <MyClosetPage onViewProfile={viewProfile} onDm={startDm} />}
      {page === 'profile' && profileUid && (
        <UserProfilePage uid={profileUid} onBack={goBack} onDm={startDm} onViewListing={() => {}} />
      )}

      {page !== 'profile' && <NavBar page={page} onPage={handleNavPage} />}

      {postOpen    && <PostModal    onClose={() => setPostOpen(false)} />}
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
