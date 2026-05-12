import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { sendDm } from '../utils/sendDm';
import styles from './PaymentModal.module.css';

export default function PaymentModal({ offer, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [sellerVenmo, setSellerVenmo] = useState(null);
  const [marking, setMarking]         = useState(false);
  const [marked, setMarked]           = useState(false);

  useEffect(() => {
    if (!offer.sellerUid) return;
    getDoc(doc(db, 'users', offer.sellerUid)).then(snap => {
      if (snap.exists()) setSellerVenmo(snap.data().venmo || null);
    });
  }, [offer.sellerUid]);

  async function markAsPaid() {
    setMarking(true);
    await updateDoc(doc(db, 'offers', offer.id), { status: 'payment_sent' });

    if (currentUser && offer.sellerUid) {
      const buyerName = `${userProfile?.first || ''} ${userProfile?.last?.[0] || ''}.`.trim();
      await sendDm({
        fromUid: currentUser.uid,
        fromName: buyerName,
        toUid: offer.sellerUid,
        toName: offer.sellerName || 'Sister',
        text: `💸 Payment sent! ${buyerName} paid $${offer.amount} for "${offer.listingTitle}" via Venmo.`,
      });
    }

    setMarked(true);
    setMarking(false);
    setTimeout(onClose, 1200);
  }

  const venmoDeepLink = sellerVenmo
    ? `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(sellerVenmo)}&amount=${offer.amount}&note=${encodeURIComponent(offer.listingTitle || 'Kappa Klosets')}`
    : null;
  const venmoWebLink = sellerVenmo ? `https://venmo.com/${sellerVenmo}` : null;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>✕</button>

        {marked ? (
          <div className={styles.success}>Payment marked as sent!</div>
        ) : (
          <>
            <div className={styles.title}>Send Payment</div>
            <div className={styles.sub}>to {offer.sellerName}</div>

            <div className={styles.amountRow}>
              <span className={styles.amountLabel}>Amount due</span>
              <span className={styles.amount}>${offer.amount}</span>
            </div>

            {sellerVenmo ? (
              <>
                <div className={styles.venmoRow}>
                  <span className={styles.venmoLabel}>Venmo</span>
                  <span className={styles.venmoHandle}>@{sellerVenmo}</span>
                </div>
                <a
                  className={styles.venmoBtn}
                  href={venmoDeepLink}
                  onClick={e => {
                    setTimeout(() => { window.location.href = venmoWebLink; }, 300);
                  }}
                >
                  Open Venmo
                </a>
              </>
            ) : (
              <div className={styles.noVenmo}>
                {offer.sellerName} hasn't added their Venmo yet — message them to arrange payment.
              </div>
            )}

            <button className={styles.paidBtn} onClick={markAsPaid} disabled={marking}>
              {marking ? 'Saving…' : 'Mark as Paid'}
            </button>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}
