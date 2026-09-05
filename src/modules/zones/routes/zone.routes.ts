import { Router } from "express";
import { ZoneController } from "../controllers/zone.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { rbacMiddleware } from "../../../middleware/rbac.middleware";

const router = Router();
const zoneController = new ZoneController();

// Public routes (no auth required)
router.get("/serviceability", zoneController.checkServiceability);
router.get("/pincode/:pincode", zoneController.getZoneByPincode);

// Protected routes - Admin only
router.post(
    "/",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.createZone
);

router.get(
    "/taluk/:taluk/district/:district",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.getZonesByTaluk
);

router.get(
    "/:id",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.getZoneById
);

router.put(
    "/:id",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.updateZone
);

router.post(
    "/:zoneId/retailer/:retailerId/assign",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.assignRetailer
);

router.post(
    "/:zoneId/partner/:partnerId/assign",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.assignDeliveryPartner
);

router.get(
    "/dashboard/taluk",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    zoneController.getTalukDashboard
);

export default router;
