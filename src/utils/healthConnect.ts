import { Capacitor } from '@capacitor/core';
import { HealthConnect } from 'capacitor-health-connect';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { Toast } from '@capacitor/toast';

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Health Connect bridge timeout after ${ms}ms`));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Launches the Google Play Store installation intent for Health Connect directly when uninstalled.
 */
export async function openHealthConnectPlayStoreIntent(): Promise<void> {
  try {
    const win = window as any;
    if (win.AndroidNativeBridge && typeof win.AndroidNativeBridge.openHealthConnectPlayStore === 'function') {
      win.AndroidNativeBridge.openHealthConnectPlayStore();
      return;
    }
  } catch {}

  try {
    if (Capacitor.isNativePlatform()) {
      window.location.href = 'market://details?id=com.google.android.apps.healthdata';
    } else {
      await Toast.show({
        text: 'Health Connect requires Android Google Play Store',
        duration: 'short',
      });
    }
  } catch {
    try {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
        ...({ option: 'applicationDetails' } as any),
      });
    } catch {}
  }
}

/**
 * Checks if Health Connect is installed and available on the device (with 3s timeout).
 */
export async function isHealthConnectAvailable(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    if (HealthConnect && typeof HealthConnect.checkAvailability === 'function') {
      const { availability } = await withTimeout(HealthConnect.checkAvailability(), 3000);
      return availability === 'Available';
    }
    return false;
  } catch (e) {
    console.warn('Health Connect availability check non-fatal:', e);
    return false;
  }
}

/**
 * Checks if Health Connect permissions are currently granted by the Android OS.
 */
export async function checkHealthConnectPermissionsGranted(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const available = await isHealthConnectAvailable();
    if (!available) {
      return false;
    }
    if (HealthConnect && typeof HealthConnect.checkHealthPermissions === 'function') {
      const result = await withTimeout(
        HealthConnect.checkHealthPermissions({
          read: ['Steps' as any, 'SleepSession' as any],
          write: [],
        }),
        3000
      );
      return Boolean(
        result &&
          ((result as any).granted === true ||
            (result as any).hasAllPermissions === true ||
            (Array.isArray(result.grantedPermissions) && result.grantedPermissions.length > 0))
      );
    }
  } catch (e) {
    console.warn('checkHealthConnectPermissions error or timeout:', e);
  }
  return false;
}

/**
 * Directly invokes native Health Connect authorization.
 * If Health Connect is uninstalled, launches the Google Play Store installation intent for Health Connect directly
 * rather than showing a static local dialog.
 */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  try {
    const win = window as any;

    // 1. Check if Health Connect is installed on the Android device
    const available = await isHealthConnectAvailable();
    if (!available) {
      await openHealthConnectPlayStoreIntent();
      return false;
    }

    // 2. Invoke native Health Connect authorization sheet directly
    if (HealthConnect && typeof HealthConnect.requestHealthPermissions === 'function') {
      const result = await withTimeout(
        HealthConnect.requestHealthPermissions({
          read: ['Steps' as any, 'SleepSession' as any],
          write: [],
        }),
        12000
      );

      const isGranted = Boolean(
        result &&
          ((result as any).granted === true ||
            (result as any).hasAllPermissions === true ||
            (Array.isArray(result.grantedPermissions) && result.grantedPermissions.length > 0))
      );

      if (isGranted) {
        localStorage.setItem('overhaul_hc_mode', 'health_connect');
        return true;
      }

      // If Android suppressed the permission sheet, launch the Health Connect Manage Permissions intent directly
      if (win.AndroidNativeBridge && typeof win.AndroidNativeBridge.launchHealthConnectSheet === 'function') {
        win.AndroidNativeBridge.launchHealthConnectSheet();
      } else if (Capacitor.isNativePlatform()) {
        await NativeSettings.open({
          optionAndroid: AndroidSettings.ApplicationDetails,
          optionIOS: IOSSettings.App,
          ...({ option: 'applicationDetails' } as any),
        });
      }
      return false;
    }

    await openHealthConnectPlayStoreIntent();
    return false;
  } catch (e) {
    console.warn('HealthConnect requestHealthPermissions error:', e);
    await openHealthConnectPlayStoreIntent();
    return false;
  }
}

/**
 * Queries Health Connect for today's aggregated Steps and last night's Sleep duration.
 */
export async function queryHealthConnectData(): Promise<{
  steps: number;
  sleepHours: number;
  source: 'health_connect' | 'hardware' | 'web_simulated';
} | null> {
  try {
    if (Capacitor.isNativePlatform() && (await isHealthConnectAvailable()) && (await checkHealthConnectPermissionsGranted())) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let stepsSum = 0;
      let sleepSumHours = 0;

      // 1. Read Steps
      try {
        const stepsRes = await withTimeout(
          HealthConnect.readRecords({
            type: 'Steps' as any,
            timeRangeFilter: {
              operator: 'after',
              startTime: startOfDay,
            } as any,
          }),
          4000
        );
        if (stepsRes && stepsRes.records) {
          stepsRes.records.forEach((rec: any) => {
            stepsSum += rec.count || rec.steps || 0;
          });
        }
      } catch (stepsErr) {
        console.warn('Failed to query steps records:', stepsErr);
      }

      // 2. Read SleepSession
      try {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sleepRes = await withTimeout(
          HealthConnect.readRecords({
            type: 'SleepSession' as any,
            timeRangeFilter: {
              operator: 'after',
              startTime: oneDayAgo,
            } as any,
          }),
          4000
        );
        if (sleepRes && sleepRes.records) {
          let durationMs = 0;
          sleepRes.records.forEach((rec: any) => {
            if (rec.startTime && rec.endTime) {
              const start = new Date(rec.startTime).getTime();
              const end = new Date(rec.endTime).getTime();
              if (end > start) {
                durationMs += end - start;
              }
            }
          });
          sleepSumHours = Number((durationMs / (1000 * 60 * 60)).toFixed(1));
        }
      } catch (sleepErr) {
        console.warn('Failed to query sleep session records:', sleepErr);
      }

      return {
        steps: stepsSum,
        sleepHours: sleepSumHours,
        source: 'health_connect',
      };
    }
  } catch (e) {
    console.warn('Health Connect query error:', e);
  }

  return {
    steps: 0,
    sleepHours: 0,
    source: 'web_simulated',
  };
}
