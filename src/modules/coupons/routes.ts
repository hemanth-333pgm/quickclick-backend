import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Public routes
router.get("/validate/:code", (req, res) => {
    const { code } = req.params;
    res.json({
        success: true,
        message: "Coupon validated",
        data: {
            code: code,
            valid: true,
            type: "PERCENTAGE",
            value: 10,
            description: "10% off on first order"
        }
    });
});

// Protected routes
router.post("/apply", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Coupon applied",
        data: {
            code: req.body.code,
            discount: 10,
            newTotal: 270
        }
    });
});

export default router;
