// utils/cache.ts
const CACHE_PREFIX = "business_reviews_";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function setCache<T>(key: string, data: T) {
  const item: CacheItem<T> = { data, timestamp: Date.now() };
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
}

export function getCache<T>(key: string): T | null {
  const raw = localStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;

  const item: CacheItem<T> = JSON.parse(raw);
  if (Date.now() - item.timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
  return item.data;
}

export function clearCache(key: string) {
  localStorage.removeItem(CACHE_PREFIX + key);
}
