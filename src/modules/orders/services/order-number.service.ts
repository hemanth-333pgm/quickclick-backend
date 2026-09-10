import { OrderCounter } from "../models/order-counter.model";

/**
 * Generate a unique, human-readable order number.
 * Format: QC-YYMMDD-NNNN  (e.g. QC-260910-0042)
 *
 * Atomic increment via MongoDB findOneAndUpdate + upsert.
 * Concurrent requests get sequential numbers with no collision.
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateKey = `${yy}${mm}${dd}`;

  const counter = await OrderCounter.findOneAndUpdate(
    { _id: dateKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const seq = String(counter?.seq ?? 1).padStart(4, "0");
  return `QC-${dateKey}-${seq}`;
}
