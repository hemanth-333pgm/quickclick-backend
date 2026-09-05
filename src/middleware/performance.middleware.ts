import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const performanceMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = process.hrtime();
        const startMemory = process.memoryUsage();

        // Store original end
        const originalEnd = res.end;

        // Override end method
        res.end = function(this: Response, chunk: any, encoding: any, callback: any) {
            const diff = process.hrtime(start);
            const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;

            const endMemory = process.memoryUsage();
            const memoryDiff = {
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                external: endMemory.external - startMemory.external,
            };

            if (responseTime > 1000) {
                logger.warn({
                    type: "SLOW_REQUEST",
                    method: req.method,
                    url: req.url,
                    responseTime: `${responseTime.toFixed(2)}ms`,
                    memoryDiff: {
                        heapUsed: `${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                        heapTotal: `${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    },
                    statusCode: res.statusCode,
                });
            }

            res.setHeader("X-Response-Time", `${responseTime.toFixed(2)}ms`);

            // Call original end
            if (typeof encoding === "function") {
                return originalEnd.call(this, chunk, encoding);
            }
            return originalEnd.call(this, chunk, encoding, callback);
        } as any;

        next();
    };
};
