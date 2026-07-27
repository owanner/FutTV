class MemoryCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
    const interval = setInterval(() => this.cleanup(), 60_000);
    interval.unref();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    this.hits++;
    return entry.data;
  }

  set(key, data, ttlMs) {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
    this.misses++;
  }

  delete(key) {
    this.store.delete(key);
  }

  key(req) {
    const query = new URL(req.url, "http://localhost").searchParams.toString();
    const path = req.route ? req.baseUrl + req.route.path : req.originalUrl;
    return query ? `${path}?${query}` : path;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

module.exports = new MemoryCache();
