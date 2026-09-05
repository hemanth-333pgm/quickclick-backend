import mongoose, { Schema, Document } from "mongoose";

export interface IUserZone extends Document {
    userId: mongoose.Types.ObjectId;
    zoneId: mongoose.Types.ObjectId;
    userType: "CUSTOMER" | "RETAILER" | "DELIVERY";
    status: "ACTIVE" | "INACTIVE" | "PENDING";
    assignedAt: Date;
    assignedBy: mongoose.Types.ObjectId;
    metadata: {
        serviceable: boolean;
        priority: number;
        notes: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserZoneSchema = new Schema<IUserZone>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        zoneId: {
            type: Schema.Types.ObjectId,
            ref: "Zone",
            required: true,
            index: true,
        },
        userType: {
            type: String,
            required: true,
            enum: ["CUSTOMER", "RETAILER", "DELIVERY"],
            index: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "PENDING"],
            default: "PENDING",
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        metadata: {
            serviceable: { type: Boolean, default: true },
            priority: { type: Number, default: 1 },
            notes: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

UserZoneSchema.index({ userId: 1, zoneId: 1 }, { unique: true });
UserZoneSchema.index({ zoneId: 1, userType: 1 });

export const UserZone = mongoose.model<IUserZone>("UserZone", UserZoneSchema);
