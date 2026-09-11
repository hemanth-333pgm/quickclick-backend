import { AuthRepository } from "../repositories/auth.repository";
import { TokenService } from "./token.service";
import { OTP } from "../models/otp.model";
import { User } from "../../users/models/user.model";
import { config } from "../../../config/env";
import { logger } from "../../../config/logger";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import * as bcrypt from "bcryptjs";

export class AuthService {
    private authRepository: AuthRepository;
    private tokenService: TokenService;

    constructor() {
        this.authRepository = new AuthRepository();
        this.tokenService = new TokenService();
    }

    async sendOTP(mobile: string, purpose: string = "LOGIN"): Promise<{ challengeId: string }> {
        const otp = this.generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + config.otp.ttlSeconds);

        await OTP.deleteMany({ mobile, purpose, verifiedAt: { $exists: false } });

        const otpRecord = await OTP.create({
            mobile,
            purpose,
            otpHash,
            expiresAt,
            attempts: 0,
        });

        logger.info(`📱 OTP for ${mobile}: ${otp}`);
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
        const otpRecord = await OTP.findOne({
            mobile,
            purpose,
            verifiedAt: { $exists: false }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            throw new AppError("OTP not found or expired", 400, ErrorCodes.AUTH_OTP_INVALID);
        }

        if (new Date() > otpRecord.expiresAt) {
            throw new AppError("OTP has expired", 400, ErrorCodes.AUTH_OTP_EXPIRED);
        }

        if (otpRecord.attempts >= config.otp.maxAttempts) {
            throw new AppError("Too many attempts", 429, ErrorCodes.AUTH_OTP_RATE_LIMITED);
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new AppError("Invalid OTP", 400, ErrorCodes.AUTH_OTP_INVALID);
        }

        otpRecord.verifiedAt = new Date();
        await otpRecord.save();

        let user = await User.findOne({ mobile });
        if (!user) {
            user = await User.create({
                name: `Customer ${mobile.slice(-4)}`,
                mobile,
                role: "CUSTOMER",
                status: "ACTIVE",
                isVerified: true,
            });
        }

        if (user.status === "SUSPENDED") {
            throw new AppError("Account suspended", 403, ErrorCodes.USER_SUSPENDED);
        }

        user.lastLoginAt = new Date();
        await user.save();

        const accessToken = this.tokenService.generateAccessToken(user);
        const refreshToken = this.tokenService.generateRefreshToken(user);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                status: user.status,
            },
        };
    }

    async refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const payload = this.tokenService.verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.id);
        if (!user) {
            throw new AppError("User not found", 404, ErrorCodes.USER_NOT_FOUND);
        }

        const accessToken = this.tokenService.generateAccessToken(user);
        const newRefreshToken = this.tokenService.generateRefreshToken(user);

        return { accessToken, refreshToken: newRefreshToken };
    }

    async logout(accessToken: string): Promise<void> {
        // Token blacklisting can be implemented here
        logger.info("User logged out");
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
