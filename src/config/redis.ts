import Redis from "ioredis";
import { config } from "./env";
import { logger } from "./logger";

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
    if (redisClient) return redisClient;
    
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
        });

        redisClient.on("connect", () => {
            logger.info("🔴 Redis connected successfully");
        });

        redisClient.on("error", (error) => {
            logger.error("🔴 Redis error:", error);
        });

        redisClient.on("close", () => {
            logger.warn("🔴 Redis connection closed");
        });

        return redisClient;
    } catch (error) {
        logger.error("🔴 Failed to connect to Redis:", error);
        return null;
    }
};

export const cacheService = {
    async get<T = any>(key: string): Promise<T | null> {
        const client = getRedisClient();
        if (!client) return null;
        
        try {
            const data = await client.get(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    },

    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
        const client = getRedisClient();
        if (!client) return false;
        
        try {
            const serialized = JSON.stringify(value);
            await client.set(key, serialized, "EX", ttlSeconds);
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    },

    async delete(key: string): Promise<boolean> {
        const client = getRedisClient();
        if (!client) return false;
        
        try {
            await client.del(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    },

    async deletePattern(pattern: string): Promise<boolean> {
        const client = getRedisClient();
        if (!client) return false;
        
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
            return true;
        } catch (error) {
            logger.error(`Cache delete pattern error for ${pattern}:`, error);
            return false;
        }
    },

    async exists(key: string): Promise<boolean> {
        const client = getRedisClient();
        if (!client) return false;
        
        try {
            const result = await client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }
};
