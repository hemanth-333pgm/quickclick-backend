import { Request, Response, NextFunction } from "express";

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Simple rate limiting - pass through for now
    next();
};
