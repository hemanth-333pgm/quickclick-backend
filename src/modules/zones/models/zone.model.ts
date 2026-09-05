import mongoose, { Schema, Document } from "mongoose";

export interface IZone extends Document {
    name: string;
    taluk: string;
    district: string;
    state: string;
    pincodes: string[];
    center: {
        latitude: number;
        longitude: number;
    };
    boundaries: {
        type: string;
        coordinates: number[][][];
    };
    radius: number;
    isActive: boolean;
    deliveryCharge: number;
    minOrderAmount: number;
    assignedAdmins: mongoose.Types.ObjectId[];
    retailers: mongoose.Types.ObjectId[];
    deliveryPartners: mongoose.Types.ObjectId[];
    stats: {
        totalOrders: number;
        totalRevenue: number;
        activeRetailers: number;
        activeDeliveryPartners: number;
    };
    settings: {
        maxDeliveryDistance: number;
        estimatedDeliveryTime: number;
        surgePricing: boolean;
        surgeMultiplier: number;
        workingHours: {
            start: string;
            end: string;
        };
        holidayMode: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        taluk: {
            type: String,
            required: true,
            index: true,
        },
        district: {
            type: String,
            required: true,
            index: true,
        },
        state: {
            type: String,
            required: true,
        },
        pincodes: {
            type: [String],
            required: true,
            index: true,
        },
        center: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
        },
        boundaries: {
            type: {
                type: String,
                enum: ["Polygon"],
                default: "Polygon",
            },
            coordinates: {
                type: [[[Number]]],
                required: true,
            },
        },
        radius: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        deliveryCharge: {
            type: Number,
            default: 0,
        },
        minOrderAmount: {
            type: Number,
            default: 0,
        },
        assignedAdmins: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        retailers: [
            {
                type: Schema.Types.ObjectId,
                ref: "Retailer",
            },
        ],
        deliveryPartners: [
            {
                type: Schema.Types.ObjectId,
                ref: "DeliveryPartner",
            },
        ],
        stats: {
            totalOrders: { type: Number, default: 0 },
            totalRevenue: { type: Number, default: 0 },
            activeRetailers: { type: Number, default: 0 },
            activeDeliveryPartners: { type: Number, default: 0 },
        },
        settings: {
            maxDeliveryDistance: { type: Number, default: 10 },
            estimatedDeliveryTime: { type: Number, default: 30 },
            surgePricing: { type: Boolean, default: false },
            surgeMultiplier: { type: Number, default: 1.0 },
            workingHours: {
                start: { type: String, default: "08:00" },
                end: { type: String, default: "22:00" },
            },
            holidayMode: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

ZoneSchema.index({ taluk: 1, district: 1 });
ZoneSchema.index({ pincodes: 1 });
ZoneSchema.index({ "center": "2dsphere" });
ZoneSchema.index({ "boundaries": "2dsphere" });
ZoneSchema.index({ isActive: 1 });

export const Zone = mongoose.model<IZone>("Zone", ZoneSchema);

