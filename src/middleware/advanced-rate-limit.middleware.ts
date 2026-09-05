import { Request, Response, NextFunction } from "express";
import { cacheServiceEnhanced } from "../config/cache.service";
import { logger } from "../config/logger";

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
    skipFailedRequests?: boolean;
}

export const advancedRateLimit = (config: RateLimitConfig) => {
    const {
        windowMs = 60000,
        maxRequests = 100,
        keyPrefix = "rate-limit",
        skipFailedRequests = true,
    } = config;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ip = req.ip || req.connection.remoteAddress || "unknown";
            const path = req.path;
            const key = `${keyPrefix}:${ip}:${path}`;

            const current = await cacheServiceEnhanced.get<number>(key) || 0;

            if (current >= maxRequests) {
                const resetTime = new Date(Date.now() + windowMs);
                res.setHeader("X-RateLimit-Limit", maxRequests);
                res.setHeader("X-RateLimit-Remaining", 0);
                res.setHeader("X-RateLimit-Reset", resetTime.toISOString());

                return res.status(429).json({
                    success: false,
                    error: {
                        code: "RATE_LIMIT_EXCEEDED",
                        message: "Too many requests, please try again later",
                        resetAt: resetTime.toISOString(),
                    },
                });
            }

            await cacheServiceEnhanced.set(key, current + 1, {
                ttl: Math.ceil(windowMs / 1000),
                keyPrefix: "",
            });

            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - current - 1));

            next();
        } catch (error) {
            logger.error("Rate limit error:", error);
            next();
        }
    };
};
