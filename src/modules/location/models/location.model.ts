import mongoose, { Schema, Document } from "mongoose";

export interface ILocation extends Document {
    userId: mongoose.Types.ObjectId;
    address: string;
    latitude: number;
    longitude: number;
    type: "HOME" | "WORK" | "OTHER" | "DELIVERY" | "PICKUP";
    label?: string;
    floor?: string;
    apartment?: string;
    landmark?: string;
    instructions?: string;
    isDefault: boolean;
    isVerified: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGeofence extends Document {
    name: string;
    center: {
        latitude: number;
        longitude: number;
    };
    radius: number;
    type: "DELIVERY" | "PICKUP" | "RESTRICTED" | "SERVICE_AREA";
    retailerId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
            index: true
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
            index: true
        },
        type: {
            type: String,
            enum: ["HOME", "WORK", "OTHER", "DELIVERY", "PICKUP"],
            default: "OTHER"
        },
        label: String,
        floor: String,
        apartment: String,
        landmark: String,
        instructions: String,
        isDefault: {
            type: Boolean,
            default: false
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        lastUsedAt: Date
    },
    {
        timestamps: true
    }
);

// Index for geospatial queries
LocationSchema.index({ location: "2dsphere" });

export const Location = mongoose.model<ILocation>("Location", LocationSchema);

// Geofence Schema
const GeofenceSchema = new Schema<IGeofence>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        center: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        radius: {
            type: Number,
            required: true,
            min: 0
        },
        type: {
            type: String,
            enum: ["DELIVERY", "PICKUP", "RESTRICTED", "SERVICE_AREA"],
            required: true
        },
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            index: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

GeofenceSchema.index({ "center": "2dsphere" });

export const Geofence = mongoose.model<IGeofence>("Geofence", GeofenceSchema);
