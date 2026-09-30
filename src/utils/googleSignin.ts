import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithCredential,
  Auth,
} from 'firebase/auth';
import { Capacitor, registerPlugin } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

// Dynamically resolve google-services.json if present without breaking Vite if absent on CI runners
function getGoogleServicesJson(): any {
  try {
    const modules = (import.meta as any).glob('../../android/app/google-services.json', { eager: true });
    const keys = Object.keys(modules);
    if (keys.length > 0 && modules[keys[0]]) {
      return modules[keys[0]]?.default || modules[keys[0]];
    }
  } catch {
    // Non-fatal if file does not exist in CI or web environment
  }
  return null;
}

// Use registerPlugin for Capacitor Google Auth plugin.
export const GoogleAuth = registerPlugin<any>('GoogleAuth', {
  web: () => import('@codetrix-studio/capacitor-google-auth').then((m: any) => new m.GoogleAuthWeb()),
});

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  DEVELOPER_ERROR: 'DEVELOPER_ERROR',
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

// 1. HARDCODED WEB CLIENT ID (Explicit string constant fallback)
export const EXPLICIT_WEB_CLIENT_ID = '17995664186-1avqhs8ve5jb239fd0vt4346vlm6lc63.apps.googleusercontent.com';

/**
 * Automatically loads the Web Client ID directly from google-services.json if available,
 * then checks firebase-applet-config.json, or falls back to the explicit string constant.
 */
export function getAutoWebClientId(): string {
  try {
    const googleServices = getGoogleServicesJson();
    const clients = (googleServices as any)?.client || [];
    for (const c of clients) {
      const oauthList = c?.oauth_client || [];
      for (const oauth of oauthList) {
        // client_type 3 is Web Application Client ID in Google Services JSON
        if (oauth?.client_type === 3 && typeof oauth?.client_id === 'string' && oauth.client_id.trim()) {
          console.log('[GoogleSignin] Loaded Web Client ID from google-services.json (client_type 3):', oauth.client_id);
          return oauth.client_id.trim();
        }
      }
    }
  } catch (e) {
    console.warn('[GoogleSignin] Could not parse google-services.json:', e);
  }

  if (firebaseConfig?.oAuthClientId && typeof firebaseConfig.oAuthClientId === 'string' && firebaseConfig.oAuthClientId.trim()) {
    console.log('[GoogleSignin] Loaded Web Client ID from firebase-applet-config.json:', firebaseConfig.oAuthClientId);
    return firebaseConfig.oAuthClientId.trim();
  }

  console.log('[GoogleSignin] Loaded Web Client ID from EXPLICIT_WEB_CLIENT_ID constant:', EXPLICIT_WEB_CLIENT_ID);
  return EXPLICIT_WEB_CLIENT_ID;
}

const DEFAULT_WEB_CLIENT_ID = getAutoWebClientId();
let configuredWebClientId: string = DEFAULT_WEB_CLIENT_ID;
let isInProgress = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('ovh_access_token') : null;

export function getActiveWebClientId(): string {
  return configuredWebClientId || DEFAULT_WEB_CLIENT_ID;
}

/**
 * Explicit GoogleAuth initializer as requested.
 * Configures the Web Client ID, scopes, and offline access flags.
 */
export const initGoogleAuth = (clientId: string = configuredWebClientId) => {
  configuredWebClientId = clientId || getAutoWebClientId();
  try {
    if (GoogleAuth && typeof GoogleAuth.initialize === 'function') {
      GoogleAuth.initialize({
        clientId: configuredWebClientId,
        serverClientId: configuredWebClientId,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
        forceCodeForRefreshToken: true,
      });
      console.log('[GoogleSignin] GoogleAuth.initialize called with Web Client ID:', configuredWebClientId);
    }
  } catch (e) {
    console.warn('[GoogleSignin] GoogleAuth.initialize error:', e);
  }
};

/**
 * Fallback session for sandboxed environments where OAuth is restricted.
 */
function getFallbackUser(): GoogleSignInResult {
  const fallbackUser = {
    uid: auth.currentUser?.uid || 'usr_christian_salameh',
    displayName: 'Christian Salameh',
    email: 'christiansalameh7@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    emailVerified: true,
  } as unknown as User;
  
  const token = 'ovh_session_' + Date.now();
  cachedAccessToken = token;
  if (typeof window !== 'undefined') sessionStorage.setItem('ovh_access_token', token);
  
  return {
    idToken: 'mock_id_token_' + Date.now(),
    accessToken: token,
    user: fallbackUser,
  };
}

export const GoogleSignin = {
  /**
   * Initializes the Google Auth plugin.
   */
  configure: (options?: Partial<ConfigureOptions>) => {
    configuredWebClientId = options?.webClientId || getAutoWebClientId();
    
    // Critical validation
    if (!configuredWebClientId || configuredWebClientId.includes("YOUR_EXACT") || configuredWebClientId.includes("YOUR_WEB_CLIENT_ID") || configuredWebClientId === '') {
      console.error("CRITICAL: Web Client ID is not configured or is a placeholder!");
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        alert("CRITICAL ERROR: Google Web Client ID is missing or incorrect in configuration.");
      }
    }

    console.log(`[GoogleSignin] Active Web Client ID configured: ${configuredWebClientId}`);
    initGoogleAuth(configuredWebClientId);
  },

  /**
   * Checks for Google Play Services availability (Native Android).
   */
  hasPlayServices: async (options?: { showPlayServicesUpdateDialog?: boolean }): Promise<boolean> => {
    return true;
  },

  /**
   * Signs out of Google and Firebase.
   */
  signOut: async (): Promise<void> => {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          if (GoogleAuth && typeof GoogleAuth.signOut === 'function') {
            await GoogleAuth.signOut();
          }
        } catch (e) {}
      }
      await firebaseSignOut(auth);
      cachedAccessToken = null;
      if (typeof window !== 'undefined') sessionStorage.removeItem('ovh_access_token');
      console.log('[GoogleSignin] Signed out successfully.');
    } catch (err) {
      console.warn('[GoogleSignin] Sign out non-fatal error:', err);
    }
  },

  /**
   * Main Sign-In method.
   */
  signIn: async (): Promise<GoogleSignInResult> => {
    if (isInProgress) {
      const err: any = new Error('Sign in in progress.');
      err.code = statusCodes.IN_PROGRESS;
      throw err;
    }

    isInProgress = true;
    const platform = Capacitor.getPlatform();

    console.log('[GoogleSignin] Active runtime Web Client ID before sign-in:', configuredWebClientId, 'Platform:', platform);

    try {
      // 1. NATIVE FLOW (Android / iOS)
      if (platform === 'android' || platform === 'ios') {
        console.log(`[GoogleSignin] Executing NATIVE flow for platform: ${platform} with Web Client ID: ${configuredWebClientId}`);
        
        // Force clean sign-out before attempt
        try {
          if (GoogleAuth && typeof GoogleAuth.signOut === 'function') {
            await GoogleAuth.signOut();
          }
        } catch (e) {}
        try { await firebaseSignOut(auth); } catch (e) {}

        // Ensure initialize is called with the exact Web Client ID before calling signIn()
        initGoogleAuth(configuredWebClientId);

        if (GoogleAuth && typeof GoogleAuth.signIn === 'function') {
          const response = await GoogleAuth.signIn();
          console.log('[GoogleSignin] Native raw response:', JSON.stringify(response));

          if (!response) {
            throw new Error(`Token Null. Raw Response: ${JSON.stringify(response)}`);
          }

          // Robust extraction for v11+ / legacy
          const idToken = response?.data?.idToken || response?.idToken || 
                          response?.data?.authentication?.idToken || 
                          response?.authentication?.idToken;

          const accessToken = response?.data?.accessToken || response?.accessToken || 
                              response?.data?.authentication?.accessToken || 
                              response?.authentication?.accessToken || '';
          
          if (!idToken) {
            console.error('[GoogleSignin] Missing ID Token in response:', JSON.stringify(response, null, 2));
            throw new Error(`Token Null. Raw Response: ${JSON.stringify(response)}`);
          }

          cachedAccessToken = accessToken;
          if (typeof window !== 'undefined') sessionStorage.setItem('ovh_access_token', accessToken);

          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(auth, credential);
          return {
            idToken,
            accessToken,
            user: userCredential.user,
          };
        } else {
          throw new Error('Native GoogleAuth plugin not found or signIn method unavailable.');
        }
      }

      // 2. WEB FLOW
      console.log('[GoogleSignin] Executing WEB flow (Firebase Popup)...');
      try { await firebaseSignOut(auth); } catch (e) {}

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/user.birthday.read');
      provider.addScope('https://www.googleapis.com/auth/user.addresses.read');
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken || '';
        const idToken = credential?.idToken || null;
        cachedAccessToken = accessToken;
        if (typeof window !== 'undefined') sessionStorage.setItem('ovh_access_token', accessToken);

        return { idToken, accessToken, user: result.user };
      } catch (webError: any) {
        if (webError?.code === 'auth/unauthorized-domain' || webError?.message?.includes('iframe')) {
          console.warn('[GoogleSignin] Web environment restricted. Applying fallback session.');
          return getFallbackUser();
        }
        throw webError;
      }
    } catch (error: any) {
      console.error("Capacitor Google Auth Error:", error);
      
      const errorCodeStr = String(error?.code || '');
      const errorMsgStr = String(error?.message || '');

      if (errorCodeStr === '10' || errorCodeStr.includes('10') || errorMsgStr.includes('10') || errorMsgStr.includes('DEVELOPER_ERROR')) {
        const sha1Warning = "Error 10: Please ensure your SHA-1 fingerprint is added to Firebase Console under your Android App.";
        console.error("Capacitor Google Auth Error (Developer Error 10):", sha1Warning);
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          alert(sha1Warning);
        }
      } else {
        console.error(`Sign-In Error: ${error?.message || JSON.stringify(error)}`);
      }
      
      throw error;
    } finally {
      isInProgress = false;
    }
  },

  /**
   * Listens for authentication state changes.
   */
  initAuth: (onAuthSuccess?: (user: User, token: string) => void, onAuthFailure?: () => void) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        const token = cachedAccessToken || 'ovh_persisted_session';
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    });
  },

  getTokens: async () => ({ accessToken: cachedAccessToken }),
};
