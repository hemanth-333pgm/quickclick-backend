import { Router } from "express";
import authRoutes from "../modules/auth/routes";
import userRoutes from "../modules/users/routes";
import addressRoutes from "../modules/addresses/routes";
import productRoutes from "../modules/products/routes";
import categoryRoutes from "../modules/categories/routes";
import cartRoutes from "../modules/cart/routes";
import orderRoutes from "../modules/orders/routes";
import retailerRoutes from "../modules/retailers/routes";
import deliveryRoutes from "../modules/delivery/routes";
import adminRoutes from "../modules/admin/routes";
import zoneRoutes from "../modules/zones/routes/zone.routes";
import locationRoutes from "../modules/location/routes/location.routes";
import mapRoutes from "../modules/map/routes/map.routes";
import paymentRoutes from "../modules/payments/routes";
import kycRoutes from "../modules/kyc/routes";
import wishlistRoutes from "../modules/wishlist/routes";
import notificationRoutes from "../modules/notifications/routes";
import verificationRoutes from "../modules/verification/routes/verification.routes";
import reportRoutes from "../modules/reports/routes";
import couponRoutes from "../modules/coupons/routes";
import walletRoutes from "../modules/wallet/routes";
import ratingRoutes from "../modules/ratings/routes";

const router = Router();

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/retailers", retailerRoutes);
router.use('/retailer', retailerRoutes);  // singular alias
router.use("/location", locationRoutes);
router.use("/zones", zoneRoutes);
router.use("/coupons", couponRoutes);

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================
router.use("/users", userRoutes);
router.use("/addresses", addressRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/admin", adminRoutes);
router.use("/map", mapRoutes);
router.use("/payments", paymentRoutes);
router.use("/kyc", kycRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/notifications", notificationRoutes);
router.use("/verification", verificationRoutes);
router.use("/reports", reportRoutes);
router.use("/wallet", walletRoutes);
router.use("/ratings", ratingRoutes);

export default router;
