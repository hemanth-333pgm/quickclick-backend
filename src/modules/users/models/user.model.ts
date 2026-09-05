import mongoose, { Schema, Document } from "mongoose";

// Define constants directly in the file to avoid import issues
export const UserStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
    PENDING: "PENDING",
    DELETED: "DELETED"
} as const;

export const UserRoles = {
    CUSTOMER: "CUSTOMER",
    RETAILER: "RETAILER",
    DELIVERY: "DELIVERY",
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN"
} as const;

export interface IUser extends Document {
    name: string;
    mobile: string;
    email?: string;
    role: string;
    status: string;
    avatarUrl?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        mobile: { type: String, required: true, unique: true },
        email: { type: String, sparse: true, unique: true, lowercase: true },
        role: { 
            type: String, 
            required: true, 
            enum: Object.values(UserRoles), 
            default: UserRoles.CUSTOMER 
        },
        status: { 
            type: String, 
            required: true, 
            enum: Object.values(UserStatus), 
            default: UserStatus.ACTIVE 
        },
        avatarUrl: { type: String, trim: true },
        lastLoginAt: Date,
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);

