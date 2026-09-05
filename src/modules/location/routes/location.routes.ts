import { Router } from "express";
import { LocationController } from "../controllers/location.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { rbacMiddleware } from "../../../middleware/rbac.middleware";

const router = Router();
const locationController = new LocationController();

router.get("/geocode", locationController.geocodeAddress);
router.get("/reverse-geocode", locationController.reverseGeocode);
router.get("/route", locationController.getRoute);
router.get("/serviceability", locationController.checkServiceability);

router.post("/save", authMiddleware, locationController.saveLocation);
router.get("/nearby", authMiddleware, locationController.getNearbyLocations);
router.get("/geofences", authMiddleware, locationController.getGeofences);

router.post(
    "/optimal-route",
    authMiddleware,
    rbacMiddleware(["CUSTOMER", "RETAILER", "DELIVERY", "ADMIN"]),
    locationController.getOptimalRoute
);

router.get(
    "/tracking/:orderId",
    authMiddleware,
    rbacMiddleware(["CUSTOMER", "RETAILER", "DELIVERY", "ADMIN"]),
    locationController.getDeliveryTracking
);

router.post(
    "/geofence",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    locationController.createGeofence
);

router.put(
    "/geofence/:id",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    locationController.updateGeofence
);

router.delete(
    "/geofence/:id",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    locationController.deleteGeofence
);

export default router;
