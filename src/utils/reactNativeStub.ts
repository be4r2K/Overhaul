import { Toast } from '@capacitor/toast';

/**
 * Web / Vite fallback stub for 'react-native'.
 */
export const Platform = {
  OS: 'web',
  select: (obj: any) => obj.web || obj.default,
};

export const Alert = {
  alert: async (title: string, message?: string) => {
    const text = `${title}${message ? `: ${message}` : ''}`;
    try {
      await Toast.show({ text, duration: 'long' });
    } catch {
      console.warn('[Alert Toast]:', text);
    }
  },
};

export default {
  Platform,
  Alert,
};
