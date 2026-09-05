import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    retailerId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    unit: string;
    stockQty: number;
    reservedQty: number;
    minStockThreshold: number;
    imageUrl: string[];
    status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
    isFeatured: boolean;
    tags: string[];
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    preparationTime?: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        retailerId: {
            type: Schema.Types.ObjectId,
            ref: "Retailer",
            required: true,
            index: true
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        discountPrice: {
            type: Number,
            min: 0
        },
        unit: {
            type: String,
            required: true
        },
        stockQty: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },
        reservedQty: {
            type: Number,
            default: 0,
            min: 0
        },
        minStockThreshold: {
            type: Number,
            default: 5
        },
        imageUrl: [String],
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"],
            default: "ACTIVE",
            index: true
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        tags: [String],
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        preparationTime: {
            type: Number,
            default: 10
        }
    },
    {
        timestamps: true
    }
);

// Compound indexes for common queries
ProductSchema.index({ retailerId: 1, status: 1, categoryId: 1 });
ProductSchema.index({ name: "text", tags: "text" });
ProductSchema.index({ price: 1 });

// Virtual for available stock
ProductSchema.virtual("availableStock").get(function() {
    return this.stockQty - this.reservedQty;
});

export const Product = mongoose.model<IProduct>("Product", ProductSchema);

