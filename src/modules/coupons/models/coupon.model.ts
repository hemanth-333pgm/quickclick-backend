import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
    code: string;
    type: "PERCENTAGE" | "FIXED" | "FREE_DELIVERY";
    value: number;
    minOrderValue: number;
    maxDiscount: number;
    startAt: Date;
    endAt: Date;
    usageLimit: number;
    perUserLimit: number;
    usedCount: number;
    isActive: boolean;
    description: string;
    applicableTo: "ALL" | "SPECIFIC_RETAILERS" | "SPECIFIC_PRODUCTS" | "NEW_USERS" | "FIRST_ORDER";
    applicableIds: mongoose.Types.ObjectId[];
    userIds?: mongoose.Types.ObjectId[];
    metadata: {
        createdBy: mongoose.Types.ObjectId;
        campaignName: string;
        categories: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["PERCENTAGE", "FIXED", "FREE_DELIVERY"],
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        maxDiscount: {
            type: Number,
            min: 0,
        },
        startAt: {
            type: Date,
            required: true,
        },
        endAt: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            default: 1000,
        },
        perUserLimit: {
            type: Number,
            default: 1,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        description: {
            type: String,
            required: true,
        },
        applicableTo: {
            type: String,
            enum: ["ALL", "SPECIFIC_RETAILERS", "SPECIFIC_PRODUCTS", "NEW_USERS", "FIRST_ORDER"],
            default: "ALL",
        },
        applicableIds: [{
            type: Schema.Types.ObjectId,
        }],
        userIds: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],
        metadata: {
            createdBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            campaignName: String,
            categories: [String],
        },
    },
    {
        timestamps: true,
    }
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, startAt: 1, endAt: 1 });

export const Coupon = mongoose.model<ICoupon>("Coupon", CouponSchema);
