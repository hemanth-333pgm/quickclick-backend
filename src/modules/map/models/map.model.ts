import mongoose, { Schema, Document } from "mongoose";

export interface IMapMarker extends Document {
    userId: mongoose.Types.ObjectId;
    type: "RETAILER" | "DELIVERY" | "CUSTOMER" | "ORDER";
    referenceId: mongoose.Types.ObjectId;
    location: {
        type: string;
        coordinates: number[];
    };
    address?: string;
    icon?: string;
    popup?: string;
    metadata?: any;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMapRoute extends Document {
    userId: mongoose.Types.ObjectId;
    start: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    end: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    waypoints?: Array<{
        latitude: number;
        longitude: number;
        address?: string;
    }>;
    route: {
        distance: number;
        duration: number;
        polyline: string;
        geometry: any;
    };
    mode: "DRIVING" | "WALKING" | "BICYCLING";
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGeoFence extends Document {
    name: string;
    type: "DELIVERY" | "PICKUP" | "RESTRICTED" | "SERVICE_AREA";
    coordinates: number[][][];
    center: {
        latitude: number;
        longitude: number;
    };
    radius: number;
    isActive: boolean;
    retailerId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Map Marker Schema
const MapMarkerSchema = new Schema<IMapMarker>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["RETAILER", "DELIVERY", "CUSTOMER", "ORDER"],
            index: true,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "type",
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
                index: "2dsphere",
            },
        },
        address: {
            type: String,
            trim: true,
        },
        icon: {
            type: String,
        },
        popup: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        expiresAt: Date,
    },
    {
        timestamps: true,
    }
);

// Map Route Schema
const MapRouteSchema = new Schema<IMapRoute>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        start: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: String,
        },
        end: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            address: String,
        },
        waypoints: [
            {
                latitude: Number,
                longitude: Number,
                address: String,
            },
        ],
        route: {
            distance: { type: Number, required: true },
            duration: { type: Number, required: true },
            polyline: { type: String, required: true },
            geometry: { type: Schema.Types.Mixed, required: true },
        },
        mode: {
            type: String,
            enum: ["DRIVING", "WALKING", "BICYCLING"],
            default: "DRIVING",
        },
        expiresAt: Date,
    },
    {
        timestamps: true,
    }
);

// GeoFence Schema
const GeoFenceSchema = new Schema<IGeoFence>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["DELIVERY", "PICKUP", "RESTRICTED", "SERVICE_AREA"],
            index: true,
        },
        coordinates: {
            type: [[[Number]]],
            required: true,
        },
        center: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        radius: {
            type: Number,
            required: true,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
        },
    },
    {
        timestamps: true,
    }
);

GeoFenceSchema.index({ coordinates: "2dsphere" });
GeoFenceSchema.index({ center: "2dsphere" });

export const MapMarker = mongoose.model<IMapMarker>("MapMarker", MapMarkerSchema);
export const MapRoute = mongoose.model<IMapRoute>("MapRoute", MapRouteSchema);
export const GeoFence = mongoose.model<IGeoFence>("GeoFence", GeoFenceSchema);
