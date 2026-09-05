import { Router } from "express";
import { AuthController } from "./controllers/auth.controller";
import { validate } from "../../middleware/validate.middleware";
import { authValidation } from "./validators/auth.validator";

const router = Router();
const authController = new AuthController();

// Public routes
router.post(
    "/send-otp",
    authController.sendOTP
);

router.post(
    "/verify-otp",
    authController.verifyOTP
);

router.post(
    "/refresh",
    authController.refreshToken
);

router.post(
    "/logout",
    authController.logout
);

export default router;
