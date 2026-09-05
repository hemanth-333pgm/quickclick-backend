import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors/app-error";
import { ErrorCodes } from "../common/constants/error-codes.constants";

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("❌ Error:", err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            error: {
                code: ErrorCodes.VALIDATION_ERROR,
                message: err.message,
                details: (err as any).errors,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
        return res.status(409).json({
            success: false,
            error: {
                code: "DUPLICATE_KEY",
                message: "Record already exists",
                details: (err as any).keyValue,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message,
            timestamp: new Date().toISOString()
        }
    });
};
