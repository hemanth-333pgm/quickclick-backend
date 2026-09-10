import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Order } from "./models/order.model";
import { Product } from "../products/models/product.model";
import { Retailer } from "../retailers/models/retailer.model";
import { Address } from "../addresses/models/address.model";
import { Cart } from "../cart/models/cart.model";
import { OrderStateMachine } from "./services/order-state-machine.service";
import { generateOrderNumber } from "./services/order-number.service";
import { pushNotification } from "../../integrations/notifications/push";

const router = Router();
router.use(authMiddleware);

// ── Create order ───────────────────────────────────────────
router.post("/", async (req: any, res, next) => {
  try {
    const { items, addressId, paymentMethod = "COD", deliveryInstructions } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "items required" },
      });
    }
    if (!addressId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "addressId required" },
      });
    }

    // 1. Load and validate the address
    const address: any = await Address.findOne({ _id: addressId, userId: req.user._id });
    if (!address) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Address not found" },
      });
    }

    // 2. Load products
    const productIds = items.map((i: any) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Some products not found" },
      });
    }

    let subtotal = 0;
    const orderItems: any[] = [];
    let retailerId: string | null = null;

    for (const line of items) {
      const p: any = products.find((x: any) => String(x._id) === String(line.productId));
      if (!p) throw new Error("Product vanished");

      if (p.status !== "ACTIVE") {
        return res.status(409).json({
          success: false,
          error: { code: "OUT_OF_STOCK", message: `Product ${p.name} unavailable` },
        });
      }
      if ((p.stockQty ?? 0) < line.quantity) {
        return res.status(409).json({
          success: false,
          error: { code: "OUT_OF_STOCK", message: `Only ${p.stockQty} left of ${p.name}` },
        });
      }
      if (retailerId && String(p.retailerId) !== retailerId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Multi-retailer orders not supported in POC" },
        });
      }
      retailerId = String(p.retailerId);

      const unitPrice = p.discountPrice ?? p.price ?? 0;
      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;

      orderItems.push({
        productId: p._id,
        name: p.name,
        price: unitPrice,
        quantity: line.quantity,
        unit: p.unit,
        total: lineTotal,
      });
    }

    const deliveryFee = 30;
    const platformFee = 10;
    const discount = 0;
    const tax = 0;
    const total = subtotal + deliveryFee + platformFee - discount + tax;

    // 3. Atomically decrement stock
    for (const line of items) {
      const result = await Product.updateOne(
        { _id: line.productId, stockQty: { $gte: line.quantity } },
        { $inc: { stockQty: -line.quantity } }
      );
      if (result.modifiedCount !== 1) {
        return res.status(409).json({
          success: false,
          error: { code: "OUT_OF_STOCK", message: "Stock changed mid-checkout" },
        });
      }
    }

    // 4. Generate order number and create order
    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      userId: req.user._id,
      retailerId,
      addressSnapshot: {
        line1: address.line1 || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        latitude: address.latitude,
        longitude: address.longitude,
      },
      items: orderItems,
      subtotal,
      deliveryFee,
      platformFee,
      discount,
      tax,
      total,
      paymentMethod,
      paymentStatus: "PENDING",
      status: "PLACED",
      statusHistory: [
        { fromStatus: "PLACED", toStatus: "PLACED", actorRole: "CUSTOMER", timestamp: new Date() },
      ],
    });

    // 5. Clear cart
    await Cart.findOneAndDelete({ userId: req.user._id });

    // 6. Notify retailer
    const retailer: any = await Retailer.findById(retailerId);
    if (retailer?.ownerId) {
      await pushNotification(String(retailer.ownerId), "New order received", `Order ${orderNumber}`);
    }

    res.status(201).json({ success: true, data: order });
  } catch (e) { next(e); }
});

// ── List customer's own orders ─────────────────────────────
router.get("/", async (req: any, res, next) => {
  try {
    const q: any = { userId: req.user._id };
    if (req.query.status) q.status = req.query.status;
    const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);
    const orders = await Order.find(q).sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, data: orders });
  } catch (e) { next(e); }
});

router.get("/:id", async (req: any, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" } });
    res.json({ success: true, data: order });
  } catch (e) { next(e); }
});

// ── Cancel ─────────────────────────────────────────────────
router.post("/:id/cancel", async (req: any, res, next) => {
  try {
    const order: any = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Order not found" } });

    await OrderStateMachine.validateTransition(order.status, "CANCELLED", req.user.role, order);

    for (const it of order.items) {
      await Product.updateOne({ _id: it.productId }, { $inc: { stockQty: it.quantity } });
    }

    order.status = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || "Customer cancelled";
    order.statusHistory.push({
      fromStatus: "PLACED",
      toStatus: "CANCELLED",
      actorRole: req.user.role || "CUSTOMER",
      timestamp: new Date(),
    });
    await order.save();

    res.json({ success: true, data: order });
  } catch (e) { next(e); }
});

export default router;
