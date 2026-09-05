import mongoose, { Schema, Document } from "mongoose";
import { DeliveryPartnerStatus } from "../../../common/constants/status.constants";

export interface IDeliveryPartner extends Document {
    userId: mongoose.Types.ObjectId;
    vehicleType: "BIKE" | "SCOOTER" | "CAR" | "VAN" | "TRUCK";
    vehicleNumber: string;
    vehicleModel: string;
    licenseNumber: string;
    availability: "ONLINE" | "OFFLINE" | "BUSY" | "BREAK";
    currentLocation?: {
        latitude: number;
        longitude: number;
        updatedAt: Date;
    };
    serviceRadius: number;
    rating: number;
    totalDeliveries: number;
    successRate: number;
    earningsToday: number;
    earningsThisWeek: number;
    earningsThisMonth: number;
    isVerified: boolean;
    documents: Array<{
        type: string;
        url: string;
        verified: boolean;
        uploadedAt: Date;
        verifiedAt?: Date;
    }>;
    status: typeof DeliveryPartnerStatus[keyof typeof DeliveryPartnerStatus];
    lastOnlineAt?: Date;
    lastOfflineAt?: Date;
    currentAssignmentId?: mongoose.Types.ObjectId;
    maxConcurrentDeliveries: number;
    currentDeliveries: number;
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryPartnerSchema = new Schema<IDeliveryPartner>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        vehicleType: {
            type: String,
            enum: ["BIKE", "SCOOTER", "CAR", "VAN", "TRUCK"],
            required: true
        },
        vehicleNumber: {
            type: String,
            required: true,
            uppercase: true
        },
        vehicleModel: {
            type: String,
            required: true
        },
        licenseNumber: {
            type: String,
            required: true
        },
        availability: {
            type: String,
            enum: ["ONLINE", "OFFLINE", "BUSY", "BREAK"],
            default: "OFFLINE",
            index: true
        },
        currentLocation: {
            latitude: Number,
            longitude: Number,
            updatedAt: Date
        },
        serviceRadius: {
            type: Number,
            default: 10
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalDeliveries: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        },
        earningsToday: {
            type: Number,
            default: 0
        },
        earningsThisWeek: {
            type: Number,
            default: 0
        },
        earningsThisMonth: {
            type: Number,
            default: 0
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        documents: [{
            type: { type: String, required: true },
            url: { type: String, required: true },
            verified: { type: Boolean, default: false },
            uploadedAt: { type: Date, default: Date.now },
            verifiedAt: Date
        }],
        status: {
            type: String,
            enum: Object.values(DeliveryPartnerStatus),
            default: DeliveryPartnerStatus.PENDING,
            index: true
        },
        lastOnlineAt: Date,
        lastOfflineAt: Date,
        currentAssignmentId: {
            type: Schema.Types.ObjectId,
            ref: "DeliveryAssignment"
        },
        maxConcurrentDeliveries: {
            type: Number,
            default: 3
        },
        currentDeliveries: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Indexes
DeliveryPartnerSchema.index({ availability: 1, currentLocation: "2dsphere" });
DeliveryPartnerSchema.index({ status: 1, availability: 1 });
DeliveryPartnerSchema.index({ userId: 1 });

// Virtual for isAvailable
DeliveryPartnerSchema.virtual("isAvailable").get(function() {
    return this.availability === "ONLINE" &&
           this.status === "APPROVED" &&
           this.currentDeliveries < this.maxConcurrentDeliveries &&
           this.isVerified;
});

export const DeliveryPartner = mongoose.model<IDeliveryPartner>(
    "DeliveryPartner",
    DeliveryPartnerSchema
);

