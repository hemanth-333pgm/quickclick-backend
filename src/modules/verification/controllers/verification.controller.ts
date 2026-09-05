import { Request, Response, NextFunction } from "express";
import { VerificationService } from "../services/verification.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class VerificationController {
    private verificationService: VerificationService;

    constructor() {
        this.verificationService = new VerificationService();
    }

    submitDocuments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { userType, documents } = req.body;
            const result = await this.verificationService.submitDocuments(
                userId,
                userType,
                documents
            );

            res.status(201).json(SuccessResponse.success("Documents submitted successfully", result));
        } catch (error) {
            next(error);
        }
    };

    verifyDocuments = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { id } = req.params;
            const { decisions, remarks } = req.body;

            const result = await this.verificationService.verifyDocuments(
                id,
                adminId,
                decisions,
                remarks
            );

            res.json(SuccessResponse.success("Documents verified successfully", result));
        } catch (error) {
            next(error);
        }
    };

    getPendingVerifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userType } = req.query;
            const result = await this.verificationService.getPendingVerifications(
                userType as "RETAILER" | "DELIVERY"
            );

            res.json(SuccessResponse.success("Pending verifications retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    getVerificationDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.verificationService.getVerificationDetails(id);

            if (!result) {
                throw new AppError("Document record not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }

            res.json(SuccessResponse.success("Verification details retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    getApprovalDashboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const result = await this.verificationService.getApprovalDashboard(adminId);
            res.json(SuccessResponse.success("Approval dashboard retrieved", result));
        } catch (error) {
            next(error);
        }
    };
}
