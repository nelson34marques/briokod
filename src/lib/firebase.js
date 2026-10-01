import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAu26AO--roTDJM_k7MgUcDWwXMS6i_PLE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'briokod.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'briokod',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'briokod.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '816489549818',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:816489549818:web:f88cf691179e83ff085e43',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-EQLDV0TL76',
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

// Keeps the session alive across reloads for up to a month.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Persistence is best-effort; an in-memory session still works.
});

/**
 * Firestore and Storage are only needed by the screens that touch them, so they
 * load on first use. That keeps Firestore's weight out of the landing bundle,
 * which only needs Auth to know who is signed in.
 */
let db = null;
let storage = null;

export async function getDb() {
  if (!db) {
    const { getFirestore } = await import('firebase/firestore');
    db = getFirestore(firebaseApp);
  }
  return db;
}

export async function getStorageClient() {
  if (!storage) {
    const { getStorage } = await import('firebase/storage');
    storage = getStorage(firebaseApp);
  }
  return storage;
}

export default firebaseConfig;
