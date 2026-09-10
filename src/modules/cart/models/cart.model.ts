import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price?: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: mongoose.Types.DocumentArray<ICartItem & mongoose.Types.Subdocument>;
  subtotal: number;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: [CartItemSchema],
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Cart = mongoose.model<ICart>("Cart", CartSchema);
