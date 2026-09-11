import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";
import { Retailer } from "./models/retailer.model";
import { Order } from "../orders/models/order.model";
import { Product } from "../products/models/product.model";
import { OrderStateMachine } from "../orders/services/order-state-machine.service";
import { pushNotification } from "../../integrations/notifications/push";
import { emitOrderUpdate, emitJobOffer } from "../../integrations/websocket/websocket.broadcast";
import { autoAssignOrder } from "../delivery/services/auto-assign.service";

const router = Router();

// ── Public ─────────────────────────────────────────────────
router.get("/nearby", async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat((req.query.radius as string) || "5");
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "lat and lng required" } });
    }
    const stores = await Retailer.find({
      status: "APPROVED",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(50);
    res.json({ success: true, data: stores });
  } catch (e) { next(e); }
});

// ── Authenticated: current retailer ────────────────────────
router.get("/me", authMiddleware, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOne({ ownerId: req.user?._id });
    if (!retailer) {
      return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer profile not found" } });
    }
    res.json({ success: true, data: retailer });
  } catch (e) { next(e); }
});

router.patch("/me/status", authMiddleware, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOneAndUpdate(
      { ownerId: req.user?._id },
      { $set: { isOpen: !!req.body.isOpen } },
      { new: true }
    );
    if (!retailer) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    res.json({ success: true, data: retailer });
  } catch (e) { next(e); }
});

router.get("/orders", authMiddleware, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOne({ ownerId: req.user?._id });
    if (!retailer) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    const orders = await Order.find({ retailerId: retailer._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: orders });
  } catch (e) { next(e); }
});

router.get("/products", authMiddleware, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOne({ ownerId: req.user?._id });
    if (!retailer) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    const products = await Product.find({ retailerId: retailer._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (e) { next(e); }
});

router.post("/products", authMiddleware, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOne({ ownerId: req.user?._id });
    if (!retailer) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    const product = await Product.create({ ...req.body, retailerId: retailer._id });
    res.status(201).json({ success: true, data: product });
  } catch (e) { next(e); }
});

router.get("/dashboard/stats", authMiddleware, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOne({ ownerId: req.user?._id });
    if (!retailer) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const [ordersToday, pendingOrders, completedOrders, revenueAgg] = await Promise.all([
      Order.countDocuments({ retailerId: retailer._id, createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ retailerId: retailer._id, status: { $in: ["PLACED","ACCEPTED","PREPARING","READY_FOR_PICKUP"] } }),
      Order.countDocuments({ retailerId: retailer._id, status: "DELIVERED" }),
      Order.aggregate([
        { $match: { retailerId: retailer._id, status: "DELIVERED", createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);
    res.json({ success: true, data: { ordersToday, pendingOrders, completedOrders, revenueToday: revenueAgg[0]?.total || 0 } });
  } catch (e) { next(e); }
});

router.post("/register", authMiddleware, async (req: any, res, next) => {
  try {
    const existing = await Retailer.findOne({ ownerId: req.user?._id });
    if (existing) return res.status(409).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Retailer already registered" } });
    const retailer = await Retailer.create({ ...req.body, ownerId: req.user?._id, status: "PENDING" });
    res.status(201).json({ success: true, data: retailer });
  } catch (e) { next(e); }
});

// ── Generic /:id MUST come last ────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const retailer = await Retailer.findById(req.params.id);
    if (!retailer) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    res.json({ success: true, data: retailer });
  } catch (e) { next(e); }
});

export default router;

// ── PATCH /retailers/orders/:id/status ─────────────────────
// Retailer accepts, rejects, prepares, or marks ready.
// On READY_FOR_PICKUP, auto-assign runs.
router.patch("/orders/:id/status", authMiddleware, async (req: any, res: any, next: any) => {
  try {
    const { status } = req.body;

    const retailer: any = await Retailer.findOne({ ownerId: req.user._id });
    if (!retailer) {
      return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" } });
    }

    const order: any = await Order.findOne({ _id: req.params.id, retailerId: retailer._id });
    if (!order) {
      return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" } });
    }

    // State machine validation (throws 422 on invalid transition)
    await OrderStateMachine.validateTransition(order.status, status, "RETAILER", order);

    const fromStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      fromStatus,
      toStatus: status,
      actorRole: "RETAILER",
      timestamp: new Date(),
    });
    await order.save();

    // Broadcast + notify customer
    emitOrderUpdate(order);
    await pushNotification(
      String(order.userId),
      "Order update",
      `Your order ${order.orderNumber} is now ${status}`
    );

    // Auto-assign when ready for pickup
    let assignment = null;
    if (status === "READY_FOR_PICKUP") {
      assignment = await autoAssignOrder(order);
      if (assignment) {
        order.status = "ASSIGNED";
        order.statusHistory.push({
          fromStatus: "READY_FOR_PICKUP",
          toStatus: "ASSIGNED",
          actorRole: "SYSTEM",
          timestamp: new Date(),
        });
        await order.save();

        emitOrderUpdate(order);
        emitJobOffer(String(assignment.deliveryPartnerId), assignment);

        await pushNotification(
          String(assignment.deliveryPartnerId),
          "New delivery job",
          `Order ${order.orderNumber} is ready for pickup`
        );
      }
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        assignmentId: assignment ? String(assignment._id) : null,
      },
    });
  } catch (e) { next(e); }
});

// ── PUT /retailers/me — update store details ───────────────
router.put("/me", authMiddleware, async (req: any, res, next) => {
  try {
    const updates: any = {};
    ["shopName", "phone", "email", "address", "location", "serviceRadiusKm", "categories"].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "No updatable fields provided" },
      });
    }

    const retailer = await Retailer.findOneAndUpdate(
      { ownerId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!retailer) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Retailer not found" },
      });
    }

    res.json({ success: true, data: retailer });
  } catch (e) { next(e); }
});
