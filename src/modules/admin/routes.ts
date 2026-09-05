import { Router } from "express";
import { AdminController } from "./controllers/admin.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware } from "../../middleware/rbac.middleware";

const router = Router();
const adminController = new AdminController();

// All routes require Admin or Super Admin role
const adminAuth = [authMiddleware, rbacMiddleware(["ADMIN", "SUPER_ADMIN"])];

// Dashboard
router.get("/dashboard", adminAuth, adminController.getDashboardMetrics);
router.get("/dashboard/realtime", adminAuth, adminController.getRealtimeStats);
router.get("/dashboard/chart/:type/:period", adminAuth, adminController.getChartData);
router.get("/dashboard/analytics", adminAuth, adminController.getDashboardAnalytics);

// Activity Logs
router.get("/activity-logs", adminAuth, adminController.getActivityLogs);

// User Management
router.get("/users", adminAuth, adminController.getUsers);
router.patch("/users/:id/status", adminAuth, adminController.updateUserStatus);

// Retailer Management
router.patch("/retailers/:id/status", adminAuth, adminController.approveRetailer);

// Delivery Partner Management
router.patch("/delivery-partners/:id/status", adminAuth, adminController.approveDeliveryPartner);

// Order Management
router.post("/orders/:id/assign", adminAuth, adminController.assignDelivery);

export default router;
