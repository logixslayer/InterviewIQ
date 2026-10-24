/**
 * InterviewIQ Authentication Service
 * 
 * Powered by Firebase Authentication SDK.
 * Features:
 * - Real email & password login and registration
 * - Provider-native session persistence (Local for Remember Me vs Session-only)
 * - Real-time session monitoring via onAuthStateChanged
 * - Sanitized Remember Me email persistence (never stores passwords)
 * - Clear error mapping for invalid credentials, duplicate accounts, and network drops
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  fullName: string;
  email: string;
  password: string;
}

export interface ProviderStatus {
  configured: boolean;
  providerName: string;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
  providerStatus: ProviderStatus;
}

const REMEMBERED_EMAIL_STORAGE_KEY = 'interviewiq_remembered_username';

function formatFirebaseUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    email: user.email || '',
    fullName: user.displayName || user.email?.split('@')[0] || 'Candidate',
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}

/**
 * Retrieves the stored email preference if Remember Me was selected.
 * Note: Stored email is for convenience only and NEVER treated as proof of authentication.
 */
export function getRememberedEmail(): string {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REMEMBERED_EMAIL_STORAGE_KEY) || '';
    }
  } catch (e) {
    console.warn('Unable to access localStorage for remembered email:', e);
  }
  return '';
}

/**
 * Saves or clears the remembered email preference according to Remember Me checkbox.
 */
export function setRememberedEmail(email: string | null): void {
  try {
    if (typeof window !== 'undefined') {
      if (email && email.trim()) {
        localStorage.setItem(REMEMBERED_EMAIL_STORAGE_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_STORAGE_KEY);
      }
    }
  } catch (e) {
    console.warn('Unable to update localStorage for remembered email:', e);
  }
}

/**
 * Checks whether Firebase Authentication is configured with valid environment variables.
 */
export function isAuthProviderConfigured(): boolean {
  return isFirebaseConfigured() && auth !== null;
}

export function getAuthProviderStatus(): ProviderStatus {
  const configured = isAuthProviderConfigured();
  return {
    configured,
    providerName: 'Firebase Authentication',
    message: configured
      ? 'Firebase Authentication connected and active.'
      : 'Firebase Authentication SDK is integrated. Add VITE_FIREBASE_API_KEY and project credentials to your .env file to enable live sign-in.'
  };
}

/**
 * Subscribes to Firebase Authentication state changes.
 */
export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(formatFirebaseUser(firebaseUser));
    } else {
      callback(null);
    }
  });
}

/**
 * Verifies the current authentication session with Firebase.
 * Returns null if no authenticated session exists.
 */
export function checkAuthSession(): Promise<AuthUser | null> {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve(formatFirebaseUser(user));
        } else {
          resolve(null);
        }
      },
      (error) => {
        console.warn('Firebase session check encountered an error:', error);
        unsubscribe();
        resolve(null);
      }
    );
  });
}

/**
 * Synchronous session snapshot.
 */
export function getCurrentAuthUser(): AuthUser | null {
  if (auth?.currentUser) {
    return formatFirebaseUser(auth.currentUser);
  }
  return null;
}

function mapFirebaseError(code: string, defaultMessage: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/invalid-email':
      return 'The email address format is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
    case 'auth/too-many-requests':
      return 'Access temporarily locked due to repeated failed attempts. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error: Unable to reach the authentication service. Check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in your Firebase Console.';
    default:
      return defaultMessage;
  }
}

/**
 * Attempt to log in with email and password via Firebase Auth.
 */
export async function loginWithEmail(credentials: LoginCredentials): Promise<AuthResponse> {
  const status = getAuthProviderStatus();

  // Manage email preference based on Remember Me checkbox
  if (credentials.rememberMe) {
    setRememberedEmail(credentials.email);
  } else {
    setRememberedEmail(null);
  }

  if (!auth) {
    return {
      success: false,
      error: 'Firebase Authentication is integrated, but your Firebase project credentials are not configured in .env. Please configure VITE_FIREBASE_API_KEY in your environment.',
      providerStatus: status
    };
  }

  try {
    // Apply session persistence according to Remember Me selection
    const persistenceMode = credentials.rememberMe 
      ? browserLocalPersistence 
      : browserSessionPersistence;
    
    await setPersistence(auth, persistenceMode);

    const credential = await signInWithEmailAndPassword(
      auth, 
      credentials.email.trim(), 
      credentials.password
    );

    return {
      success: true,
      user: formatFirebaseUser(credential.user),
      providerStatus: status
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const friendlyMessage = mapFirebaseError(
      errorCode, 
      error?.message || 'Authentication failed. Please verify your credentials.'
    );

    return {
      success: false,
      error: friendlyMessage,
      providerStatus: status
    };
  }
}

/**
 * Attempt to register a new user account via Firebase Auth.
 */
export async function signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResponse> {
  const status = getAuthProviderStatus();

  if (!auth) {
    return {
      success: false,
      error: 'Firebase Authentication is integrated, but your Firebase project credentials are not configured in .env. Please configure VITE_FIREBASE_API_KEY in your environment.',
      providerStatus: status
    };
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth, 
      credentials.email.trim(), 
      credentials.password
    );

    // Save candidate's full name to their Firebase user profile
    if (credentials.fullName && credentials.fullName.trim()) {
      await updateProfile(credential.user, {
        displayName: credentials.fullName.trim()
      });
    }

    return {
      success: true,
      user: formatFirebaseUser(credential.user),
      providerStatus: status
    };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const friendlyMessage = mapFirebaseError(
      errorCode, 
      error?.message || 'Registration failed. Please check your details.'
    );

    return {
      success: false,
      error: friendlyMessage,
      providerStatus: status
    };
  }
}

/**
 * Clears active Firebase authentication session.
 */
export async function signOut(): Promise<void> {
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Error signing out of Firebase:', error);
    }
  }
}
