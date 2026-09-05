import mongoose, { Schema, Document } from "mongoose";
import { RetailerStatus } from "../../../common/constants/status.constants";

export interface IRetailer extends Document {
    ownerId: mongoose.Types.ObjectId;
    shopName: string;
    phone: string;
    email?: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    location: {
        type: string;
        coordinates: number[];
    };
    serviceRadiusKm: number;
    status: typeof RetailerStatus[keyof typeof RetailerStatus];
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    categories: string[];
    documents: Array<{
        type: string;
        url: string;
        status: string;
        uploadedAt: Date;
    }>;
    rating: number;
    totalOrders: number;
    createdAt: Date;
    updatedAt: Date;
}

const RetailerSchema = new Schema<IRetailer>(
    {
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        shopName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        address: {
            line1: { type: String, required: true },
            line2: String,
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, default: "India" }
        },
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], required: true, index: "2dsphere" }
        },
        serviceRadiusKm: {
            type: Number,
            default: 5,
            min: 0,
            max: 50
        },
        status: {
            type: String,
            enum: Object.values(RetailerStatus),
            default: RetailerStatus.PENDING,
            index: true
        },
        isOpen: {
            type: Boolean,
            default: true,
            index: true
        },
        openTime: String,
        closeTime: String,
        categories: [String],
        documents: [{
            type: { type: String, required: true },
            url: { type: String, required: true },
            status: { type: String, default: "PENDING" },
            uploadedAt: { type: Date, default: Date.now }
        }],
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalOrders: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Compound index for common queries
RetailerSchema.index({ status: 1, isOpen: 1, location: "2dsphere" });

export const Retailer = mongoose.model<IRetailer>("Retailer", RetailerSchema);

