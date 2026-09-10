import mongoose, { Schema, Document } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: "India", trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    instructions: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = mongoose.model<IAddress>("Address", AddressSchema);
