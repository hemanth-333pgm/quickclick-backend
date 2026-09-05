import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();

// Customer routes
router.post("/", authMiddleware, rbacMiddleware(Roles.CUSTOMER), (req, res) => {
    res.json({ message: "Order created" });
});

router.get("/", authMiddleware, (req, res) => {
    res.json({ message: "My orders" });
});

router.get("/:id", authMiddleware, (req, res) => {
    res.json({ message: "Order details" });
});

router.post("/:id/cancel", authMiddleware, rbacMiddleware(Roles.CUSTOMER), (req, res) => {
    res.json({ message: "Order cancelled" });
});

// Retailer routes
router.get("/retailer/orders", authMiddleware, rbacMiddleware(Roles.RETAILER), (req, res) => {
    res.json({ message: "Retailer orders" });
});

router.put("/:id/status", authMiddleware, rbacMiddleware(Roles.RETAILER_AND_ADMIN), (req, res) => {
    res.json({ message: "Order status updated" });
});

export default router;
