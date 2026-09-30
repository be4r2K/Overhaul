/**
 * Web / Vite fallback stub for 'react-native'.
 */

export const Platform = {
  OS: 'web',
  select: (obj: any) => obj.web || obj.default,
};

export const Alert = {
  alert: (title: string, message?: string) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`${title}\n${message || ''}`);
    }
  },
};

export default {
  Platform,
  Alert,
};
