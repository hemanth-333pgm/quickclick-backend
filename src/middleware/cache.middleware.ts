import { Request, Response, NextFunction } from "express";
import { cacheService } from "../config/redis";

export const cacheMiddleware = (ttlSeconds: number = 3600) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip caching for non-GET requests or authenticated requests
        if (req.method !== "GET" || req.headers.authorization) {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;
        
        try {
            const cachedData = await cacheService.get(key);
            
            if (cachedData) {
                return res.json(cachedData);
            }

            // Store original send function
            const originalSend = res.json.bind(res);
            
            // Override json method to cache response
            res.json = function(body: any) {
                // Cache successful responses
                if (res.statusCode === 200) {
                    cacheService.set(key, body, ttlSeconds).catch((error) => {
                        console.error("Cache set error:", error);
                    });
                }
                return originalSend(body);
            };

            next();
        } catch (error) {
            console.error("Cache middleware error:", error);
            next();
        }
    };
};

export const invalidateCache = async (pattern: string): Promise<void> => {
    await cacheService.deletePattern(`cache:${pattern}`);
};
