import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { DeliveryPartner } from "./models/delivery-partner.model";
import { DeliveryAssignment } from "./models/delivery-assignment.model";
import { Order } from "../orders/models/order.model";
import { OrderStateMachine } from "../orders/services/order-state-machine.service";
import { pushNotification } from "../../integrations/notifications/push";

const router = Router();
router.use(authMiddleware);

// ── Register delivery partner ─────────────────────────────
router.post("/register", async (req: any, res, next) => {
  try {
    const existing = await DeliveryPartner.findOne({ userId: req.user._id });
    if (existing) return res.status(409).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Already registered" } });

    const partner = await DeliveryPartner.create({
      userId: req.user._id,
      ...req.body,
      status: "PENDING",
      availability: "OFFLINE",
    });
    res.status(201).json({ success: true, data: partner });
  } catch (e) { next(e); }
});

// ── Get own profile ────────────────────────────────────────
router.get("/me", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" } });
    res.json({ success: true, data: partner });
  } catch (e) { next(e); }
});

// ── Toggle online/offline ─────────────────────────────────
router.patch("/me/availability", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { availability: req.body.availability } },
      { new: true }
    );
    if (!partner) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" } });
    res.json({ success: true, data: partner });
  } catch (e) { next(e); }
});

// ── Update live location (for auto-assignment) ────────────
router.patch("/me/location", async (req: any, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "lat/lng required" } });
    }
    await DeliveryPartner.updateOne(
      { userId: req.user._id },
      { $set: { latitude: lat, longitude: lng, updatedAt: new Date() } }
    );
    res.json({ success: true });
  } catch (e) { next(e); }
});

// ── List my jobs ──────────────────────────────────────────
router.get("/jobs", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" } });

    const jobs = await DeliveryAssignment.find({
      deliveryPartnerId: partner._id,
      status: { $in: ["OFFERED", "ACCEPTED", "REACHED_STORE", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    }).populate("orderId").sort({ createdAt: -1 });

    res.json({ success: true, data: jobs });
  } catch (e) { next(e); }
});

// ── Accept / progress / deliver ───────────────────────────
router.patch("/jobs/:id/status", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" } });

    const assignment: any = await DeliveryAssignment.findOne({
      _id: req.params.id,
      deliveryPartnerId: partner._id,
    });
    if (!assignment) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Assignment not found" } });

    const next = req.body.status;
    const order: any = await Order.findById(assignment.orderId);
    if (!order) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" } });

    // Map delivery status → order status
    const map: Record<string, string> = {
      ACCEPTED: "ASSIGNED",
      REACHED_STORE: "ASSIGNED",
      PICKED_UP: "PICKED_UP",
      OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
      DELIVERED: "DELIVERED",
    };

    const orderStatus = map[next];
    // Only validate + update the order when its status actually changes.
    // (e.g. ACCEPTED and REACHED_STORE both map to ASSIGNED — skipping avoids
    //  a pointless 422 from the state machine on unchanged status.)
    if (orderStatus && orderStatus !== order.status) {
      await OrderStateMachine.validateTransition(order.status, orderStatus, "DELIVERY", order);
      order.statusHistory.push({
        fromStatus: order.status,
        toStatus: orderStatus,
        actorRole: "DELIVERY",
        timestamp: new Date(),
      });
      order.status = orderStatus;
      if (next === "DELIVERED") order.deliveredAt = new Date();
      await order.save();
    }

    // OTP check for DELIVERED
    if (next === "DELIVERED") {
      const otp = req.body.otpCode;
      if (order.deliveryOtp && otp !== order.deliveryOtp) {
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid OTP" } });
      }
    }

    assignment.status = next;
    assignment.updatedAt = new Date();
    if (req.body.latitude != null && req.body.longitude != null) {
      assignment.lastKnownLocation = { type: "Point", coordinates: [req.body.longitude, req.body.latitude] };
    }
    await assignment.save();

    // Notify customer
    await pushNotification(String(order.userId), "Order update", `Your order is now ${order.status}`);

    res.json({ success: true, data: assignment });
  } catch (e) { next(e); }
});

// ── Reject ─────────────────────────────────────────────────
router.post("/jobs/:id/reject", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" } });

    const updated = await DeliveryAssignment.findOneAndUpdate(
      { _id: req.params.id, deliveryPartnerId: partner._id, status: "OFFERED" },
      { $set: { status: "REJECTED", rejectedReason: req.body.reason } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Assignment not found or already handled" } });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

export default router;

// ── PUT /delivery/me — update partner details ──────────────
router.put("/me", authMiddleware, async (req: any, res, next) => {
  try {
    const updates: any = {};
    ["vehicleType", "vehicleNumber", "vehicleModel", "licenseNumber"].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "No updatable fields provided" },
      });
    }

    const partner = await DeliveryPartner.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" },
      });
    }

    res.json({ success: true, data: partner });
  } catch (e) { next(e); }
});
