import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: mongoose.Types.ObjectId;
    sortOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        imageUrl: {
            type: String,
            trim: true,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            index: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

CategorySchema.index({ isActive: 1, sortOrder: 1 });
CategorySchema.index({ parentId: 1, isActive: 1 });

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
