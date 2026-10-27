import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

export const firebaseConfig = {
  apiKey: "AIzaSyDX9HENZNU3s8k9ATJUXdvqZD6SYzkJUVQ",
  authDomain: "edushield-6de64.firebaseapp.com",
  projectId: "edushield-6de64",
  storageBucket: "edushield-6de64.firebasestorage.app",
  messagingSenderId: "626397085415",
  appId: "1:626397085415:web:874aa79eec708c10aeec42",
  measurementId: "G-B1HB5LE16C"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Optional Emulator connectivity for local development
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('[EduShield] Connected to Firebase Emulators');
  } catch {
    // Emulator connection errors ignored if already connected
  }
}

export default app;
