import React, { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, setDoc, doc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import styles from './MessagesPage.module.css';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000)     return 'now';
  if (diff < 3600000)   return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagesPage({ initialUid, initialUidData, searchQuery = '' }) {
  const { currentUser, userProfile } = useAuth();
  const [convs, setConvs]           = useState([]);
  const [activeId, setActiveId]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [msgText, setMsgText]       = useState('');
  const [sending, setSending]       = useState(false);
  const msgEndRef = useRef(null);
  const uid = currentUser?.uid;

  const myName     = `${userProfile?.first || ''} ${userProfile?.last || ''}`.trim() || 'Me';
  const myInitials = (userProfile?.first?.[0] || '') + (userProfile?.last?.[0] || '');

  // Subscribe to conversations
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'dms'), where('participants', 'array-contains', uid));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));
      setConvs(items);
    });
  }, [uid]);

  // Open / create conversation with initialUid
  useEffect(() => {
    if (!initialUid || !uid) return;
    const convId = [uid, initialUid].sort().join('_');
    setDoc(doc(db, 'dms', convId), {
      participants: [uid, initialUid],
      participantData: {
        [uid]:         { name: myName,                          initials: myInitials },
        [initialUid]:  initialUidData || { name: 'Sister', initials: '?' },
      },
      lastMessage:    '',
      lastMessageAt:  serverTimestamp(),
    }, { merge: true }).then(() => setActiveId(convId));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUid, uid]);

  // Subscribe to messages in active conv
  useEffect(() => {
    if (!activeId) return;
    const q = query(collection(db, 'dms', activeId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeId]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (!activeId || !uid) return;
    updateDoc(doc(db, 'dms', activeId), { [`lastRead.${uid}`]: serverTimestamp() }).catch(() => {});
  }, [activeId, uid]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!msgText.trim() || !activeId || !currentUser) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText('');
    await addDoc(collection(db, 'dms', activeId, 'messages'), {
      senderUid:      uid,
      senderName:     myName,
      senderInitials: myInitials,
      text,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'dms', activeId), {
      lastMessage:   text,
      lastMessageAt: serverTimestamp(),
      lastSenderUid: uid,
    });
    setSending(false);
  }

  const filteredConvs = searchQuery.trim()
    ? convs.filter(conv => {
        const oUid  = conv.participants?.find(p => p !== uid);
        const oData = conv.participantData?.[oUid] || {};
        const q = searchQuery.toLowerCase();
        return (oData.name || '').toLowerCase().includes(q) ||
               (conv.lastMessage || '').toLowerCase().includes(q);
      })
    : convs;

  const activeConv = convs.find(c => c.id === activeId);
  const otherUid   = activeConv?.participants?.find(p => p !== uid);
  const otherData  = activeConv?.participantData?.[otherUid] || {};

  return (
    <div className={styles.page}>
      {/* ── Conversation list ── */}
      <div className={styles.sidebar}>
        <div className={styles.sideHead}>
          <div className={styles.sideHeadTitle}>Messages</div>
        </div>
        <div className={styles.convList}>
        {filteredConvs.length === 0
          ? <p className={styles.sideEmpty}>{searchQuery ? 'No results.' : 'No messages yet.\nDM someone from their profile.'}</p>
          : filteredConvs.map(conv => {
              const oUid    = conv.participants?.find(p => p !== uid);
              const oData   = conv.participantData?.[oUid] || {};
              const myRead  = conv.lastRead?.[uid];
              const isUnread = conv.lastSenderUid !== uid &&
                !!conv.lastMessageAt &&
                (!myRead || conv.lastMessageAt.seconds > myRead.seconds);
              return (
                <button
                  key={conv.id}
                  className={`${styles.convItem} ${activeId === conv.id ? styles.convOn : ''}`}
                  onClick={() => setActiveId(conv.id)}
                >
                  <div className={styles.convAvatar}>{oData.initials || '?'}</div>
                  <div className={styles.convMeta}>
                    <div className={`${styles.convName} ${isUnread ? styles.convNameUnread : ''}`}>
                      {oData.name || 'Sister'}
                    </div>
                    <div className={styles.convLast}>{conv.lastMessage || 'Start the conversation'}</div>
                  </div>
                  <div className={styles.convRight}>
                    {conv.lastMessageAt && (
                      <div className={styles.convTime}>{formatTime(conv.lastMessageAt)}</div>
                    )}
                    {isUnread && <div className={styles.unreadDot} />}
                  </div>
                </button>
              );
            })
        }
        </div>
      </div>

      {/* ── Chat view ── */}
      <div className={styles.chat}>
        {!activeId ? (
          <div className={styles.chatBlank}>
            <div className={styles.chatBlankLine} />
            <div className={styles.chatBlankLine} style={{ width: 20, opacity: .5 }} />
            <p>Select a conversation or start one from a seller's profile</p>
          </div>
        ) : (
          <>
            <div className={styles.chatHead}>
              <div className={styles.chatAvatar}>{otherData.initials || '?'}</div>
              <div className={styles.chatName}>{otherData.name || 'Sister'}</div>
            </div>

            <div className={styles.msgList}>
              {messages.length === 0 && (
                <p className={styles.msgEmpty}>Say hi!</p>
              )}
              {messages.map((m, i) => {
                const isMe   = m.senderUid === uid;
                const isLast = i === messages.length - 1 || messages[i + 1]?.senderUid !== m.senderUid;
                return (
                  <div key={m.id} className={`${styles.msgRow} ${isMe ? styles.msgMe : ''}`}>
                    {!isMe && (
                      isLast
                        ? <div className={styles.msgAvatar}>{m.senderInitials || '?'}</div>
                        : <div className={styles.msgAvatarSpacer} />
                    )}
                    <div className={styles.msgBubbleWrap}>
                      <div className={`${styles.msgBubble} ${isMe ? styles.msgBubbleMe : ''}`}>
                        {m.text}
                      </div>
                      {isLast && <div className={styles.msgTime}>{formatTime(m.createdAt)}</div>}
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>

            <div className={styles.inputRow}>
              <input
                className={styles.input}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Send a message…"
              />
              <button className={styles.sendBtn} onClick={sendMessage} disabled={!msgText.trim() || sending}>
                <span className={styles.sendLabel}>Send</span>
                <span className={styles.sendArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
