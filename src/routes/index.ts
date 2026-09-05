import { Router } from "express";
import authRoutes from "../modules/auth/routes";
import userRoutes from "../modules/users/routes";
import retailerRoutes from "../modules/retailers/routes";
import productRoutes from "../modules/products/routes";
import orderRoutes from "../modules/orders/routes";
import deliveryRoutes from "../modules/delivery/routes";
import adminRoutes from "../modules/admin/routes";
import locationRoutes from "../modules/location/routes/location.routes";
import zoneRoutes from "../modules/zones/routes/zone.routes";
import verificationRoutes from "../modules/verification/routes/verification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/retailers", retailerRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/admin", adminRoutes);
router.use("/location", locationRoutes);
router.use("/zones", zoneRoutes);
router.use("/verification", verificationRoutes);

export default router;
