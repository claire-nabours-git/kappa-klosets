import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';

export default function Header({ onPost, onProfile, onSearch, page }) {
  const { currentUser, userProfile, logout } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const pillRef = useRef(null);

  const initials = userProfile
    ? (userProfile.first?.[0] || '') + (userProfile.last?.[0] || '')
    : '?';

  useEffect(() => {
    function handleClick(e) {
      if (pillRef.current && !pillRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.wordmark} href="/">
          <span className={styles.heart}>♥</span>KAPPA KLOSETS
        </a>

        {page !== 'closet' && (
          <div className={styles.search}>
            <span className={styles.searchIco}>⌕</span>
            <input
              type="text"
              placeholder={page === 'messages' ? 'search messages or users...' : 'search listings...'}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        )}

        <div className={styles.right}>
          <button className={styles.postBtn} onClick={onPost}>+ Post</button>

          <div className={styles.pill} ref={pillRef} onClick={() => setDropOpen(o => !o)}>
            <div className={styles.dot}>
              {userProfile?.photoUrl
                ? <img src={userProfile.photoUrl} alt="" className={styles.dotImg} />
                : initials}
            </div>
            <span className={styles.pillName}>{userProfile?.first || 'Account'}</span>

            {dropOpen && (
              <div className={styles.drop}>
                <div className={styles.dropProfile}>
                  <div className={styles.dropAvatar}>
                    {userProfile?.photoUrl
                      ? <img src={userProfile.photoUrl} alt="" className={styles.dotImg} />
                      : initials}
                  </div>
                  <div>
                    <div className={styles.dropName}>{userProfile?.first} {userProfile?.last}</div>
                    <div className={styles.dropEmail}>{currentUser?.email}</div>
                  </div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statVal}>{userProfile?.age || '—'}</span>
                    <span className={styles.statLbl}>Age</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statVal}>{(userProfile?.grade || '—').slice(0,4)}</span>
                    <span className={styles.statLbl}>Year</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statVal}>{(userProfile?.pc || '—').slice(0,8)}</span>
                    <span className={styles.statLbl}>PC</span>
                  </div>
                </div>

                <button className={styles.dropBtn} onClick={(e) => { e.stopPropagation(); setDropOpen(false); onProfile(); }}>
                  Edit Profile
                </button>
                <button className={`${styles.dropBtn} ${styles.out}`} onClick={logout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
