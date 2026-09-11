import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { User } from "./models/user.model";
import { Retailer } from "../retailers/models/retailer.model";
import { DeliveryPartner } from "../delivery/models/delivery-partner.model";
import { Address } from "../addresses/models/address.model";

const router = Router();

// ── GET /users/me — login identity only ────────────────────
router.get("/me", authMiddleware, async (req: any, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// ── GET /users/me/full — everything for the logged-in user ──
// Returns: user + role-specific data (retailer / delivery / addresses)
// This is what the mobile "Profile" screen should call.
router.get("/me/full", authMiddleware, async (req: any, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    const response: any = {
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      role: user.role,
    };

    // ── Role-specific blocks ────────────────────────────────
    if (user.role === "RETAILER") {
      const retailer = await Retailer.findOne({ ownerId: user._id }).lean();
      response.retailer = retailer || null;
    }

    if (user.role === "DELIVERY_PARTNER") {
      const partner = await DeliveryPartner.findOne({ userId: user._id }).lean();
      response.deliveryPartner = partner || null;
    }

    if (user.role === "CUSTOMER") {
      const addresses = await Address.find({ userId: user._id }).lean();
      response.addresses = addresses;
      response.addressCount = addresses.length;
    }

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      response.isAdmin = true;
    }

    res.json({ success: true, data: response });
  } catch (e) { next(e); }
});

// ── PUT /users/me — update shared fields ────────────────────
router.put("/me", authMiddleware, async (req: any, res, next) => {
  try {
    const { name, email, avatarUrl } = req.body;

    const updates: any = {};
    if (name !== undefined)      updates.name = String(name).trim();
    if (email !== undefined)     updates.email = String(email).toLowerCase().trim();
    if (avatarUrl !== undefined) updates.avatarUrl = String(avatarUrl).trim();

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "No updatable fields provided" },
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    res.json({ success: true, message: "Profile updated", data: user });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { code: "DUPLICATE_KEY", message: "Email already in use" },
      });
    }
    next(e);
  }
});

// ── GET /users (admin only) ─────────────────────────────────
router.get("/", authMiddleware, async (req: any, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        error: { code: "AUTH_FORBIDDEN", message: "Insufficient permissions" },
      });
    }
    const users = await User.find({}).select("-password").limit(100);
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

export default router;
