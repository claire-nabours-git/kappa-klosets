import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, deleteDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, onSnapshot as docSnapshot,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { sendDm } from '../utils/sendDm';
import styles from './ListingDetail.module.css';

const CATEGORY_BG = { formal: '#D6ECFF', formals: '#D6ECFF', recruitment: '#FFE8F0', raids: '#E0F2FF', festival: '#FFF0D6', party: '#F0E8FF', dresses: '#F8E4FF', tops: '#E4F0FF', bottoms: '#E8F4E8', shoes: '#FFF4E0', accessories: '#E4F3FF', sets: '#F4E4FF', furniture: '#D8EEF8', subleasing: '#EAF4FF', sublease: '#EAF4FF', tickets: '#E8FFE8', other: '#F0F0F0' };

function toDate(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

function formatPosted(ts) {
  const d = toDate(ts);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(ts) {
  const d = toDate(ts);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60000)      return 'just now';
  if (diff < 3600000)    return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000)   return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000)  return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ListingDetail({ listing: initial, onClose, onViewProfile, isGuest, requireAuth }) {
  const { currentUser, userProfile, toggleLike } = useAuth();
  const [listing, setListing]           = useState(initial);
  const [photoIdx, setPhotoIdx]         = useState(0);
  const [messages, setMessages]         = useState([]);
  const [msgText, setMsgText]           = useState('');
  const [msgSending, setMsgSending]     = useState(false);
  const [offerMode, setOfferMode]       = useState(false);
  const [offerAmt, setOfferAmt]         = useState(initial.price || '');
  const [offerMsg, setOfferMsg]         = useState('');
  const [offerSent, setOfferSent]       = useState(false);
  const [offerSending, setOfferSending] = useState(false);
  const msgEndRef = useRef(null);

  const isSample = String(initial.id).match(/^s\d+$/);

  useEffect(() => {
    if (isSample) return;
    return docSnapshot(doc(db, 'listings', initial.id), snap => {
      if (snap.exists()) setListing({ id: snap.id, ...snap.data() });
    });
  }, [initial.id, isSample]);

  useEffect(() => {
    if (isSample) return;
    const q = query(collection(db, 'listings', initial.id, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [initial.id, isSample]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const photos  = listing.photos?.length > 0 ? listing.photos : (listing.imageUrl ? [listing.imageUrl] : []);
  const hearted = (userProfile?.likedListings || []).includes(listing.id);
  const isOwn   = currentUser?.uid === listing.sellerUid;
  const cat     = (listing.category || 'other').toLowerCase();
  const bg      = CATEGORY_BG[cat] || '#E8EFF4';
  const price   = typeof listing.price === 'number'
    ? (['sublease','subleasing'].includes(cat) ? `$${listing.price}/mo` : `$${listing.price}`)
    : (listing.price || '');

  async function sendMessage() {
    if (!msgText.trim() || !currentUser) return;
    setMsgSending(true);
    await addDoc(collection(db, 'listings', listing.id, 'messages'), {
      uid:      currentUser.uid,
      name:     `${userProfile?.first || ''} ${userProfile?.last || ''}`.trim() || 'Sister',
      initials: (userProfile?.first?.[0] || '') + (userProfile?.last?.[0] || ''),
      text:     msgText.trim(),
      createdAt: serverTimestamp(),
    });
    setMsgText('');
    setMsgSending(false);
  }

  async function deleteMessage(msgId) {
    await deleteDoc(doc(db, 'listings', listing.id, 'messages', msgId));
  }

  async function sendOffer(amount, message) {
    if (!currentUser || !amount) return;
    setOfferSending(true);
    const buyerName = `${userProfile?.first || ''} ${userProfile?.last?.[0] || ''}.`.trim();
    await addDoc(collection(db, 'offers'), {
      listingId:       listing.id,
      listingTitle:    listing.title,
      listingPrice:    listing.price,
      listingImageUrl: photos[0] || null,
      listingCategory: listing.category || '',
      buyerUid:        currentUser.uid,
      buyerName,
      buyerInitials:   (userProfile?.first?.[0] || '') + (userProfile?.last?.[0] || ''),
      sellerUid:       listing.sellerUid || '',
      sellerName:      listing.sellerName || '',
      amount:          Number(amount),
      message:         message.trim(),
      status:          'pending',
      createdAt:       serverTimestamp(),
    });

    if (listing.sellerUid) {
      const dmText = [
        `💌 Offer: $${amount} for "${listing.title}"`,
        message.trim() ? `"${message.trim()}"` : null,
      ].filter(Boolean).join('\n');
      await sendDm({
        fromUid: currentUser.uid,
        fromName: buyerName,
        toUid: listing.sellerUid,
        toName: listing.sellerName || 'Sister',
        text: dmText,
      });
    }

    setOfferSending(false);
    setOfferSent(true);
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.top}>
          {/* ── Photo carousel ── */}
          <div className={styles.photoPanel} style={{ background: photos.length === 0 ? bg : undefined }}>
            {photos.length > 0 ? (
              <>
                <img src={photos[photoIdx]} alt={listing.title} className={styles.mainPhoto} />
                {photos.length > 1 && (
                  <>
                    <button className={`${styles.arrow} ${styles.arrowL}`}
                      onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}>‹</button>
                    <button className={`${styles.arrow} ${styles.arrowR}`}
                      onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}>›</button>
                    <div className={styles.photoThumbs}>
                      {photos.map((p, i) => (
                        <button key={i}
                          className={`${styles.photoThumb} ${i === photoIdx ? styles.photoThumbOn : ''}`}
                          onClick={() => setPhotoIdx(i)}>
                          <img src={p} alt="" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>

          {/* ── Details ── */}
          <div className={styles.details}>
            <div className={styles.detailHead}>
              <div className={styles.detailTitleWrap}>
                <div className={styles.detailCategory}>{listing.category}</div>
                <h2 className={styles.detailTitle}>{listing.title}</h2>
              </div>
              <button
                className={`${styles.likeBtn} ${hearted ? styles.likeBtnOn : ''}`}
                onClick={() => isGuest ? requireAuth('like listings') : toggleLike(listing.id)}
              >
                <span className={styles.likeWord}>{hearted ? '♥ Liked' : '♡ Like'}</span>
                <span className={styles.likeCount}>{listing.likeCount || 0}</span>
              </button>
            </div>

            <div className={styles.detailPrice}>{price}</div>

            <div className={styles.detailMeta}>
              {[
                listing.size && listing.size !== '—' ? `Size ${listing.size}` : null,
                listing.color && listing.color !== '—' ? listing.color : null,
                listing.condition,
              ].filter(Boolean).join(' · ')}
            </div>

            {formatPosted(listing.createdAt) && (
              <div className={styles.postedDate}>
                Posted {formatPosted(listing.createdAt)}
              </div>
            )}

            {listing.description && (
              <p className={styles.detailDesc}>{listing.description}</p>
            )}

            <div
              className={styles.sellerRow}
              onClick={() => onViewProfile?.(listing.sellerUid)}
              style={{ cursor: listing.sellerUid ? 'pointer' : 'default' }}
            >
              <div className={styles.sellerAvatar}>{listing.sellerInitials || '?'}</div>
              <div>
                <div className={styles.sellerName}>{listing.sellerName || listing.seller}</div>
                <div className={styles.sellerLabel}>tap to view profile</div>
              </div>
            </div>

            {/* Actions */}
            {isGuest && listing.status !== 'sold' && (
              <div className={styles.actionBtns}>
                <button className={styles.ctaSolid} onClick={() => requireAuth('buy or make offers')}>Buy Now — {price}</button>
                <button className={styles.ctaGhost} onClick={() => requireAuth('make an offer')}>Make Offer</button>
              </div>
            )}
            {!isGuest && !isOwn && listing.status !== 'sold' && (
              offerSent ? (
                <div className={styles.offerSentMsg}>✓ Offer sent!</div>
              ) : offerMode ? (
                <div className={styles.offerForm}>
                  <input
                    className={styles.offerInput}
                    type="number"
                    value={offerAmt}
                    onChange={e => setOfferAmt(e.target.value)}
                    placeholder={`Your offer (asking $${listing.price})`}
                  />
                  <textarea
                    className={styles.offerTextarea}
                    value={offerMsg}
                    onChange={e => setOfferMsg(e.target.value)}
                    placeholder="Message (optional)"
                    rows={2}
                  />
                  <div className={styles.offerRow}>
                    <button className={styles.ctaGhost} onClick={() => setOfferMode(false)}>Cancel</button>
                    <button className={styles.ctaSolid} onClick={() => sendOffer(offerAmt, offerMsg)}
                      disabled={offerSending || !offerAmt}>
                      {offerSending ? 'Sending…' : 'Send Offer'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.actionBtns}>
                  <button className={styles.ctaSolid}
                    onClick={() => sendOffer(listing.price, "I'd like to buy this!")}
                    disabled={offerSending}>
                    Buy Now — {price}
                  </button>
                  <button className={styles.ctaGhost} onClick={() => setOfferMode(true)}>
                    Make Offer
                  </button>
                </div>
              )
            )}
            {listing.status === 'sold' && (
              <div className={styles.soldTag}>This item has been sold</div>
            )}
          </div>
        </div>

        {/* ── Comments ── */}
        <div className={styles.msgSection}>
          <div className={styles.msgHeading}>Comments</div>
          <div className={styles.msgList}>
            {messages.length === 0 && !isSample &&
              <p className={styles.msgEmpty}>No comments yet — ask the seller anything!</p>
            }
            {isSample &&
              <p className={styles.msgEmpty}>Comments available on real listings.</p>
            }
            {messages.map(m => {
              const isMyMsg = m.uid === currentUser?.uid;
              return (
                <div key={m.id} className={`${styles.msgRow} ${isMyMsg ? styles.msgOwn : ''}`}>
                  {!isMyMsg && (
                    <div
                      className={styles.msgAvatar}
                      onClick={() => onViewProfile?.(m.uid)}
                      style={{ cursor: m.uid ? 'pointer' : 'default' }}
                    >{m.initials || '?'}</div>
                  )}
                  <div className={styles.msgBubbleWrap}>
                    <div className={styles.msgMeta}>
                      <span className={styles.msgName}>{m.name}</span>
                      <span className={styles.msgTime}>{formatRelative(m.createdAt)}</span>
                      {isMyMsg && (
                        <button className={styles.msgDelete} onClick={() => deleteMessage(m.id)}
                          title="Delete comment">
                          ✕
                        </button>
                      )}
                    </div>
                    <div className={`${styles.msgBubble} ${isMyMsg ? styles.msgBubbleOwn : ''}`}>
                      {m.text}
                    </div>
                  </div>
                  {isMyMsg && <div className={styles.msgAvatar}>{m.initials || '?'}</div>}
                </div>
              );
            })}
            <div ref={msgEndRef} />
          </div>
          {currentUser && !isSample && (
            <div className={styles.msgInputRow}>
              <input
                className={styles.msgInput}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Add a comment…"
              />
              <button className={styles.msgSend} onClick={sendMessage}
                disabled={!msgText.trim() || msgSending}>
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
