package com.overhaul.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int REQ_CONTACTS = 1001;
    private static final int REQ_HEALTH_SENSORS = 1002;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getWebView() != null) {
            WebSettings settings = bridge.getWebView().getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            bridge.getWebView().addJavascriptInterface(new AndroidNativeBridge(), "AndroidNativeBridge");
        }
    }

    public class AndroidNativeBridge {
        @JavascriptInterface
        public boolean hasContactsPermission() {
            return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_CONTACTS)
                    == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public void requestContactsPermission() {
            runOnUiThread(() -> {
                ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS},
                        REQ_CONTACTS
                );
            });
        }

        @JavascriptInterface
        public boolean hasHealthSensorPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION)
                        == PackageManager.PERMISSION_GRANTED;
            }
            return true;
        }

        @JavascriptInterface
        public void requestHealthSensorPermission() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{Manifest.permission.ACTIVITY_RECOGNITION, Manifest.permission.BODY_SENSORS},
                            REQ_HEALTH_SENSORS
                    );
                }
            });
        }

        @JavascriptInterface
        public boolean launchHealthConnectSheet() {
            try {
                Intent intent = new Intent("android.health.connect.action.MANAGE_HEALTH_PERMISSIONS");
                intent.putExtra(Intent.EXTRA_PACKAGE_NAME, getPackageName());
                startActivity(intent);
                return true;
            } catch (Exception e1) {
                try {
                    Intent fallbackIntent = new Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS");
                    startActivity(fallbackIntent);
                    return true;
                } catch (Exception e2) {
                    return false;
                }
            }
        }

        @JavascriptInterface
        public void openHealthConnectPlayStore() {
            try {
                Intent marketIntent = new Intent(
                        Intent.ACTION_VIEW,
                        Uri.parse("market://details?id=com.google.android.apps.healthdata")
                );
                marketIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(marketIntent);
            } catch (Exception e) {
                try {
                    Intent webIntent = new Intent(
                            Intent.ACTION_VIEW,
                            Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata")
                    );
                    webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(webIntent);
                } catch (Exception ignored) {
                }
            }
        }

        @JavascriptInterface
        public void openAppSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", getPackageName(), null);
                intent.setData(uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            } catch (Exception ignored) {
            }
        }
    }
}
