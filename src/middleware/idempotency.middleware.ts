import { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../config/redis-cluster";
import { logger } from "../config/logger";

export class IdempotencyMiddleware {
    private static readonly TTL = 86400;
    private static readonly MAX_KEYS_PER_USER = 1000;

    static async process(req: Request, res: Response, next: NextFunction) {
        const idempotencyKey = req.headers["idempotency-key"] as string;
        if (!idempotencyKey) {
            return next();
        }

        const userId = (req as any).userId || "anonymous";
        const cacheKey = `idempotency:${userId}:${req.method}:${req.path}:${idempotencyKey}`;

        try {
            const redis = getRedisClient();
            const existing = await redis.get(cacheKey);
            
            if (existing) {
                const record = JSON.parse(existing);
                logger.info(`Idempotency hit: ${cacheKey}`);
                return res.status(record.statusCode).json(record.response);
            }

            const originalSend = res.json.bind(res);
            res.json = function(body: any) {
                const record = {
                    statusCode: res.statusCode,
                    response: body,
                    timestamp: Date.now()
                };
                redis.setex(cacheKey, IdempotencyMiddleware.TTL, JSON.stringify(record))
                    .catch(err => logger.error("Idempotency store error:", err));
                return originalSend(body);
            };

            next();
        } catch (error) {
            logger.error("Idempotency middleware error:", error);
            next();
        }
    }
}
