import { AuthRepository } from "../repositories/auth.repository";
import { UserService } from "../../users/services/user.service";
import { TokenService } from "./token.service";
import { config } from "../../../config/env";
import { logger } from "../../../config/logger";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import * as bcrypt from "bcryptjs";

export class AuthService {
    private authRepository: AuthRepository;
    private userService: UserService;
    private tokenService: TokenService;

    constructor() {
        this.authRepository = new AuthRepository();
        this.userService = new UserService();
        this.tokenService = new TokenService();
    }

    async sendOTP(mobile: string, purpose: string = "LOGIN"): Promise<{ challengeId: string }> {
        const otp = this.generateOTP();
        logger.info(`OTP generated for ${mobile}: ${otp}`);
        const otpRecord = await this.authRepository.createOTP(mobile, purpose, otp);
        return { challengeId: otpRecord._id.toString() };
    }

    async verifyOTP(
        mobile: string,
        otp: string,
        purpose: string = "LOGIN",
        deviceToken?: string
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }> {
        await this.authRepository.verifyOTP(mobile, purpose, otp);
        const user = await this.authRepository.findOrCreateCustomer(mobile);
        await this.authRepository.validateUserStatus(user);
        await this.authRepository.updateLastLogin(user._id.toString());

        // Generate REAL JWT tokens
        const accessToken = this.tokenService.generateAccessToken(user);
        const refreshToken = this.tokenService.generateRefreshToken(user);

        if (deviceToken) {
            await this.userService.registerDevice(user._id.toString(), deviceToken);
        }

        const userData = this.userService.sanitizeUser(user);

        return {
            accessToken,
            refreshToken,
            user: userData,
        };
    }

    async refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const payload = this.tokenService.verifyRefreshToken(refreshToken);
        const user = await this.authRepository.findUserByMobile(payload.mobile);
        if (!user) {
            throw new AppError("User not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }
        const newAccessToken = this.tokenService.generateAccessToken(user);
        const newRefreshToken = this.tokenService.generateRefreshToken(user);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout(accessToken: string): Promise<void> {
        // Token blacklisting logic
    }

    private generateOTP(): string {
        const length = config.otp.length || 6;
        const digits = "0123456789";
        let otp = "";
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }
}
