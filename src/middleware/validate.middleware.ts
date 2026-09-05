import { Request, Response, NextFunction } from "express";
import { AnySchema } from "joi";
import { AppError } from "../common/errors/app-error";
import { ErrorCodes } from "../common/constants/error-codes.constants";

export const validate = (schema: AnySchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!schema) {
            return next();
        }

        const { error, value } = schema.validate(
            { ...req.body, ...req.query, ...req.params },
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

        if (error) {
            const details = error.details.map((d) => ({
                field: d.path.join("."),
                message: d.message
            }));

            throw new AppError(
                "Validation failed",
                400,
                ErrorCodes.VALIDATION_ERROR,
                details
            );
        }

        req.body = value;
        next();
    };
};
