import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    userName: string;
    userRole: string;
    action: string;
    module: string;
    entityId?: mongoose.Types.ObjectId;
    entityType?: string;
    changes?: any;
    ipAddress: string;
    userAgent: string;
    metadata?: any;
    status: "SUCCESS" | "FAILED";
    errorMessage?: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userRole: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        module: {
            type: String,
            required: true,
            index: true,
        },
        entityId: {
            type: Schema.Types.ObjectId,
        },
        entityType: {
            type: String,
        },
        changes: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED"],
            default: "SUCCESS",
        },
        errorMessage: {
            type: String,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ module: 1, action: 1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
