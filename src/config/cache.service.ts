import { cacheService } from "./redis";
import { logger } from "./logger";

interface CacheOptions {
    ttl: number;
    keyPrefix?: string;
    compress?: boolean;
}

export class CacheService {
    private static instance: CacheService;
    private localCache: Map<string, { data: any; expiry: number }> = new Map();

    private constructor() {}

    static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
        const fullKey = options?.keyPrefix ? `${options.keyPrefix}:${key}` : key;

        const localData = this.getFromLocalCache(fullKey);
        if (localData) return localData;

        const redisData = await cacheService.get<T>(fullKey);
        if (redisData) {
            this.setInLocalCache(fullKey, redisData, 60);
            return redisData;
        }

        return null;
    }

    async set(key: string, value: any, options?: CacheOptions): Promise<boolean> {
        const fullKey = options?.keyPrefix ? `${options.keyPrefix}:${key}` : key;
        const ttl = options?.ttl || 3600;

        this.setInLocalCache(fullKey, value, Math.min(ttl, 60));
        return await cacheService.set(fullKey, value, ttl);
    }

    async invalidate(key: string, options?: CacheOptions): Promise<void> {
        const fullKey = options?.keyPrefix ? `${options.keyPrefix}:${key}` : key;
        this.localCache.delete(fullKey);
        await cacheService.delete(fullKey);
    }

    async invalidatePattern(pattern: string, options?: CacheOptions): Promise<void> {
        const fullPattern = options?.keyPrefix ? `${options.keyPrefix}:${pattern}` : pattern;
        for (const key of this.localCache.keys()) {
            if (key.includes(fullPattern)) {
                this.localCache.delete(key);
            }
        }
        await cacheService.deletePattern(fullPattern);
    }

    private getFromLocalCache(key: string): any | null {
        const cached = this.localCache.get(key);
        if (!cached) return null;
        if (Date.now() > cached.expiry) {
            this.localCache.delete(key);
            return null;
        }
        return cached.data;
    }

    private setInLocalCache(key: string, data: any, ttlSeconds: number): void {
        this.localCache.set(key, {
            data,
            expiry: Date.now() + ttlSeconds * 1000,
        });
    }
}

export const cacheServiceEnhanced = CacheService.getInstance();
