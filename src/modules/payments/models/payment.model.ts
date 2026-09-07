import mongoose, { Schema, Document } from "mongoose";
import { PaymentStatus } from "../../../common/constants/status.constants";

export interface IPayment extends Document {
    orderId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    method: "COD" | "RAZORPAY" | "STRIPE" | "WALLET";
    status: string;
    transactionId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    metadata?: any;
    paidAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    refundReason?: string;
    webhookData?: any;
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
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: {
            type: String,
            required: true,
            enum: ["COD", "RAZORPAY", "STRIPE", "WALLET"],
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
        razorpayOrderId: {
            type: String,
            sparse: true,
        },
        razorpayPaymentId: {
            type: String,
            sparse: true,
        },
        razorpaySignature: String,
        metadata: {
            type: Schema.Types.Mixed,
        },
        paidAt: Date,
        refundedAt: Date,
        refundAmount: {
            type: Number,
            min: 0,
        },
        refundReason: String,
        webhookData: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });
PaymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
