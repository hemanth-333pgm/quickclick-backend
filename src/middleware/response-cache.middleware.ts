import { Request, Response, NextFunction } from "express";
import { cacheServiceEnhanced } from "../config/cache.service";
import { logger } from "../config/logger";

export const responseCacheMiddleware = (
    ttl: number = 300,
    keyPrefix: string = "response"
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }

        // Skip caching for authenticated requests
        if (req.headers.authorization) {
            return next();
        }

        const cacheKey = `${req.originalUrl || req.url}`;
        
        try {
            const cachedData = await cacheServiceEnhanced.get(cacheKey, {
                ttl,
                keyPrefix,
            });

            if (cachedData) {
                res.setHeader("X-Cache", "HIT");
                return res.json(cachedData);
            }

            // Store original send
            const originalJson = res.json.bind(res);
            
            res.json = function(body: any) {
                if (res.statusCode === 200) {
                    cacheServiceEnhanced.set(cacheKey, body, { ttl, keyPrefix })
                        .catch((error) => {
                            logger.error("Cache set error:", error);
                        });
                    res.setHeader("X-Cache", "MISS");
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            logger.error("Response cache error:", error);
            next();
        }
    };
};
