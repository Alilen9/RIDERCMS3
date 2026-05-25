interface CacheEntry {
  data: unknown;
  etag?: string;
  cachedAt: number;
}

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL = 500;

function key(method: string | undefined, url: string | undefined): string {
  return `${(method || 'GET').toLowerCase()}:${url || ''}`;
}

export function get(method: string | undefined, url: string | undefined, ttl = DEFAULT_TTL): { data: unknown; etag?: string } | undefined {
  const entry = store.get(key(method, url));
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > ttl) {
    store.delete(key(method, url));
    return undefined;
  }
  return { data: entry.data, etag: entry.etag };
}

export function set(method: string | undefined, url: string | undefined, data: unknown, etag?: string): void {
  store.set(key(method, url), { data, etag, cachedAt: Date.now() });
}

export function getEntry(method: string | undefined, url: string | undefined): CacheEntry | undefined {
  return store.get(key(method, url));
}
