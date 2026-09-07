import Redis from "ioredis";
import { logger } from "./logger";

export class RedisClusterManager {
    private static instance: RedisClusterManager;
    private client: Redis | null = null;
    private readonly MAX_RETRIES = 5;
    private readonly RETRY_DELAY = 100;

    private constructor() {}

    static getInstance(): RedisClusterManager {
        if (!RedisClusterManager.instance) {
            RedisClusterManager.instance = new RedisClusterManager();
        }
        return RedisClusterManager.instance;
    }

    getClient(): Redis {
        if (!this.client) {
            this.client = new Redis({
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT || "6379"),
                password: process.env.REDIS_PASSWORD,
                retryStrategy: (times) => {
                    if (times > this.MAX_RETRIES) {
                        logger.error("Redis connection failed after max retries");
                        return null;
                    }
                    return Math.min(times * this.RETRY_DELAY, 2000);
                },
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
                connectTimeout: 10000,
                commandTimeout: 5000,
                keepAlive: 30000,
                maxLoadingRetryTime: 2000,
                reconnectOnError: (err) => {
                    const targetErrors = ["READONLY", "LOADING"];
                    return targetErrors.some(e => err.message.includes(e));
                }
            });

            this.client.on("connect", () => {
                logger.info("✅ Redis connected successfully");
            });

            this.client.on("error", (error) => {
                logger.error("❌ Redis error:", error);
            });

            this.client.on("close", () => {
                logger.warn("⚠️ Redis connection closed");
            });
        }
        return this.client;
    }

    async healthCheck(): Promise<boolean> {
        try {
            const client = this.getClient();
            await client.ping();
            return true;
        } catch {
            return false;
        }
    }
}

export const getRedisClient = () => RedisClusterManager.getInstance().getClient();
