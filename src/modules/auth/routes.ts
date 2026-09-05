import { Router } from "express";
import { AuthController } from "./controllers/auth.controller";

const router = Router();
const authController = new AuthController();

// Public routes - no validation for now
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

export default router;
