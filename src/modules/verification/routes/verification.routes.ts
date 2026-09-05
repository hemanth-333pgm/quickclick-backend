import { Router } from "express";
import { VerificationController } from "../controllers/verification.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { rbacMiddleware } from "../../../middleware/rbac.middleware";

const router = Router();
const verificationController = new VerificationController();

// Document Verification
router.post(
    "/documents/submit",
    authMiddleware,
    rbacMiddleware(["RETAILER", "DELIVERY"]),
    verificationController.submitDocuments
);

router.patch(
    "/documents/:id/verify",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    verificationController.verifyDocuments
);

router.get(
    "/documents/pending",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    verificationController.getPendingVerifications
);

router.get(
    "/documents/:id",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    verificationController.getVerificationDetails
);

// Admin Dashboard
router.get(
    "/dashboard",
    authMiddleware,
    rbacMiddleware(["ADMIN", "SUPER_ADMIN"]),
    verificationController.getApprovalDashboard
);

export default router;
