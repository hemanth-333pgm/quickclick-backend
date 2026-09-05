import dotenv from "dotenv";

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5000", 10),
    apiPrefix: process.env.API_PREFIX || "/api/v1",
    
    database: {
        uri: process.env.MONGODB_URI || "mongodb://localhost:27017/quickclick",
        name: process.env.MONGODB_DATABASE || "quickclick",
    },
    
    cors: {
        origins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    },
    
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key-min-32-characters",
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-min-32-characters",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    },
    
    otp: {
        ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS || "300", 10),
        maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10),
        resendSeconds: parseInt(process.env.OTP_RESEND_SECONDS || "60", 10),
        length: parseInt(process.env.OTP_LENGTH || "6", 10),
    },
    
    logging: {
        level: process.env.LOG_LEVEL || "info",
    },
    
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    },
    
    app: {
        maxCartItems: parseInt(process.env.MAX_CART_ITEMS || "50", 10),
        minOrderAmount: parseInt(process.env.MIN_ORDER_AMOUNT || "0", 10),
        maxOrderAmount: parseInt(process.env.MAX_ORDER_AMOUNT || "100000", 10),
    },
} as const;
