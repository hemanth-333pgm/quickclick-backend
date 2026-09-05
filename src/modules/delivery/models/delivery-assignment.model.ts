import mongoose, { Schema, Document } from "mongoose";
import { DeliveryAssignmentStatus } from "../../../common/constants/status.constants";

export interface IDeliveryAssignment extends Document {
    orderId: mongoose.Types.ObjectId;
    deliveryPartnerId: mongoose.Types.ObjectId;
    retailerId: mongoose.Types.ObjectId;
    status: typeof DeliveryAssignmentStatus[keyof typeof DeliveryAssignmentStatus];
    offeredAt: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    pickupAt?: Date;
    reachedStoreAt?: Date;
    outForDeliveryAt?: Date;
    deliveredAt?: Date;
    estimatedDeliveryTime?: Date;
    actualDeliveryTime?: Date;
    pickupLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };
    dropoffLocation: {
        latitude: number;
        longitude: number;
        address: string;
    };
    currentLocation?: {
        latitude: number;
        longitude: number;
        updatedAt: Date;
    };
    routePolyline?: string;
    distanceKm?: number;
    durationMinutes?: number;
    earnings?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DeliveryAssignmentSchema = new Schema<IDeliveryAssignment>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
            index: true
        },
        deliveryPartnerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: Object.values(DeliveryAssignmentStatus),
            default: DeliveryAssignmentStatus.OFFERED,
            index: true
        },
        offeredAt: {
            type: Date,
            default: Date.now
        },
        acceptedAt: Date,
        rejectedAt: Date,
        rejectionReason: String,
        pickupAt: Date,
        reachedStoreAt: Date,
        outForDeliveryAt: Date,
        deliveredAt: Date,
        estimatedDeliveryTime: Date,
        actualDeliveryTime: Date,
        pickupLocation: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: { type: String, required: true }
        },
        dropoffLocation: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: { type: String, required: true }
        },
        currentLocation: {
            latitude: Number,
            longitude: Number,
            updatedAt: Date
        },
        routePolyline: String,
        distanceKm: Number,
        durationMinutes: Number,
        earnings: {
            type: Number,
            default: 0
        },
        notes: String
    },
    {
        timestamps: true
    }
);

// Indexes for performance
DeliveryAssignmentSchema.index({ deliveryPartnerId: 1, status: 1, createdAt: -1 });
DeliveryAssignmentSchema.index({ orderId: 1 });
DeliveryAssignmentSchema.index({ status: 1, offeredAt: 1 });
DeliveryAssignmentSchema.index({ "currentLocation": "2dsphere" });

export const DeliveryAssignment = mongoose.model<IDeliveryAssignment>(
    "DeliveryAssignment",
    DeliveryAssignmentSchema
);

