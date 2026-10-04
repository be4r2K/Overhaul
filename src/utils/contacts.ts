import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Toast } from '@capacitor/toast';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Native permission request timed out'));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Opens the native Android Application Details settings page so the user can enable Contacts directly in System Settings.
 */
export async function openNativeAppSettings(): Promise<void> {
  try {
    await NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
      ...({ option: 'applicationDetails' } as any),
    });
    return;
  } catch (err) {
    console.warn('NativeSettings.open fallback:', err);
  }

  try {
    const win = window as any;
    if (win.AndroidNativeBridge && typeof win.AndroidNativeBridge.openAppSettings === 'function') {
      win.AndroidNativeBridge.openAppSettings();
    }
  } catch {}
}

/**
 * Checks if the Contacts plugin is loaded and available on the native platform.
 */
export async function isContactsAvailable(): Promise<boolean> {
  try {
    return Capacitor.isNativePlatform() || Boolean((window as any).AndroidNativeBridge);
  } catch {
    return false;
  }
}

/**
 * Checks whether native contacts permission is currently granted by the Android OS.
 */
export async function checkContactsPermissionsGranted(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform() && Contacts && typeof Contacts.checkPermissions === 'function') {
      const status = await withTimeout(Contacts.checkPermissions(), 3000);
      if (status && status.contacts === 'granted') {
        return true;
      }
    }
    const win = window as any;
    if (win.AndroidNativeBridge && typeof win.AndroidNativeBridge.hasContactsPermission === 'function') {
      return Boolean(win.AndroidNativeBridge.hasContactsPermission());
    }
  } catch (e) {
    console.warn('checkContactsPermissions error:', e);
  }
  return false;
}

/**
 * Executes Capacitor's native runtime permission request directly: `await Contacts.requestPermissions()`.
 * - If Android returns `prompt` or `granted`, immediately opens the native OS permission sheet via `Contacts.requestPermissions()`.
 * - If Android has permanently blocked the prompt (`denied`), opens `NativeSettings.open({ option: Option.applicationDetails })`
 *   so the user can enable Contacts directly in System Settings.
 */
export async function requestContactsPermissions(): Promise<boolean> {
  try {
    // 1. Execute Capacitor's native runtime permission request directly
    if (Contacts && typeof Contacts.requestPermissions === 'function') {
      const startMs = Date.now();
      const permission = await withTimeout(Contacts.requestPermissions(), 12000);
      const elapsedMs = Date.now() - startMs;

      if (permission && permission.contacts === 'granted') {
        return true;
      }

      // If Android permanently blocked the prompt (returned 'denied' immediately without showing a sheet)
      // or the user denied it, open Native App Settings directly so they can flip Contacts ON.
      if (
        permission?.contacts === 'denied' ||
        permission?.contacts === 'prompt-with-rationale' ||
        elapsedMs < 350
      ) {
        await openNativeAppSettings();
        return false;
      }
    }

    // 2. Fallback to AndroidNativeBridge if Capacitor plugin is unavailable
    const win = window as any;
    if (win.AndroidNativeBridge && typeof win.AndroidNativeBridge.requestContactsPermission === 'function') {
      if (win.AndroidNativeBridge.hasContactsPermission()) {
        return true;
      }
      win.AndroidNativeBridge.requestContactsPermission();
      return false;
    }

    if (Capacitor.isNativePlatform()) {
      await openNativeAppSettings();
    } else {
      Toast.show({
        text: 'Contacts access requires permission',
        duration: 'short',
      }).catch(() => {});
    }
    return false;
  } catch (e) {
    console.warn('Native Contacts.requestPermissions error or timeout:', e);
    if (Capacitor.isNativePlatform()) {
      await openNativeAppSettings();
    } else {
      Toast.show({
        text: 'Contacts access requires permission',
        duration: 'short',
      }).catch(() => {});
    }
    return false;
  }
}

export interface CompactContact {
  name: string;
  phone: string;
  isRegisteredUser?: boolean;
}

/**
 * Reads real device contacts ONLY when native OS permission is granted.
 */
export async function fetchDeviceContacts(): Promise<CompactContact[]> {
  try {
    const hasPerms = await checkContactsPermissionsGranted();
    if (!hasPerms) {
      const requested = await requestContactsPermissions();
      if (!requested) return [];
    }

    if (Contacts && typeof Contacts.getContacts === 'function') {
      const { contacts } = await withTimeout(
        Contacts.getContacts({
          projection: {
            name: true,
            phones: true,
            emails: true,
          } as any,
        }),
        5000
      );

      if (contacts && contacts.length > 0) {
        const mapped: CompactContact[] = [];
        contacts.forEach((c: any) => {
          const display =
            c.name?.display ||
            c.displayName ||
            `${c.name?.given || ''} ${c.name?.family || ''}`.trim();
          const phones = c.phones || [];
          const emails = c.emails || [];
          const phoneOrEmail =
            phones[0]?.number ||
            phones[0]?.value ||
            emails[0]?.address ||
            emails[0]?.value ||
            '';

          if (display && display !== 'Unknown') {
            mapped.push({
              name: display,
              phone: phoneOrEmail,
              isRegisteredUser: true,
            });
          }
        });
        return mapped;
      }
    }
  } catch (e) {
    console.warn('Native Contacts sync error:', e);
  }

  return [];
}
