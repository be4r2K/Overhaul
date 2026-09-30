/**
 * Web / Vite fallback stub for @react-native-firebase/auth.
 * Prevents Vite bundling failures when native React Native Firebase auth packages are referenced.
 */

export const GoogleAuthProvider = {
  credential: (idToken: string, accessToken?: string) => ({
    token: idToken,
    secret: accessToken || '',
    providerId: 'google.com',
  }),
};

export const auth = () => ({
  signInWithCredential: async (_credential: any) => ({
    user: null,
  }),
  signOut: async () => {},
  currentUser: null,
  onAuthStateChanged: (_cb: any) => () => {},
});

(auth as any).GoogleAuthProvider = GoogleAuthProvider;

export default auth;
