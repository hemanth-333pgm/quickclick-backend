import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    balance: number;
    currency: string;
    status: "ACTIVE" | "FROZEN" | "CLOSED";
    lastTransactionAt: Date;
    metadata: {
        totalDeposited: number;
        totalWithdrawn: number;
        totalEarned: number;
        totalSpent: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IWalletTransaction extends Document {
    walletId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND" | "EARNING" | "CASHBACK";
    amount: number;
    balance: number;
    description: string;
    referenceId: mongoose.Types.ObjectId;
    referenceType: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["ACTIVE", "FROZEN", "CLOSED"],
            default: "ACTIVE",
        },
        lastTransactionAt: Date,
        metadata: {
            totalDeposited: { type: Number, default: 0 },
            totalWithdrawn: { type: Number, default: 0 },
            totalEarned: { type: Number, default: 0 },
            totalSpent: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
    }
);

const WalletTransactionSchema = new Schema<IWalletTransaction>(
    {
        walletId: {
            type: Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["DEPOSIT", "WITHDRAWAL", "PAYMENT", "REFUND", "EARNING", "CASHBACK"],
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        balance: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        referenceType: {
            type: String,
            required: true,
            enum: ["ORDER", "PAYMENT", "WITHDRAWAL", "DEPOSIT", "REFUND", "CASHBACK"],
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            default: "PENDING",
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
export const WalletTransaction = mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
