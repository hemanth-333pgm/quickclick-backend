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

    // ... (keep existing sendOTP, verifyOTP, refreshToken, logout)

    adminLogin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError("Email and password are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            console.log("🔄 Admin login request received for:", email);
            const result = await this.adminAuthService.loginWithPassword(email, password);
            console.log("✅ Admin login successful for:", email);
            res.json(SuccessResponse.success("Admin login successful", result));
        } catch (error) {
            console.error("❌ Admin login error:", error);
            next(error);
        }
    };

    // ... (keep createAdmin, changePassword)
}
