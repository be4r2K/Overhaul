import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider as WebGoogleAuthProvider,
  signOut as webSignOut,
  onAuthStateChanged as webOnAuthStateChanged,
  User,
  AuthCredential,
  UserCredential,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Universal Native & Web bridge stub for @react-native-firebase/auth.
 * Connects native Firebase Auth calls to standard Firebase Auth under Capacitor & Vite.
 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuthInstance = getAuth(app);

export const GoogleAuthProvider = {
  credential: (idToken: string, accessToken?: string): AuthCredential => {
    return WebGoogleAuthProvider.credential(idToken, accessToken);
  },
};

export interface FirebaseAuthService {
  signInWithCredential: (credential: AuthCredential) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  currentUser: User | null;
  onAuthStateChanged: (cb: (user: User | null) => void) => () => void;
}

export interface FirebaseAuthStatic {
  (): FirebaseAuthService;
  GoogleAuthProvider: typeof GoogleAuthProvider;
}

const authFn = (): FirebaseAuthService => ({
  signInWithCredential: async (credential: AuthCredential): Promise<UserCredential> => {
    return await signInWithCredential(firebaseAuthInstance, credential);
  },
  signOut: async (): Promise<void> => {
    await webSignOut(firebaseAuthInstance);
  },
  get currentUser(): User | null {
    return firebaseAuthInstance.currentUser;
  },
  onAuthStateChanged: (cb: (user: User | null) => void) => {
    return webOnAuthStateChanged(firebaseAuthInstance, cb);
  },
});

export const auth: FirebaseAuthStatic = Object.assign(authFn, {
  GoogleAuthProvider,
});

export default auth;
