import mongoose, { Schema, Document } from "mongoose";

export interface IProductApproval extends Document {
    productId: mongoose.Types.ObjectId;
    retailerId: mongoose.Types.ObjectId;
    productData: any;
    status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewerRemarks?: string;
    revisionRequested?: {
        fields: string[];
        message: string;
        requestedAt: Date;
    };
    history: Array<{
        status: string;
        remarks?: string;
        changedBy: mongoose.Types.ObjectId;
        changedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const ProductApprovalSchema = new Schema<IProductApproval>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            unique: true,
        },
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
            index: true,
        },
        productData: {
            type: Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "REVISION_REQUESTED"],
            default: "PENDING",
            index: true,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: Date,
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        reviewerRemarks: String,
        revisionRequested: {
            fields: [String],
            message: String,
            requestedAt: Date,
        },
        history: [
            {
                status: { type: String, required: true },
                remarks: String,
                changedBy: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                changedAt: { type: Date, default: Date.now },
            },
        ],
    },
    {
        timestamps: true,
    }
);

ProductApprovalSchema.index({ status: 1, submittedAt: -1 });
ProductApprovalSchema.index({ retailerId: 1, status: 1 });

export const ProductApproval = mongoose.model<IProductApproval>(
    "ProductApproval",
    ProductApprovalSchema
);
