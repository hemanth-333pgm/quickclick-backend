import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Public
router.get("/validate/:code", (req, res) => {
    res.json({ message: "Coupon validated", valid: true });
});

// Protected
router.post("/apply", authMiddleware, (req, res) => {
    res.json({ message: "Coupon applied", discount: 10 });
});

export default router;
