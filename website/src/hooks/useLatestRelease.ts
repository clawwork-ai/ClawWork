import { useState, useEffect } from 'react';

export const REPO = 'clawwork-ai/clawwork';

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface ReleaseResponse {
  tag_name?: string;
  assets?: ReleaseAsset[];
}

interface RepoResponse {
  stargazers_count?: number;
}

interface RepoInfo {
  version: string | null;
  macARM: string | null;
  macIntel: string | null;
  windows: string | null;
  linux: string | null;
  stars: number | null;
}

const CACHE_KEY = 'clawwork:repo-info';
const CACHE_TTL = 5 * 60 * 1000;

function matchAsset(assets: ReleaseAsset[], pattern: RegExp): string | null {
  return assets.find((a) => pattern.test(a.name))?.browser_download_url ?? null;
}

function readCache(): RepoInfo | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: RepoInfo; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: RepoInfo) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

let pending: Promise<RepoInfo> | null = null;

function fetchRepoInfo(): Promise<RepoInfo> {
  if (pending) return pending;
  pending = Promise.all([
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => (r.ok ? (r.json() as Promise<ReleaseResponse>) : null))
      .catch(() => null),
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((r) => (r.ok ? (r.json() as Promise<RepoResponse>) : null))
      .catch(() => null),
  ]).then(([release, repo]) => {
    const assets = release?.assets ?? [];
    const data: RepoInfo = {
      version: release?.tag_name ?? null,
      macARM: matchAsset(assets, /mac-arm64\.dmg$/),
      macIntel: matchAsset(assets, /mac-x64\.dmg$/),
      windows: matchAsset(assets, /win-x64\.(exe|nsis)$/),
      linux: matchAsset(assets, /linux-x64\.AppImage$/),
      stars: repo?.stargazers_count ?? null,
    };
    writeCache(data);
    return data;
  });
  return pending;
}

export function useRepoInfo(): RepoInfo | null {
  const [info, setInfo] = useState<RepoInfo | null>(readCache);

  useEffect(() => {
    if (info) return;
    let cancelled = false;
    fetchRepoInfo().then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, [info]);

  return info;
}

type Platform = 'mac-arm' | 'mac-intel' | 'win' | 'linux';

export function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/Mac/i.test(ua)) {
    const uad = (navigator as Navigator & { userAgentData?: { architecture?: string } }).userAgentData;
    if (uad?.architecture === 'x86') return 'mac-intel';
    if (/Intel/.test(ua)) return 'mac-intel';
    return 'mac-arm';
  }
  if (/Win/i.test(ua)) return 'win';
  if (/Linux/i.test(ua)) return 'linux';
  return null;
}
