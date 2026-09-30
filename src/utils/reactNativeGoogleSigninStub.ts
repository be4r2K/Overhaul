/**
 * Web / Vite fallback stub for @react-native-google-signin/google-signin.
 * Prevents Vite bundling failures when native React Native auth packages are referenced.
 */

export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  DEVELOPER_ERROR: 'DEVELOPER_ERROR',
};

export const GoogleSignin = {
  configure: (_options?: any) => {
    // No-op on web
  },
  hasPlayServices: async (_options?: any) => {
    return true;
  },
  signIn: async () => {
    throw new Error('Native React Native GoogleSignin is not available on web. Use Capacitor/Firebase Auth instead.');
  },
  signOut: async () => {},
  revokeAccess: async () => {},
  getTokens: async () => ({ idToken: '', accessToken: '' }),
  getCurrentUser: () => null,
  isSignedIn: async () => false,
};

export default {
  GoogleSignin,
  statusCodes,
};
