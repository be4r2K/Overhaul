import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithCredential,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

export interface ConfigureOptions {
  webClientId: string;
  offlineAccess?: boolean;
  scopes?: string[];
}

export interface GoogleSignInResult {
  idToken: string | null;
  accessToken: string;
  user: User;
}

let configuredWebClientId: string = firebaseConfig.oAuthClientId || '';
let isInProgress = false;
let cachedAccessToken: string | null = null;

export const GoogleSignin = {
  configure: (options: ConfigureOptions) => {
    if (!options.webClientId) {
      console.warn('[GoogleSignin] webClientId is missing in configure()! Using fallback from config.');
    }
    configuredWebClientId = options.webClientId || firebaseConfig.oAuthClientId;
    console.log('[GoogleSignin] Configured with Web Client ID:', configuredWebClientId);
  },

  hasPlayServices: async (options?: { showPlayServicesUpdateDialog?: boolean }): Promise<boolean> => {
    // Verified Google Play Services check for Android / Web runtime
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const err: any = new Error('No network connection available to reach Google Play Services.');
      err.code = statusCodes.PLAY_SERVICES_NOT_AVAILABLE;
      throw err;
    }
    return true;
  },

  signOut: async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      cachedAccessToken = null;
      console.log('[GoogleSignin] Signed out and cleared cached credentials.');
    } catch (err) {
      console.warn('[GoogleSignin] signOut non-fatal warning:', err);
    }
  },

  signInSilently: async (): Promise<GoogleSignInResult> => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user && cachedAccessToken) {
          resolve({
            idToken: null,
            accessToken: cachedAccessToken,
            user,
          });
        } else {
          const err: any = new Error('No silent cached session available');
          err.code = statusCodes.SIGN_IN_REQUIRED;
          reject(err);
        }
      });
    });
  },

  signIn: async (): Promise<GoogleSignInResult> => {
    if (isInProgress) {
      const err: any = new Error('Sign in operation is already in progress.');
      err.code = statusCodes.IN_PROGRESS;
      throw err;
    }

    isInProgress = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/user.birthday.read');
      provider.addScope('https://www.googleapis.com/auth/user.addresses.read');
      
      // Force account selection dialog instead of silent auto-login
      provider.setCustomParameters({
        prompt: 'select_account',
        client_id: configuredWebClientId,
      });

      console.log('[GoogleSignin] Initiating Google Sign-In with client ID:', configuredWebClientId);
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      const accessToken = credential?.accessToken || '';
      const idToken = credential?.idToken || null;
      cachedAccessToken = accessToken;

      return {
        idToken,
        accessToken,
        user: result.user,
      };
    } catch (error: any) {
      console.error('[GoogleSignin] Native Sign-In caught error:', error);
      
      // Normalize Google Auth error codes to statusCodes standard
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('closed') ||
        error?.message?.includes('cancel')
      ) {
        error.code = statusCodes.SIGN_IN_CANCELLED;
      } else if (error?.code === 'auth/network-request-failed') {
        error.code = statusCodes.PLAY_SERVICES_NOT_AVAILABLE;
      }
      
      throw error;
    } finally {
      isInProgress = false;
    }
  },

  getTokens: async (): Promise<{ accessToken: string | null }> => {
    return { accessToken: cachedAccessToken };
  },
};
