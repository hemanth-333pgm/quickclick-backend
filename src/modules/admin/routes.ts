import { Router } from "express";
import { AdminController } from "./controllers/admin.controller";
import { CategoryController } from "./controllers/category.controller";
import { CouponController } from "./controllers/coupon.controller";
import { NotificationController } from "./controllers/notification.controller";
import { ZoneController } from "./controllers/zone.controller";
import { AuditController } from "./controllers/audit.controller";
import { ReportController } from "./controllers/report.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();
const adminController = new AdminController();
const categoryController = new CategoryController();
const couponController = new CouponController();
const notificationController = new NotificationController();
const zoneController = new ZoneController();
const auditController = new AuditController();
const reportController = new ReportController();

// All routes require admin authentication
router.use(authMiddleware);
router.use(rbacMiddleware(Roles.ANY_ADMIN));

// ============================================
// DASHBOARD
// ============================================
router.get("/dashboard", adminController.getDashboardMetrics);
router.get("/dashboard/realtime", adminController.getRealtimeStats);
router.get("/dashboard/chart/:type/:period", adminController.getChartData);
router.get("/dashboard/analytics", adminController.getDashboardAnalytics);

// ============================================
// USERS
// ============================================
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserDetails);
router.patch("/users/:id/status", adminController.updateUserStatus);

// ============================================
// RETAILERS
// ============================================
router.get("/retailers", adminController.getRetailers);
router.get("/retailers/:id", adminController.getRetailerDetails);
router.patch("/retailers/:id/status", adminController.approveRetailer);

// ============================================
// DELIVERY PARTNERS
// ============================================
router.get("/delivery-partners", adminController.getDeliveryPartners);
router.patch("/delivery-partners/:id/status", adminController.updateDeliveryPartnerStatus);

// ============================================
// ORDERS
// ============================================
router.get("/orders", adminController.getOrders);
router.get("/orders/:id", adminController.getOrderDetails);
router.post("/orders/:id/assign", adminController.assignDelivery);

// ============================================
// CATEGORIES
// ============================================
router.get("/categories", categoryController.getCategories);
router.get("/categories/:id", categoryController.getCategoryById);
router.post("/categories", categoryController.createCategory);
router.put("/categories/:id", categoryController.updateCategory);
router.delete("/categories/:id", categoryController.deleteCategory);

// ============================================
// COUPONS
// ============================================
router.get("/coupons", couponController.getCoupons);
router.get("/coupons/:id", couponController.getCouponById);
router.post("/coupons", couponController.createCoupon);
router.put("/coupons/:id", couponController.updateCoupon);
router.delete("/coupons/:id", couponController.deleteCoupon);

// ============================================
// NOTIFICATIONS
// ============================================
router.get("/notifications", notificationController.getNotifications);
router.post("/notifications/send", notificationController.sendNotification);
router.patch("/notifications/:id/read", notificationController.markNotificationRead);
router.delete("/notifications/:id", notificationController.deleteNotification);

// ============================================
// ZONES
// ============================================
router.get("/zones", zoneController.getZones);
router.get("/zones/:id", zoneController.getZoneById);
router.post("/zones", zoneController.createZone);
router.put("/zones/:id", zoneController.updateZone);
router.delete("/zones/:id", zoneController.deleteZone);

// ============================================
// AUDIT LOGS
// ============================================
router.get("/audit-logs", auditController.getAuditLogs);
router.get("/audit-logs/:id", auditController.getAuditLogById);

// ============================================
// REPORTS
// ============================================
router.get("/reports/daily", reportController.getDailyReport);
router.get("/reports/weekly", reportController.getWeeklyReport);
router.get("/reports/monthly", reportController.getMonthlyReport);

export default router;
