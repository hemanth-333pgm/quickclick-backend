import mongoose, { Schema, Document } from "mongoose";
import { PaymentStatus } from "../../../common/constants/status.constants";

export interface IPayment extends Document {
    orderId: mongoose.Types.ObjectId;
    method: "COD" | "ONLINE" | "WALLET";
    amount: number;
    status: string;
    transactionId?: string;
    provider?: string;
    metadata?: any;
    paidAt?: Date;
    refundedAt?: Date;
    refundReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },
        method: {
            type: String,
            required: true,
            enum: ["COD", "ONLINE", "WALLET"],
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
            index: true,
        },
        transactionId: {
            type: String,
            sparse: true,
        },
        provider: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        paidAt: Date,
        refundedAt: Date,
        refundReason: String,
    },
    {
        timestamps: true,
    }
);

PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ transactionId: 1 }, { sparse: true });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
