import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
    userId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    retailerId: mongoose.Types.ObjectId;
    deliveryPartnerId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    rating: number;
    review: string;
    images: string[];
    isVerified: boolean;
    isAnonymous: boolean;
    helpfulCount: number;
    reportedCount: number;
    reply?: {
        text: string;
        repliedBy: mongoose.Types.ObjectId;
        repliedAt: Date;
    };
    status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
    createdAt: Date;
    updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
        },
        deliveryPartnerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        review: {
            type: String,
            maxlength: 1000,
        },
        images: [String],
        isVerified: {
            type: Boolean,
            default: false,
        },
        isAnonymous: {
            type: Boolean,
            default: false,
        },
        helpfulCount: {
            type: Number,
            default: 0,
        },
        reportedCount: {
            type: Number,
            default: 0,
        },
        reply: {
            text: String,
            repliedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
            repliedAt: Date,
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "FLAGGED"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

RatingSchema.index({ retailerId: 1, createdAt: -1 });
RatingSchema.index({ productId: 1, createdAt: -1 });

export const Rating = mongoose.model<IRating>("Rating", RatingSchema);
