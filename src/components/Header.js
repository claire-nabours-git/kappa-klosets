import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Header.module.css';

export default function Header({ onPost, onProfile, onSearch, page, isGuest }) {
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
          <svg className={styles.heartSvg} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          KAPPA KLOSETS
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

          <div className={styles.pill} ref={pillRef} onClick={() => isGuest ? onProfile() : setDropOpen(o => !o)}>
            <div className={styles.dot}>
              {isGuest ? (
                <svg viewBox="0 0 24 24" fill="#fff" width="14" height="14">
                  <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              ) : userProfile?.photoUrl ? (
                <img src={userProfile.photoUrl} alt="" className={styles.dotImg} />
              ) : initials}
            </div>
            <span className={styles.pillName}>{isGuest ? 'Guest' : (userProfile?.first || 'Account')}</span>

            {!isGuest && dropOpen && (
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
