import { Router } from "express";
import { AuthController } from "./controllers/auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();
const authController = new AuthController();

// ============================================
// PUBLIC ROUTES
// ============================================

// OTP Routes (Customer/Retailer/Delivery)
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/refresh", authController.refreshToken);

// Admin Password Login
router.post("/admin/login", authController.adminLogin);

// ============================================
// PROTECTED ROUTES
// ============================================

// Logout
router.post("/logout", authController.logout);

// Admin Only - Create Admin User
router.post(
    "/admin/create",
    authMiddleware,
    rbacMiddleware(["SUPER_ADMIN"]),
    authController.createAdmin
);

// Change Password (Any authenticated user)
router.post(
    "/change-password",
    authMiddleware,
    authController.changePassword
);

export default router;
