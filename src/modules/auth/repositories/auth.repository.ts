import { OTP } from "../models/otp.model";
import { User } from "../../users/models/user.model";
import { UserStatus } from "../../../common/constants/status.constants";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import * as bcrypt from "bcryptjs";

export class AuthRepository {
    async createOTP(mobile: string, purpose: string, otp: string): Promise<any> {
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        const otpRecord = new OTP({
            mobile,
            purpose,
            otpHash,
            expiresAt,
            attempts: 0,
        });

        await otpRecord.save();
        return otpRecord;
    }

    async getOTP(mobile: string, purpose: string): Promise<any> {
        return OTP.findOne({ mobile, purpose, verifiedAt: { $exists: false } })
            .sort({ createdAt: -1 });
    }

    async verifyOTP(mobile: string, purpose: string, otp: string): Promise<any> {
        const otpRecord = await this.getOTP(mobile, purpose);
        if (!otpRecord) {
            throw new AppError("OTP not found or expired", 404, ErrorCodes.AUTH_OTP_INVALID);
        }

        if (new Date() > otpRecord.expiresAt) {
            throw new AppError("OTP has expired", 400, ErrorCodes.AUTH_OTP_EXPIRED);
        }

        if (otpRecord.attempts >= 5) {
            throw new AppError("OTP attempts exceeded", 429, ErrorCodes.AUTH_OTP_RATE_LIMITED);
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new AppError("Invalid OTP", 400, ErrorCodes.AUTH_OTP_INVALID);
        }

        otpRecord.verifiedAt = new Date();
        await otpRecord.save();

        return otpRecord;
    }

    async findOrCreateCustomer(mobile: string, name?: string): Promise<any> {
        let user = await User.findOne({ mobile });
        if (!user) {
            user = new User({
                name: name || `Customer ${mobile.slice(-4)}`,
                mobile,
                role: "CUSTOMER",
                status: UserStatus.ACTIVE,
            });
            await user.save();
        }
        return user;
    }

    async findUserByMobile(mobile: string): Promise<any> {
        return User.findOne({ mobile });
    }

    async updateLastLogin(userId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
    }

    async validateUserStatus(user: any): Promise<void> {
        if (user.status === UserStatus.SUSPENDED) {
            throw new AppError("Account is suspended", 403, ErrorCodes.USER_SUSPENDED);
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new AppError("Account is inactive", 403, ErrorCodes.USER_INACTIVE);
        }
    }
}
