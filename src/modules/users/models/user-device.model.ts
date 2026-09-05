import mongoose, { Schema, Document } from "mongoose";

export interface IUserDevice extends Document {
    userId: mongoose.Types.ObjectId;
    deviceId?: string;
    fcmToken: string;
    platform?: string;
    active: boolean;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserDeviceSchema = new Schema<IUserDevice>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        deviceId: {
            type: String,
        },
        fcmToken: {
            type: String,
            required: true,
        },
        platform: {
            type: String,
            enum: ["ios", "android", "web"],
        },
        active: {
            type: Boolean,
            default: true,
        },
        lastSeenAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

UserDeviceSchema.index({ userId: 1, fcmToken: 1 }, { unique: true });

export const UserDevice = mongoose.model<IUserDevice>("UserDevice", UserDeviceSchema);
