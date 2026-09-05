import mongoose, { Schema } from "mongoose";

export interface IVerificationDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    userType: "RETAILER" | "DELIVERY" | "CUSTOMER";
    documents: Array<{
        type: string;
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        uploadedAt: Date;
        status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
        verifiedAt?: Date;
        verifiedBy?: mongoose.Types.ObjectId;
        rejectionReason?: string;
        expiryDate?: Date;
        metadata?: any;
    }>;
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "INCOMPLETE";
    verificationRemarks?: string;
    submittedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const VerificationDocumentSchema = new Schema<IVerificationDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        userType: {
            type: String,
            required: true,
            enum: ["RETAILER", "DELIVERY", "CUSTOMER"],
        },
        documents: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: [
                        "AADHAAR",
                        "PAN",
                        "GST",
                        "DRIVING_LICENSE",
                        "VEHICLE_REGISTRATION",
                        "INSURANCE",
                        "BANK_ACCOUNT",
                        "SHOP_AGREEMENT",
                        "FOOD_LICENSE",
                        "POLICE_VERIFICATION",
                    ],
                },
                fileUrl: { type: String, required: true },
                fileName: { type: String, required: true },
                fileSize: { type: Number, required: true },
                mimeType: { type: String, required: true },
                uploadedAt: { type: Date, default: Date.now },
                status: {
                    type: String,
                    enum: ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
                    default: "PENDING",
                },
                verifiedAt: Date,
                verifiedBy: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                rejectionReason: String,
                expiryDate: Date,
                metadata: Schema.Types.Mixed,
            },
        ],
        verificationStatus: {
            type: String,
            enum: ["PENDING", "VERIFIED", "REJECTED", "INCOMPLETE"],
            default: "PENDING",
        },
        verificationRemarks: String,
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        verifiedAt: Date,
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

VerificationDocumentSchema.index({ userId: 1, "documents.type": 1 });
VerificationDocumentSchema.index({ verificationStatus: 1 });
VerificationDocumentSchema.index({ "documents.status": 1 });

export const VerificationDocument = mongoose.model<IVerificationDocument>(
    "VerificationDocument",
    VerificationDocumentSchema
);
