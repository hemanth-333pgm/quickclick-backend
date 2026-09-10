import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/cod", async (req: any, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "orderId required" },
      });
    }
    res.json({
      success: true,
      data: { orderId, method: "COD", status: "PENDING" },
    });
  } catch (e) { next(e); }
});

router.post("/razorpay/order", (_req, res) => {
  res.status(501).json({
    success: false,
    error: { code: "NOT_IMPLEMENTED", message: "Razorpay integration not configured" },
  });
});

router.post("/razorpay/verify", (_req, res) => {
  res.status(501).json({
    success: false,
    error: { code: "NOT_IMPLEMENTED", message: "Razorpay integration not configured" },
  });
});

router.get("/:id/status", (_req, res) => {
  res.json({ success: true, data: { status: "PENDING" } });
});

export default router;
