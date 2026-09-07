import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    body: string;
    type: string;
    data?: any;
    read: boolean;
    readAt?: Date;
    sentAt: Date;
    priority: "HIGH" | "MEDIUM" | "LOW";
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["ORDER_UPDATE", "DELIVERY_ASSIGNED", "PROMOTIONAL", "PAYMENT", "VERIFICATION", "ALERT", "REMINDER", "OFFER"],
        },
        data: {
            type: Schema.Types.Mixed,
        },
        read: {
            type: Boolean,
            default: false,
        },
        readAt: Date,
        sentAt: {
            type: Date,
            default: Date.now,
        },
        priority: {
            type: String,
            enum: ["HIGH", "MEDIUM", "LOW"],
            default: "MEDIUM",
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
