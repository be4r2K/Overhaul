import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': rootDir,
        '@capacitor-community/google-auth': '@codetrix-studio/capacitor-google-auth',
        '@react-native-google-signin/google-signin': path.resolve(rootDir, 'src/utils/reactNativeGoogleSigninStub.ts'),
        '@react-native-firebase/auth': path.resolve(rootDir, 'src/utils/reactNativeFirebaseAuthStub.ts'),
        '@react-native-firebase/app': path.resolve(rootDir, 'src/utils/reactNativeFirebaseAuthStub.ts'),
        'react-native': path.resolve(rootDir, 'src/utils/reactNativeStub.ts'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
