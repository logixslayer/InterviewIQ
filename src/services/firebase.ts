import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase Client Configuration
 * Uses Vite environment variables (VITE_FIREBASE_*).
 * Falls back to null if credentials are not configured in .env.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY' &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== 'MY_FIREBASE_PROJECT_ID'
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Auth:', error);
  }
}

export { app, auth };
