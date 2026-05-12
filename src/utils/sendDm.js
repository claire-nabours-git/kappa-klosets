import { setDoc, addDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function toInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

export async function sendDm({ fromUid, fromName, toUid, toName, text }) {
  const convId = [fromUid, toUid].sort().join('_');
  await setDoc(doc(db, 'dms', convId), {
    participants: [fromUid, toUid],
    participantData: {
      [fromUid]: { name: fromName, initials: toInitials(fromName) },
      [toUid]:   { name: toName,   initials: toInitials(toName) },
    },
    lastMessage:   text,
    lastMessageAt: serverTimestamp(),
    lastSenderUid: fromUid,
  }, { merge: true });
  await addDoc(collection(db, 'dms', convId, 'messages'), {
    senderUid:      fromUid,
    senderName:     fromName,
    senderInitials: toInitials(fromName),
    text,
    createdAt: serverTimestamp(),
  });
}
