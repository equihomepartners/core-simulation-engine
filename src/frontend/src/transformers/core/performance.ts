/**
 * Performance optimization utilities for the API transformation layer
 */

/**
 * Cache interface for storing transformed data
 */
export interface TransformationCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
}

/**
 * Simple in-memory transformation cache implementation
 */
export class MemoryTransformationCache<K, V> implements TransformationCache<K, V> {
  private cache = new Map<string, { value: V, timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  /**
   * Create a new memory transformation cache
   * @param maxSize Maximum number of items to store in the cache
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  get(key: K): V | undefined {
    const keyString = this.getKeyString(key);
    const item = this.cache.get(keyString);
    
    // Return undefined if item not found or expired
    if (!item || this.isExpired(item.timestamp)) {
      if (item) {
        this.cache.delete(keyString);
      }
      return undefined;
    }
    
    return item.value;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   */
  set(key: K, value: V): void {
    // Ensure cache doesn't exceed max size by removing oldest items
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }
    
    // Add new item to cache
    this.cache.set(this.getKeyString(key), {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Check if a key exists in the cache (and is not expired)
   * @param key Cache key
   * @returns Whether the key exists in the cache
   */
  has(key: K): boolean {
    const keyString = this.getKeyString(key);
    const item = this.cache.get(keyString);
    
    if (!item || this.isExpired(item.timestamp)) {
      if (item) {
        this.cache.delete(keyString);
      }
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   * @returns Whether the key was deleted
   */
  delete(key: K): boolean {
    return this.cache.delete(this.getKeyString(key));
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if a timestamp is expired
   * @param timestamp Timestamp to check
   * @returns Whether the timestamp is expired
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttl;
  }

  /**
   * Convert a key to a string for use in the cache
   * @param key Key to convert
   * @returns String representation of the key
   */
  private getKeyString(key: K): string {
    if (typeof key === 'string') {
      return key;
    } else if (typeof key === 'number') {
      return key.toString();
    } else {
      return JSON.stringify(key);
    }
  }
}

/**
 * Create a cached version of a function
 * @param fn Function to cache
 * @param cache Cache to use
 * @param keyFn Function to derive cache key from arguments
 * @returns Cached function
 */
export function withCache<T extends (...args: any[]) => any>(
  fn: T,
  cache: TransformationCache<string, ReturnType<T>> = new MemoryTransformationCache(),
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Create a memoized version of a function
 * @param fn Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): T {
  const cache = new MemoryTransformationCache<string, ReturnType<T>>();
  return withCache(fn, cache);
}

/**
 * Cache for transformed metrics data
 */
export const metricsCache = new MemoryTransformationCache<string, any>();

/**
 * Cache for transformed cashflow data
 */
export const cashflowCache = new MemoryTransformationCache<string, any>();

/**
 * Cache for transformed portfolio data
 */
export const portfolioCache = new MemoryTransformationCache<string, any>();

/**
 * Cache for transformed Monte Carlo data
 */
export const monteCarloCache = new MemoryTransformationCache<string, any>();

/**
 * Cache for transformed GP Entity data
 */
export const gpEntityCache = new MemoryTransformationCache<string, any>();

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  metricsCache.clear();
  cashflowCache.clear();
  portfolioCache.clear();
  monteCarloCache.clear();
  gpEntityCache.clear();
} 