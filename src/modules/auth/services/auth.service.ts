import { OTP } from "../models/otp.model";
import { User } from "../../users/models/user.model";
import { UserStatus } from "../../../common/constants/status.constants";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
    async sendOTP(mobile: string, purpose: string = "LOGIN"): Promise<any> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        // Delete old OTPs for this mobile
        await OTP.deleteMany({ mobile, verifiedAt: { $exists: false } });

        const otpRecord = await OTP.create({
            mobile,
            purpose,
            otpHash,
            expiresAt,
            attempts: 0,
        });

        console.log(`📱 OTP for ${mobile}: ${otp}`); // Log for testing
        return { challengeId: otpRecord._id };
    }

    async verifyOTP(mobile: string, otp: string): Promise<any> {
        const otpRecord = await OTP.findOne({
            mobile,
            verifiedAt: { $exists: false }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            throw new Error("OTP not found or expired");
        }

        if (new Date() > otpRecord.expiresAt) {
            throw new Error("OTP has expired");
        }

        if (otpRecord.attempts >= 5) {
            throw new Error("Too many attempts");
        }

        const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isValid) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            throw new Error("Invalid OTP");
        }

        otpRecord.verifiedAt = new Date();
        await otpRecord.save();

        // Find or create user
        let user = await User.findOne({ mobile });
        if (!user) {
            user = await User.create({
                name: `Customer ${mobile.slice(-4)}`,
                mobile,
                role: "CUSTOMER",
                status: UserStatus.ACTIVE,
            });
        }

        // Generate JWT token
        const accessSecret = process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key-min-32-characters";
        const refreshSecret = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-min-32-characters";

        const accessToken = jwt.sign(
            { id: user._id, mobile: user.mobile, role: user.role },
            accessSecret,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user._id, mobile: user.mobile },
            refreshSecret,
            { expiresIn: "30d" }
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
            },
        };
    }
}
