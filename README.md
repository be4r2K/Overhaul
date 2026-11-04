# Overhaul Health & Sports

[![Build Android APK](https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml/badge.svg?branch=main)](https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml)
[![Version](https://img.shields.io/badge/version-1.0.55-blue.svg)](https://github.com/christiansalameh7/overhaul-health-sports)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-cyan.svg)](https://capacitorjs.com)

> **Build Status**: The badge above indicates the live status of the **Build Android APK** workflow. It automatically updates on every push to the `main` branch via GitHub Actions.

**Overhaul** is an elite athletic conditioning, biomechanics analysis, and physique transformation application powered by Google Gemini AI and built with Capacitor, React, TypeScript, Tailwind CSS, and Android native toolchains.

---

## Key Features

- **Gemini AI Coach & Multi-Turn Chatbot**:
  - Direct integration with Google Gemini models:
    - `gemini-3.8-flash` (Balanced sports science coach, low latency)
    - `gemini-3.1-flash-lite` (Ultra-fast queries and adjustments)
    - `gemini-4-argon` (Deep biomechanical analysis and complex split restructuring)
  - Interactive Workout Proposals: Seamlessly accepts and syncs AI-suggested workout changes (e.g. skip leg day for soccer, condense to 2-day split, swap exercises for injuries).
  - Conversation history persistence and continuous multi-turn coaching.

- **Biomechanical Program Analysis**:
  - Analyzes raw workout notes from Apple Notes, Google Keep, or clipboard.
  - Scores programs on balance, volume stimulus, and exercise selection.
  - Automatically identifies neglected muscle groups and provides drop-in joint-friendly substitutions.

- **AI Body Vision & Progression**:
  - Vision scan analysis comparing check-in photos across weeks.
  - V-taper frame metrics, posture assessment, and genetic potential forecasting.

- **Continuous In-Place Android Updates**:
  - **Zero-Failure In-Place Updates**: Fixed deterministic keystore signing (`debug.keystore`) ensures the app can always be updated over existing installations without Android OS throwing `INSTALL_FAILED_UPDATE_INCOMPATIBLE`.
  - **Dynamic Build Versioning**: Auto-increments `versionCode` via `GITHUB_RUN_NUMBER` so older versions immediately detect and accept newer builds without requiring uninstallation.
  - **In-App Update Recognition**: Integrated version checker verifies newer releases directly from GitHub and notifies users when updates are ready.

---

## GitHub Actions Android CI/CD Pipeline

The `.github/workflows/android-build.yml` workflow compiles, packages, and signs Android APKs automatically on push to `main` or manual trigger:

1. **Bun Fast Web Build**: Compiles web bundle with strict TypeScript validation (`tsc && vite build`).
2. **Capacitor Asset Synchronization**: Syncs production web assets into the Android native wrapper.
3. **Deterministic Keystore Signing**: Signs the debug APK using a persistent, version-controlled debug certificate.
4. **Gradle Compilation & Environment Diagnostics**:
   ```bash
   ./gradlew assembleDebug --no-daemon --stacktrace --full-stacktrace --info -x test -x lint
   ```
5. **Artifact Upload**: Publishes the resulting `app-debug.apk` directly to GitHub Actions build artifacts.

### Build Status Badge Syntax & Automatic Updates

#### Option A: Native GitHub Actions Badge (Recommended)
```markdown
[![Build Android APK](https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml/badge.svg?branch=main)](https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml)
```

#### Option B: Shields.io Badge
```markdown
[![Build Android APK](https://img.shields.io/github/actions/workflow/status/christiansalameh7/overhaul-health-sports/android-build.yml?branch=main&label=Build%20Android%20APK&logo=github)](https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml)
```

**How It Automatically Updates on Every Push to `main`**:
- **Automatic Event Triggering**: The `.github/workflows/android-build.yml` workflow is configured with `on: push: branches: [ main ]`. Every git push or merged pull request to the `main` branch immediately spawns a new workflow run.
- **Dynamic Branch Pinning (`?branch=main`)**: Appending `?branch=main` instructs GitHub to exclusively evaluate the latest workflow conclusion for `main`, preventing experimental PRs or broken feature branches from turning your badge red.
- **Automatic SVG Re-rendering**: When the GitHub Actions run completes (status changes from `in-progress` to `success` or `failure`), the badge endpoint automatically serves the updated status SVG. GitHub's proxy CDN (`camo.githubusercontent.com`) maintains a short 5-minute TTL (`max-age=300`), refreshing automatically without any manual intervention.

---

## Local Development & Setup

### Prerequisites
- Node.js 20+ or Bun
- JDK 17
- Android Studio / Android SDK 34+

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/christiansalameh7/overhaul-health-sports.git
cd overhaul-health-sports

# Install dependencies
bun install
# or npm install

# Start full-stack development server (Express + Vite)
bun run dev
# or npm run dev
```

### Building the Android APK Locally

```bash
# Build web bundle
bun run build

# Sync assets to Capacitor
bunx @capacitor/cli sync android

# Build debug APK
cd android
./gradlew assembleDebug --stacktrace --full-stacktrace
```

The compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Android Signing Configuration

The project is configured in `android/app/build.gradle` to support both seamless continuous updates and production release signing:

- **Debug Builds**: Uses `android/app/debug.keystore` with standard credentials (`android` / `androiddebugkey`). Ensures consistent signatures across all CI/CD runs.
- **Release Builds**: Reads optional GitHub Secrets (`KEYSTORE_FILE`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) and safely falls back to debug signing if secrets are not configured, preventing unexpected build failures.
