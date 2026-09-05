import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors/app-error";
import { ErrorCodes } from "../common/constants/error-codes.constants";

export const rbacMiddleware = (allowedRoles: readonly string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.userRole;

        if (!userRole) {
            throw new AppError(
                "Authentication required",
                401,
                ErrorCodes.AUTH_UNAUTHORIZED
            );
        }

        if (!allowedRoles.includes(userRole)) {
            throw new AppError(
                "Insufficient permissions",
                403,
                ErrorCodes.AUTH_FORBIDDEN
            );
        }

        next();
    };
};

export const Roles = {
    CUSTOMER: ["CUSTOMER"] as const,
    RETAILER: ["RETAILER"] as const,
    DELIVERY: ["DELIVERY"] as const,
    ADMIN: ["ADMIN"] as const,
    SUPER_ADMIN: ["SUPER_ADMIN"] as const,
    ANY_ADMIN: ["ADMIN", "SUPER_ADMIN"] as const,
    ANY_AUTHENTICATED: ["CUSTOMER", "RETAILER", "DELIVERY", "ADMIN", "SUPER_ADMIN"] as const,
    RETAILER_AND_ADMIN: ["RETAILER", "ADMIN", "SUPER_ADMIN"] as const,
    DELIVERY_AND_ADMIN: ["DELIVERY", "ADMIN", "SUPER_ADMIN"] as const
} as const;

export type RoleType = keyof typeof Roles;
