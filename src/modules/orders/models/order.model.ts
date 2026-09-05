import mongoose, { Schema, Document } from "mongoose";
import { OrderStatus, PaymentStatus } from "../../../common/constants/status.constants";

export interface IOrder extends Document {
    orderNumber: string;
    userId: mongoose.Types.ObjectId;
    retailerId: mongoose.Types.ObjectId;
    deliveryPartnerId?: mongoose.Types.ObjectId;
    addressSnapshot: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        latitude: number;
        longitude: number;
    };
    items: Array<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        unit: string;
        total: number;
        notes?: string;
    }>;
    subtotal: number;
    deliveryFee: number;
    platformFee: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: "COD" | "ONLINE" | "WALLET";
    paymentStatus: typeof PaymentStatus[keyof typeof PaymentStatus];
    status: typeof OrderStatus[keyof typeof OrderStatus];
    statusHistory: Array<{
        fromStatus: string;
        toStatus: string;
        actorId?: mongoose.Types.ObjectId;
        actorRole: string;
        reason?: string;
        timestamp: Date;
    }>;
    deliveryInstructions?: string;
    estimatedDeliveryTime?: Date;
    actualDeliveryTime?: Date;
    cancellationReason?: string;
    cancelledBy?: mongoose.Types.ObjectId;
    isRated: boolean;
    rating?: number;
    feedback?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
            index: true
        },
        deliveryPartnerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        addressSnapshot: {
            line1: { type: String, required: true },
            line2: String,
            city: { type: String, required: true },
            state: { type: String, required: true },
            postalCode: { type: String, required: true },
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        items: [{
            productId: { type: Schema.Types.ObjectId, ref: "Product" },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true, min: 1 },
            unit: { type: String, required: true },
            total: { type: Number, required: true },
            notes: String
        }],
        subtotal: { type: Number, required: true },
        deliveryFee: { type: Number, default: 0 },
        platformFee: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: ["COD", "ONLINE", "WALLET"],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING
        },
        status: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PLACED,
            index: true
        },
        statusHistory: [{
            fromStatus: String,
            toStatus: { type: String, required: true },
            actorId: Schema.Types.ObjectId,
            actorRole: { type: String, required: true },
            reason: String,
            timestamp: { type: Date, default: Date.now }
        }],
        deliveryInstructions: String,
        estimatedDeliveryTime: Date,
        actualDeliveryTime: Date,
        cancellationReason: String,
        cancelledBy: Schema.Types.ObjectId,
        isRated: { type: Boolean, default: false },
        rating: { type: Number, min: 0, max: 5 },
        feedback: String
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        }
    }
);

// Indexes for performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ retailerId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ deliveryPartnerId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });

// Virtual for total items
OrderSchema.virtual("totalItems").get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);

