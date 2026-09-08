import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
    actorId: mongoose.Types.ObjectId;
    actorName: string;
    actorRole: string;
    action: string;
    module: string;
    entityId?: mongoose.Types.ObjectId;
    entityType?: string;
    changes?: {
        before: any;
        after: any;
    };
    ipAddress: string;
    userAgent: string;
    metadata?: any;
    status: "SUCCESS" | "FAILED";
    errorMessage?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        actorName: {
            type: String,
            required: true,
        },
        actorRole: {
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
            before: { type: Schema.Types.Mixed },
            after: { type: Schema.Types.Mixed },
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
        errorMessage: String,
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
