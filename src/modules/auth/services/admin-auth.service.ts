import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../users/models/user.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { config } from "../../../config/env";

export class AdminAuthService {
    async loginWithPassword(email: string, password: string): Promise<any> {
        console.log("🔐 Admin login attempt for:", email);
        
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: { $in: ["ADMIN", "SUPER_ADMIN"] }
        }).select('+password');

        console.log("📋 User found:", user ? "Yes" : "No");
        if (user) {
            console.log("   Has Password:", !!user.password);
        }

        if (!user) {
            throw new AppError("Invalid email or password", 401, ErrorCodes.AUTH_UNAUTHORIZED);
        }

        if (user.status !== "ACTIVE") {
            throw new AppError("Account is not active", 403, ErrorCodes.USER_SUSPENDED);
        }

        if (!user.password) {
            throw new AppError("Password not set. Please use OTP login.", 400, ErrorCodes.AUTH_UNAUTHORIZED);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("   Password match:", isPasswordValid ? "✅ Yes" : "❌ No");

        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401, ErrorCodes.AUTH_UNAUTHORIZED);
        }

        user.lastLoginAt = new Date();
        await user.save();

        // Generate tokens with proper secret from config
        const accessSecret = config.jwt.accessSecret || process.env.JWT_ACCESS_SECRET || "your-secret-key";
        const refreshSecret = config.jwt.refreshSecret || process.env.JWT_REFRESH_SECRET || "your-refresh-secret";

        const accessToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            accessSecret,
            { expiresIn: config.jwt.accessExpiresIn || "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user._id, email: user.email },
            refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn || "30d" }
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        };
    }

    async createAdminUser(data: {
        name: string;
        email: string;
        password: string;
        mobile?: string;
    }): Promise<any> {
        const existing = await User.findOne({ email: data.email.toLowerCase() });
        if (existing) {
            throw new AppError("User already exists", 409, ErrorCodes.USER_ALREADY_EXISTS);
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        const user = await User.create({
            name: data.name,
            email: data.email.toLowerCase(),
            mobile: data.mobile || "+919888888888",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        };
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw new AppError("User not found", 404, ErrorCodes.USER_NOT_FOUND);
        }

        if (user.password) {
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                throw new AppError("Invalid old password", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
    }
}
