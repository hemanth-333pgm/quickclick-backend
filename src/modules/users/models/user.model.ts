import mongoose, { Schema, Document } from "mongoose";
import { UserStatus, UserRoles } from "../../../common/constants/status.constants";

export interface IUser extends Document {
    name: string;
    mobile: string;
    email?: string;
    password?: string;  // ← Added
    role: string;
    status: string;
    avatarUrl?: string;
    lastLoginAt?: Date;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        mobile: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            sparse: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            select: false,  // Don't return password by default
            minlength: 6
        },
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
        avatarUrl: {
            type: String,
            trim: true
        },
        lastLoginAt: Date,
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                delete ret.password;
                return ret;
            }
        }
    }
);

export const User = mongoose.model<IUser>("User", UserSchema);
