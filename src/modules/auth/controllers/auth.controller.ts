import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AdminAuthService } from "../services/admin-auth.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class AuthController {
    private authService: AuthService;
    private adminAuthService: AdminAuthService;

    constructor() {
        this.authService = new AuthService();
        this.adminAuthService = new AdminAuthService();
    }

    // ==================== OTP FLOW ====================

    sendOTP = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mobile, purpose = "LOGIN", email, name } = req.body;
            
            if (!mobile) {
                throw new AppError("Mobile number is required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.authService.sendOTP(mobile, purpose, email, name);
            res.status(200).json(SuccessResponse.success("OTP sent successfully", result));
        } catch (error) {
            next(error);
        }
    };

    verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mobile, otp, purpose = "LOGIN", deviceToken } = req.body;
            
            if (!mobile || !otp) {
                throw new AppError("Mobile and OTP are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.authService.verifyOTP(mobile, otp, purpose, deviceToken);
            res.status(200).json(SuccessResponse.success("OTP verified successfully", result));
        } catch (error) {
            next(error);
        }
    };

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                throw new AppError("Refresh token is required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.authService.refreshToken(refreshToken);
            res.status(200).json(SuccessResponse.success("Token refreshed successfully", result));
        } catch (error) {
            next(error);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.replace("Bearer ", "");
            
            if (token) {
                await this.authService.logout(token);
            }
            
            res.status(200).json(SuccessResponse.success("Logged out successfully", null));
        } catch (error) {
            next(error);
        }
    };

    // ==================== ADMIN AUTH ====================

    adminLogin = async (req: Request, res: Response, next: NextFunction) => {
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

