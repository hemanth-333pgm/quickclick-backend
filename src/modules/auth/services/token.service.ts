import jwt from "jsonwebtoken";
import { config } from "../../../config/env";

export class TokenService {
    generateAccessToken(user: any): string {
        const payload = {
            id: user._id.toString(),
            mobile: user.mobile,
            role: user.role,
        };
        return jwt.sign(payload, config.jwt.accessSecret, {
            expiresIn: config.jwt.accessExpiresIn as any,
        });
    }

    generateRefreshToken(user: any): string {
        const payload = {
            id: user._id.toString(),
            mobile: user.mobile,
        };
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn as any,
        });
    }

    verifyAccessToken(token: string): any {
        try {
            return jwt.verify(token, config.jwt.accessSecret);
        } catch (error) {
            throw new Error("Invalid or expired token");
        }
    }

    verifyRefreshToken(token: string): any {
        try {
            return jwt.verify(token, config.jwt.refreshSecret);
        } catch (error) {
            throw new Error("Invalid or expired refresh token");
        }
    }
}
