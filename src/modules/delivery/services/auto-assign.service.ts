import { Retailer } from "../../retailers/models/retailer.model";
import { DeliveryPartner } from "../models/delivery-partner.model";
import { DeliveryAssignment } from "../models/delivery-assignment.model";

/**
 * Find the nearest online approved partner to a retailer.
 * Falls back to any online approved partner if geo lookup yields nothing.
 */
export async function findNearestPartner(retailerId: string, maxKm = 5) {
  const retailer: any = await Retailer.findById(retailerId);
  if (!retailer) return null;

  // Preferred: geo search using retailer.location if present
  if (retailer.location?.coordinates?.length === 2) {
    const [lng, lat] = retailer.location.coordinates;
    const candidates = await DeliveryPartner.find({
      status: "APPROVED",
      availability: "ONLINE",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxKm * 1000,
        },
      },
    }).limit(5);
    if (candidates.length) return candidates[0];
  }

  // Fallback: any approved online partner
  const any = await DeliveryPartner.findOne({
    status: "APPROVED",
    availability: "ONLINE",
    $expr: { $lt: ["$currentDeliveries", "$maxConcurrentDeliveries"] },
  });
  return any;
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
