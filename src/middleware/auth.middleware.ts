import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { AppError } from "../common/errors/app-error";
import { ErrorCodes } from "../common/constants/error-codes.constants";
import { User } from "../modules/users/models/user.model";
import { UserStatus } from "../common/constants/status.constants";

declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
            userRole?: string;
            userData?: any;
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            throw new AppError(
                "Authentication required",
                401,
                ErrorCodes.AUTH_UNAUTHORIZED
            );
        }

        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
            
            const user = await User.findById(decoded.id).lean();
            
            if (!user) {
                throw new AppError("User not found", 404, ErrorCodes.USER_NOT_FOUND);
            }

            if (user.status === UserStatus.SUSPENDED) {
                throw new AppError("Account suspended", 403, ErrorCodes.USER_SUSPENDED);
            }

            req.user = user;
            req.userId = user._id.toString();
            req.userRole = user.role;
            req.userData = user;

            next();
        } catch (jwtError) {
            if (jwtError instanceof jwt.JsonWebTokenError) {
                throw new AppError("Invalid token", 401, ErrorCodes.AUTH_TOKEN_INVALID);
            }
            if (jwtError instanceof jwt.TokenExpiredError) {
                throw new AppError("Token expired", 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
            }
            throw jwtError;
        }
    } catch (error) {
        next(error);
    }
};
