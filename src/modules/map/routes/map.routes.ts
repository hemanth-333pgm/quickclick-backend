import { Router } from "express";
import { MapController } from "../controllers/map.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../../middleware/rbac.middleware";

const router = Router();
const mapController = new MapController();

// ==================== PUBLIC ROUTES ====================

// Geocoding
router.get("/geocode", mapController.geocode);
router.get("/reverse-geocode", mapController.reverseGeocode);

// Routing
router.get("/route", mapController.getRoute);

// ==================== PROTECTED ROUTES ====================

// Optimal Route
router.post("/optimal-route", authMiddleware, mapController.getOptimalRoute);

// Markers
router.post("/markers", authMiddleware, mapController.createMarker);
router.get("/markers", authMiddleware, mapController.getMarkers);
router.patch("/markers/:id/location", authMiddleware, mapController.updateMarkerLocation);

// Geofences (Admin only)
router.post("/geofences", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), mapController.createGeofence);
router.get("/geofences/check", authMiddleware, mapController.checkGeofence);
router.get("/geofences", authMiddleware, mapController.getGeofences);

export default router;
