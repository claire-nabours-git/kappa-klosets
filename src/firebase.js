import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAu7vXX3q-i3_J9LMtvtmDzYYMOWAj9Ihc",
  authDomain: "kappaklosets.firebaseapp.com",
  projectId: "kappaklosets",
  storageBucket: "kappaklosets.firebasestorage.app",
  messagingSenderId: "630451891422",
  appId: "1:630451891422:web:1541191a4f40b09d2fa64f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;