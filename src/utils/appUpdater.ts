/**
 * App Auto-Updater & Cache Invalidation Utility for OVERHAUL
 * Ensures seamless updates without requiring users to delete and redownload the application.
 */

const CURRENT_APP_VERSION = '1.2.0-' + new Date().toISOString().split('T')[0];

export function checkAndRegisterAppUpdate(): void {
  try {
    const savedVersion = localStorage.getItem('overhaul_app_version');
    if (savedVersion && savedVersion !== CURRENT_APP_VERSION) {
      console.warn(`App version mismatch detected (${savedVersion} -> ${CURRENT_APP_VERSION}). Refreshing caches safely...`);
      localStorage.setItem('overhaul_app_version', CURRENT_APP_VERSION);
      
      // Clear service worker caches if supported
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        }).catch(() => {});
      }

      // Unregister old service workers
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        }).catch(() => {});
      }
    } else if (!savedVersion) {
      localStorage.setItem('overhaul_app_version', CURRENT_APP_VERSION);
    }
  } catch (err) {
    console.warn('App updater check failed:', err);
  }

  // Also listen for online status
  if (typeof window !== 'undefined' && 'navigator' in window) {
    window.addEventListener('online', () => {
      console.info('App back online. Syncing data...');
    });
  }
}
