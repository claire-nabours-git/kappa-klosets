import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, profileData) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      ...profileData,
      email,
      likedListings: [],
      createdAt: new Date().toISOString(),
    });
    return cred;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    return signOut(auth);
  }

  async function updateProfile(data) {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  }

  async function toggleLike(listingId) {
    if (!currentUser) return;
    const isLiked = (userProfile?.likedListings || []).includes(listingId);
    await setDoc(
      doc(db, 'users', currentUser.uid),
      { likedListings: isLiked ? arrayRemove(listingId) : arrayUnion(listingId) },
      { merge: true }
    );
    // Update like count on the listing (skip sample data ids starting with 's')
    if (!String(listingId).match(/^s\d+$/)) {
      try {
        await updateDoc(doc(db, 'listings', listingId), { likeCount: increment(isLiked ? -1 : 1) });
      } catch (_) {}
    }
    setUserProfile(prev => ({
      ...prev,
      likedListings: isLiked
        ? (prev.likedListings || []).filter(id => id !== listingId)
        : [...(prev.likedListings || []), listingId],
    }));
  }

  async function fetchProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) setUserProfile(snap.data());
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await fetchProfile(user.uid);
      else setUserProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  const value = { currentUser, userProfile, register, login, logout, updateProfile, toggleLike, resetPassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
