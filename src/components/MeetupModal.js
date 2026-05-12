import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { sendDm } from '../utils/sendDm';
import styles from './MeetupModal.module.css';

export default function MeetupModal({ offer, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [location, setLocation] = useState('');
  const [date, setDate]         = useState('');
  const [time, setTime]         = useState('');
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);

  async function handleConfirm() {
    if (!location || !date || !time) return;
    setSaving(true);

    const formattedDate = new Date(`${date}T${time}`).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

    await updateDoc(doc(db, 'offers', offer.id), {
      meetupLocation: location.trim(),
      meetupDate:     date,
      meetupTime:     time,
      meetupNote:     note.trim(),
      meetupFormatted: formattedDate,
      status: 'meetup_set',
    });

    if (offer.buyerUid && currentUser) {
      const sellerName = `${userProfile?.first || ''} ${userProfile?.last?.[0] || ''}.`.trim();
      const dmText = [
        `📍 Exchange set for "${offer.listingTitle}"!`,
        `Meet at: ${location.trim()}`,
        `When: ${formattedDate}`,
        note.trim() ? `Note: ${note.trim()}` : null,
      ].filter(Boolean).join('\n');
      await sendDm({
        fromUid:  currentUser.uid,
        fromName: sellerName,
        toUid:    offer.buyerUid,
        toName:   offer.buyerName || 'Sister',
        text:     dmText,
      });
    }

    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1400);
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>✕</button>

        {done ? (
          <div className={styles.success}>📍 Exchange details sent to buyer!</div>
        ) : (
          <>
            <div className={styles.title}>Set Up Exchange</div>
            <div className={styles.sub}>for "{offer.listingTitle}"</div>

            <label className={styles.lbl}>Location</label>
            <input
              className={styles.input}
              placeholder="e.g. Outside Hedrick Hall, KKG house front door"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />

            <div className={styles.row}>
              <div className={styles.halfWrap}>
                <label className={styles.lbl}>Date</label>
                <input className={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className={styles.halfWrap}>
                <label className={styles.lbl}>Time</label>
                <input className={styles.input} type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <label className={styles.lbl}>Note <span className={styles.optional}>(optional)</span></label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Any extra details…"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />

            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={saving || !location || !date || !time}
            >
              {saving ? 'Saving…' : 'Confirm & Notify Buyer'}
            </button>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
