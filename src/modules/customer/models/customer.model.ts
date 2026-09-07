import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
    userId: mongoose.Types.ObjectId;
    loyaltyPoints: number;
    totalOrders: number;
    totalSpent: number;
    preferredPaymentMethod: string;
    preferredDeliveryTime: string;
    dietaryPreferences: string[];
    lastOrderDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        loyaltyPoints: {
            type: Number,
            default: 0,
        },
        totalOrders: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        preferredPaymentMethod: {
            type: String,
            enum: ["COD", "ONLINE", "WALLET"],
            default: "COD",
        },
        preferredDeliveryTime: String,
        dietaryPreferences: [String],
        lastOrderDate: Date,
    },
    {
        timestamps: true,
    }
);

export const Customer = mongoose.model<ICustomer>("Customer", CustomerSchema);
