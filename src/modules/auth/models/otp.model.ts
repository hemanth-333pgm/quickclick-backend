import mongoose, { Schema, Document } from "mongoose";

export interface IOTP extends Document {
    mobile: string;
    purpose: string;
    otpHash: string;
    expiresAt: Date;
    attempts: number;
    verifiedAt?: Date;
    createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
    {
        mobile: {
            type: String,
            required: true,
            index: true,
        },
        purpose: {
            type: String,
            required: true,
            enum: ["LOGIN", "REGISTER", "FORGOT_PASSWORD"],
            default: "LOGIN",
        },
        otpHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 300 },
        },
        attempts: {
            type: Number,
            default: 0,
        },
        verifiedAt: Date,
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export const OTP = mongoose.model<IOTP>("OTP", OTPSchema);
