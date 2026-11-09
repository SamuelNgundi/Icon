import type { IconPlayer } from '../data/icons';
import { getPlayerCardImageUrl, HIGH_PRIORITY_IMAGE_URLS } from './imageAssets';

export const IMAGE_CACHE_NAME = 'fc26-images-v1';

type PreloadPriority = 'high' | 'medium' | 'low';

type ImageTask = {
  url: string;
  priority: PreloadPriority;
};

const inFlight = new Set<string>();

function isConnectionConstrained(): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return Boolean(connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g');
}

function scheduleIdle(callback: () => void): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout: 1500 });
  }
  return globalThis.setTimeout(callback, 250);
}

async function cacheImage(url: string): Promise<boolean> {
  if (inFlight.has(url)) return false;
  inFlight.add(url);
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    if (await cache.match(url)) return true;
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) return false;
    await cache.put(url, response.clone());
    return true;
  } catch {
    return false;
  } finally {
    inFlight.delete(url);
  }
}

function getTasks(icons: IconPlayer[]): ImageTask[] {
  const playerUrls = [...new Set(icons.map((player) => getPlayerCardImageUrl(player.id)))];
  return [
    ...HIGH_PRIORITY_IMAGE_URLS.map((url) => ({ url, priority: 'high' as const })),
    ...playerUrls.map((url) => ({ url, priority: 'medium' as const })),
  ];
}

export function preloadImagesInBackground(icons: IconPlayer[]): () => void {
  if (!('caches' in window) || !navigator.onLine || isConnectionConstrained()) return () => undefined;

  let cancelled = false;
  const tasks = getTasks(icons);
  const queued = new Set<string>();
  const concurrency = 3;
  let nextIndex = 0;

  const runNext = async (): Promise<void> => {
    if (cancelled) return;
    const task = tasks[nextIndex];
    nextIndex += 1;
    if (!task) return;
    queued.add(task.url);
    await cacheImage(task.url);
    if (!cancelled) void runNext();
  };

  const start = () => {
    if (cancelled) return;
    for (let index = 0; index < concurrency; index += 1) void runNext();
  };

  const idleHandle = scheduleIdle(start);
  return () => {
    cancelled = true;
    queued.clear();
    if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
    else globalThis.clearTimeout(idleHandle);
  };
}
