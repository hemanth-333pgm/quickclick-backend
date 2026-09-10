import mongoose, { Schema, Document } from "mongoose";

export interface IOrderCounter extends Document {
  _id: string;   // "260910" for 2026-09-10
  seq: number;
}

const OrderCounterSchema = new Schema<IOrderCounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const OrderCounter = mongoose.model<IOrderCounter>("OrderCounter", OrderCounterSchema);
