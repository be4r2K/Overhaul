export interface AppVersionInfo {
  currentVersion: string;
  currentBuild: number;
  latestVersion?: string;
  latestBuild?: number;
  updateAvailable: boolean;
  releaseUrl?: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

export const CURRENT_APP_VERSION = '1.0.55';
export const CURRENT_BUILD_NUMBER = 155;

export async function checkForAppUpdates(): Promise<AppVersionInfo> {
  try {
    const response = await fetch(
      'https://api.github.com/repos/christiansalameh7/overhaul-health-sports/releases/latest',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      // Fallback check against tags
      const tagsResp = await fetch(
        'https://api.github.com/repos/christiansalameh7/overhaul-health-sports/tags',
        {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }
      );
      if (tagsResp.ok) {
        const tags = await tagsResp.json();
        if (Array.isArray(tags) && tags.length > 0) {
          const latestTag = String(tags[0].name || '').replace(/^v/, '');
          return {
            currentVersion: CURRENT_APP_VERSION,
            currentBuild: CURRENT_BUILD_NUMBER,
            latestVersion: latestTag,
            updateAvailable: isVersionNewer(latestTag, CURRENT_APP_VERSION),
            releaseUrl: 'https://github.com/christiansalameh7/overhaul-health-sports/releases',
            downloadUrl: 'https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml',
          };
        }
      }

      return {
        currentVersion: CURRENT_APP_VERSION,
        currentBuild: CURRENT_BUILD_NUMBER,
        updateAvailable: false,
        releaseUrl: 'https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml',
      };
    }

    const release = await response.json();
    const tag = String(release.tag_name || release.name || '').replace(/^v/, '');

    const apkAsset = Array.isArray(release.assets)
      ? release.assets.find((a: any) => a.name?.endsWith('.apk'))
      : null;

    const downloadUrl =
      apkAsset?.browser_download_url ||
      'https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml';

    const isNewer = isVersionNewer(tag, CURRENT_APP_VERSION);

    return {
      currentVersion: CURRENT_APP_VERSION,
      currentBuild: CURRENT_BUILD_NUMBER,
      latestVersion: tag || 'Latest',
      updateAvailable: isNewer,
      releaseUrl: release.html_url || 'https://github.com/christiansalameh7/overhaul-health-sports/releases',
      downloadUrl,
      releaseNotes: release.body || 'Continuous athletic and biomechanical improvements.',
    };
  } catch (err) {
    console.warn('App update check skipped / offline:', err);
    return {
      currentVersion: CURRENT_APP_VERSION,
      currentBuild: CURRENT_BUILD_NUMBER,
      updateAvailable: false,
      releaseUrl: 'https://github.com/christiansalameh7/overhaul-health-sports/actions/workflows/android-build.yml',
    };
  }
}

export function isVersionNewer(remote: string, current: string): boolean {
  if (!remote || !current) return false;
  const parse = (v: string) =>
    v
      .split('.')
      .map((p) => parseInt(p.replace(/\D/g, ''), 10) || 0);

  const r = parse(remote);
  const c = parse(current);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rPart = r[i] ?? 0;
    const cPart = c[i] ?? 0;
    if (rPart > cPart) return true;
    if (rPart < cPart) return false;
  }
  return false;
}
