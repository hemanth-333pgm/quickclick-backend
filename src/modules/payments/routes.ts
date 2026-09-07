import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/cod", authMiddleware, (req, res) => {
    res.json({ message: "COD order created" });
});

router.post("/razorpay/order", authMiddleware, (req, res) => {
    res.json({ message: "Razorpay order created" });
});

router.post("/razorpay/verify", authMiddleware, (req, res) => {
    res.json({ message: "Payment verified" });
});

router.get("/:id/status", authMiddleware, (req, res) => {
    res.json({ message: "Payment status" });
});

export default router;
