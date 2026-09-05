import { ErrorCodeType, ErrorCodes } from "../constants/error-codes.constants";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCodeType;
    public readonly details?: any;
    public readonly timestamp: string;

    constructor(
        message: string,
        statusCode: number = 500,
        code: ErrorCodeType = ErrorCodes.INTERNAL_ERROR,
        details?: any
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }
}
