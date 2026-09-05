import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { logger } from "../../../config/logger";

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    sendOTP = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mobile, purpose = "LOGIN" } = req.body;
            const result = await this.authService.sendOTP(mobile, purpose);
            res.status(200).json(SuccessResponse.success("OTP sent successfully", result));
        } catch (error) {
            next(error);
        }
    };

    verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mobile, otp, purpose = "LOGIN", deviceToken } = req.body;
            const result = await this.authService.verifyOTP(mobile, otp, purpose, deviceToken);
            res.status(200).json(SuccessResponse.success("OTP verified successfully", result));
        } catch (error) {
            next(error);
        }
    };

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body;
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
}
