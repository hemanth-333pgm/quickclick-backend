import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";
import { User } from "../users/models/user.model";
import { DeliveryPartner } from "./models/delivery-partner.model";
import { DeliveryAssignment } from "./models/delivery-assignment.model";
import { Order } from "../orders/models/order.model";
import { OrderStateMachine } from "../orders/services/order-state-machine.service";
import { pushNotification } from "../../integrations/notifications/push";
import { emitOrderUpdate } from "../../integrations/websocket/websocket.broadcast";

const router = Router();
const tokenService = new TokenService();

// All delivery routes require authentication
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════
// POST /delivery/register
// ═══════════════════════════════════════════════════════════════
router.post("/register", async (req: any, res, next) => {
  try {
    const userId = req.user._id;

    const existing = await DeliveryPartner.findOne({ userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Already registered" },
      });
    }

    const partner = await DeliveryPartner.create({
      userId,
      phone: req.body.phone || req.user.mobile,
      vehicleType: req.body.vehicleType,
      vehicleNumber: req.body.vehicleNumber,
      vehicleModel: req.body.vehicleModel,
      licenseNumber: req.body.licenseNumber,
      status: "PENDING",
      availability: "OFFLINE",
    });

    // Promote user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "DELIVERY_PARTNER" } },
      { new: true }
    );

    if (!updatedUser) {
      await DeliveryPartner.deleteOne({ _id: partner._id });
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    // Use existing TokenService for access token
    const accessToken = tokenService.generateAccessToken(updatedUser);

    res.status(201).json({
      success: true,
      data: {
        partner,
        accessToken,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          mobile: updatedUser.mobile,
          role: updatedUser.role,
          status: updatedUser.status,
        },
      },
    });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// GET /delivery/me
// ═══════════════════════════════════════════════════════════════
router.get("/me", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" },
      });
    }
    res.json({ success: true, data: partner });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// PUT /delivery/me
// ═══════════════════════════════════════════════════════════════
router.put("/me", async (req: any, res, next) => {
  try {
    const updates: any = {};
    ["vehicleType", "vehicleNumber", "vehicleModel", "licenseNumber"].forEach((k) => {
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

// ═══════════════════════════════════════════════════════════════
// PATCH /delivery/me/availability
// ═══════════════════════════════════════════════════════════════
router.patch("/me/availability", async (req: any, res, next) => {
  try {
    const { availability } = req.body;
    const allowed = ["ONLINE", "OFFLINE", "BUSY", "BREAK"];

    if (!allowed.includes(availability)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `availability must be one of ${allowed.join(", ")}`,
        },
      });
    }

    const partner = await DeliveryPartner.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { availability } },
      { new: true }
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

// ═══════════════════════════════════════════════════════════════
// PATCH /delivery/me/location
// ═══════════════════════════════════════════════════════════════
router.patch("/me/location", async (req: any, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "lat/lng required as numbers" },
      });
    }

    await DeliveryPartner.updateOne(
      { userId: req.user._id },
      {
        $set: {
          latitude: lat,
          longitude: lng,
          location: { type: "Point", coordinates: [lng, lat] },
          updatedAt: new Date(),
        },
      }
    );

    res.json({ success: true });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// GET /delivery/jobs
// ═══════════════════════════════════════════════════════════════
router.get("/jobs", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" },
      });
    }

    const jobs = await DeliveryAssignment.find({
      deliveryPartnerId: partner._id,
      status: {
        $in: ["OFFERED", "ACCEPTED", "REACHED_STORE", "PICKED_UP", "OUT_FOR_DELIVERY"],
      },
    })
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: jobs });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// PATCH /delivery/jobs/:id/status
// ═══════════════════════════════════════════════════════════════
router.patch("/jobs/:id/status", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" },
      });
    }

    const assignment: any = await DeliveryAssignment.findOne({
      _id: req.params.id,
      deliveryPartnerId: partner._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Assignment not found" },
      });
    }

    const next = req.body.status;
    const validStatuses = [
      "ACCEPTED",
      "REACHED_STORE",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "REJECTED",
    ];

    if (!validStatuses.includes(next)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `status must be one of ${validStatuses.join(", ")}`,
        },
      });
    }

    const order: any = await Order.findById(assignment.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" },
      });
    }

    // OTP check for DELIVERED
    if (next === "DELIVERED" && order.deliveryOtp) {
      const otp = req.body.otpCode;
      if (otp !== order.deliveryOtp) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid OTP" },
        });
      }
    }

    const orderStatusMap: Record<string, string> = {
      ACCEPTED: "ASSIGNED",
      REACHED_STORE: "ASSIGNED",
      PICKED_UP: "PICKED_UP",
      OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
      DELIVERED: "DELIVERED",
    };

    const orderStatus = orderStatusMap[next];

    if (orderStatus && orderStatus !== order.status) {
      await OrderStateMachine.validateTransition(order.status, orderStatus, "DELIVERY", order);

      order.statusHistory.push({
        fromStatus: order.status,
        toStatus: orderStatus,
        actorRole: "DELIVERY",
        timestamp: new Date(),
      });
      order.status = orderStatus;

      if (next === "DELIVERED") {
        order.deliveredAt = new Date();
      }

      await order.save();
    }

    assignment.status = next;
    assignment.updatedAt = new Date();

    if (req.body.latitude != null && req.body.longitude != null) {
      assignment.lastKnownLocation = {
        type: "Point",
        coordinates: [req.body.longitude, req.body.latitude],
      };
    }

    await assignment.save();

    if (order.userId) {
      await pushNotification(
        String(order.userId),
        "Order update",
        `Your order ${order.orderNumber} is now ${order.status}`
      );
    }

    emitOrderUpdate(order);

    res.json({
      success: true,
      data: {
        assignment,
        orderStatus: order.status,
      },
    });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════════
// POST /delivery/jobs/:id/reject
// ═══════════════════════════════════════════════════════════════
router.post("/jobs/:id/reject", async (req: any, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.user._id });
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Partner not found" },
      });
    }

    const updated = await DeliveryAssignment.findOneAndUpdate(
      { _id: req.params.id, deliveryPartnerId: partner._id, status: "OFFERED" },
      { $set: { status: "REJECTED", rejectedReason: req.body.reason } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Assignment not found or already handled",
        },
      });
    }

    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

export default router;