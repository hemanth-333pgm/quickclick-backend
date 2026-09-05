import mongoose, { Schema, Document } from "mongoose";

export interface ITalukAdmin extends Document {
    userId: mongoose.Types.ObjectId;
    taluk: string;
    district: string;
    state: string;
    zones: mongoose.Types.ObjectId[];
    permissions: {
        createZone: boolean;
        editZone: boolean;
        deleteZone: boolean;
        assignRetailers: boolean;
        assignDeliveryPartners: boolean;
        viewReports: boolean;
        managePricing: boolean;
    };
    assignedAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TalukAdminSchema = new Schema<ITalukAdmin>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
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
        zones: [
            {
                type: Schema.Types.ObjectId,
                ref: "Zone",
            },
        ],
        permissions: {
            createZone: { type: Boolean, default: true },
            editZone: { type: Boolean, default: true },
            deleteZone: { type: Boolean, default: false },
            assignRetailers: { type: Boolean, default: true },
            assignDeliveryPartners: { type: Boolean, default: true },
            viewReports: { type: Boolean, default: true },
            managePricing: { type: Boolean, default: false },
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

TalukAdminSchema.index({ taluk: 1, district: 1 });
TalukAdminSchema.index({ userId: 1 });

export const TalukAdmin = mongoose.model<ITalukAdmin>("TalukAdmin", TalukAdminSchema);
