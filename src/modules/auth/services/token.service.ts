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
            expiresIn: config.jwt.accessExpiresIn,
        });
    }

    generateRefreshToken(user: any): string {
        const payload = {
            id: user._id.toString(),
            mobile: user.mobile,
        };
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
        });
    }

    verifyAccessToken(token: string): any {
        return jwt.verify(token, config.jwt.accessSecret);
    }

    verifyRefreshToken(token: string): any {
        return jwt.verify(token, config.jwt.refreshSecret);
    }
}
