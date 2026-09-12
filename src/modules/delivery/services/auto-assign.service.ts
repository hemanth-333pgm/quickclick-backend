import { Retailer } from "../../retailers/models/retailer.model";
import { DeliveryPartner } from "../models/delivery-partner.model";
import { DeliveryAssignment } from "../models/delivery-assignment.model";

/**
 * Find the nearest online approved partner to a retailer.
 *
 * Strategy:
 *   1. Geo search (if retailer has GeoJSON location) — sorted by distance
 *   2. Fallback: any online APPROVED partner with available capacity
 *   3. Deterministic tiebreak: lowest currentDeliveries, then most recently updated
 */
export async function findNearestPartner(retailerId: string, maxKm = 5) {
  const retailer: any = await Retailer.findById(retailerId);
  if (!retailer) return null;

  const baseFilter: any = {
    status: "APPROVED",
    availability: "ONLINE",
  };

  // ── Preferred: geo search ─────────────────────────────────────────
  if (retailer.location?.coordinates?.length === 2) {
    const [lng, lat] = retailer.location.coordinates;

    const geo = await DeliveryPartner.find({
      ...baseFilter,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxKm * 1000,
        },
      },
    })
      .sort({ currentDeliveries: 1, updatedAt: -1 })
      .limit(5);

    if (geo.length) {
      console.log(`[autoAssign] geo candidates: ${geo.map(p => p._id).join(", ")}`);
      return geo[0];
    }

    console.log(`[autoAssign] no partner within ${maxKm}km of retailer ${retailerId} — falling back`);
  }

  // ── Fallback: any online APPROVED partner with capacity ──────────
  // Use explicit field check instead of $expr (avoids null-compare traps)
  const fallback = await DeliveryPartner.find({
    ...baseFilter,
    $or: [
      { currentDeliveries: { $lt: 3 } },             // soft cap
      { currentDeliveries: { $exists: false } },
      { currentDeliveries: null },
    ],
  })
    .sort({ currentDeliveries: 1, updatedAt: -1 })
    .limit(5);

  if (fallback.length) {
    console.log(`[autoAssign] fallback candidates: ${fallback.map(p => p._id).join(", ")}`);
    return fallback[0];
  }

  // ── Last resort: any online APPROVED partner (ignoring capacity) ─
  const lastResort = await DeliveryPartner.findOne(baseFilter)
    .sort({ currentDeliveries: 1, updatedAt: -1 });

  if (lastResort) {
    console.log(`[autoAssign] last resort: ${lastResort._id}`);
  }

  return lastResort;
}

/**
 * Build the pickup/dropoff snapshot objects required by the
 * DeliveryAssignment schema, pulling from the retailer and order.
 */
function buildLocationSnapshot(retailer: any, order: any) {
  // Pickup = retailer location
  const pickup = {
    address: [
      retailer?.address?.line1,
      retailer?.address?.city,
      retailer?.address?.state,
      retailer?.address?.postalCode,
    ].filter(Boolean).join(", ") || "Retailer location",
    latitude:  retailer?.location?.coordinates?.[1] ?? retailer?.latitude  ?? 0,
    longitude: retailer?.location?.coordinates?.[0] ?? retailer?.longitude ?? 0,
  };

  // Dropoff = order's addressSnapshot
  const snap = order?.addressSnapshot || {};
  const dropoff = {
    address: [
      snap.line1,
      snap.city,
      snap.state,
      snap.postalCode,
    ].filter(Boolean).join(", ") || "Customer address",
    latitude:  snap.latitude  ?? 0,
    longitude: snap.longitude ?? 0,
  };

  return { pickup, dropoff };
}

/**
 * Assign an order to the nearest available partner.
 * Populates all fields required by DeliveryAssignment schema.
 */
export async function autoAssignOrder(order: any) {
  const retailer: any = await Retailer.findById(order.retailerId);
  if (!retailer) {
    console.warn(`[autoAssign] Retailer ${order.retailerId} not found for order ${order._id}`);
    return null;
  }

  const partner: any = await findNearestPartner(String(order.retailerId));
  if (!partner) {
    console.warn(`[autoAssign] No partner available for order ${order._id}`);
    return null;
  }

  const { pickup, dropoff } = buildLocationSnapshot(retailer, order);

  const assignment = await DeliveryAssignment.create({
    orderId: order._id,
    deliveryPartnerId: partner._id,
    retailerId: retailer._id,
    status: "OFFERED",
    offeredAt: new Date(),
    pickupLocation: pickup,
    dropoffLocation: dropoff,
  });

  // Increment partner's load
  await DeliveryPartner.updateOne(
    { _id: partner._id },
    { $inc: { currentDeliveries: 1 } }
  );

  console.log(`[autoAssign] Order ${order._id} → partner ${partner._id}`);
  return assignment;
}