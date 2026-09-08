import { Request, Response, NextFunction } from "express";
import { AdminAuthService } from "../services/admin-auth.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class AdminAuthController {
    private adminAuthService: AdminAuthService;

    constructor() {
        this.adminAuthService = new AdminAuthService();
    }

    // Admin Login with Email & Password
    loginWithPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError("Email and password are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.adminAuthService.loginWithPassword(email, password);
            res.json(SuccessResponse.success("Admin login successful", result));
        } catch (error) {
            next(error);
        }
    };

    // Create Admin User
    createAdmin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password, mobile } = req.body;

            if (!name || !email || !password) {
                throw new AppError("Name, email and password are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.adminAuthService.createAdminUser({ name, email, password, mobile });
            res.status(201).json(SuccessResponse.success("Admin user created", result));
        } catch (error) {
            next(error);
        }
    };

    // Change Password
    changePassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { oldPassword, newPassword } = req.body;

            if (!oldPassword || !newPassword) {
                throw new AppError("Old and new password are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            await this.adminAuthService.changePassword(userId, oldPassword, newPassword);
            res.json(SuccessResponse.success("Password changed successfully", null));
        } catch (error) {
            next(error);
        }
    };
}
