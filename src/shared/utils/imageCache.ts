import type { NormalizedImage } from "../../modules/Explore/types";

interface CacheEntry {
  data: NormalizedImage[];
  timestamp: number;
  ttl: number; // milliseconds
}

class ImageCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private defaultTTL: number = 30 * 60 * 1000) {
    // 30 minutes default
    this.startCleanup();
  }

  /**
   * Generate cache key from query and page
   */
  private generateKey(query: string, page: number = 1, provider?: string): string {
    return `${provider || 'all'}:${query}:${page}`;
  }

  /**
   * Get cached images if not expired
   */
  get(query: string, page: number = 1, provider?: string): NormalizedImage[] | null {
    const key = this.generateKey(query, page, provider);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached images
   */
  set(
    query: string,
    images: NormalizedImage[],
    page: number = 1,
    provider?: string,
    ttl: number = this.defaultTTL
  ): void {
    const key = this.generateKey(query, page, provider);
    this.cache.set(key, {
      data: images,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache for specific query
   */
  clear(query?: string, provider?: string): void {
    if (!query) {
      this.cache.clear();
      return;
    }

    // Clear all entries matching query (any page)
    for (const key of this.cache.keys()) {
      if (provider) {
        if (key.startsWith(`${provider}:${query}:`)) {
          this.cache.delete(key);
        }
      } else {
        if (key.includes(`:${query}:`)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.debug(`[ImageCache] Cleaned up ${cleaned} expired entries`);
      }
    }, 5 * 60 * 1000); // Run cleanup every 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const imageCache = new ImageCache();
