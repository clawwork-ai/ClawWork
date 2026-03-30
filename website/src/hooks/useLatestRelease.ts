import { useState, useEffect } from 'react';

const REPO = 'clawwork-ai/clawwork';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface ReleaseInfo {
  version: string;
  macARM: string | null;
  macIntel: string | null;
  windows: string | null;
  linux: string | null;
}

function matchAsset(assets: ReleaseAsset[], pattern: RegExp): string | null {
  return assets.find((a) => pattern.test(a.name))?.browser_download_url ?? null;
}

export function useLatestRelease() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => r.json())
      .then((d: { tag_name?: string; assets?: ReleaseAsset[] }) => {
        if (!d.tag_name) return;
        const assets = d.assets ?? [];
        setRelease({
          version: d.tag_name,
          macARM: matchAsset(assets, /mac-arm64\.dmg$/),
          macIntel: matchAsset(assets, /mac-x64\.dmg$/),
          windows: matchAsset(assets, /win-x64\.(exe|nsis)$/),
          linux: matchAsset(assets, /linux-x64\.AppImage$/),
        });
      })
      .catch(() => {});
  }, []);

  return release;
}

export type Platform = 'mac-arm' | 'mac-intel' | 'win' | 'linux';

export function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/Mac/i.test(ua)) {
    const uad = (navigator as Navigator & { userAgentData?: { architecture?: string } }).userAgentData;
    if (uad?.architecture === 'x86') return 'mac-intel';
    return 'mac-arm';
  }
  if (/Win/i.test(ua)) return 'win';
  if (/Linux/i.test(ua)) return 'linux';
  return null;
}
