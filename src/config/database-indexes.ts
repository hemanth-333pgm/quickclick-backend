import mongoose from "mongoose";

/**
 * Ensures 2dsphere indexes exist for geo queries.
 * Safe to call on every startup — MongoDB is idempotent here.
 */
export async function ensureGeoIndexes(): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn("ensureGeoIndexes: no db connection");
      return;
    }
    await db.collection("retailers").createIndex({ location: "2dsphere" });
    await db.collection("deliverypartners").createIndex({ location: "2dsphere" });
    console.log("✓ Geo indexes ensured (retailers.location, deliverypartners.location)");
  } catch (e) {
    console.warn("ensureGeoIndexes failed:", e);
  }
}
