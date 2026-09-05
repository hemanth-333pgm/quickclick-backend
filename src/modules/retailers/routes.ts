import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();

// Public
router.get("/nearby", (req, res) => {
    res.json({ message: "Nearby retailers" });
});

router.get("/:id", (req, res) => {
    res.json({ message: "Retailer details" });
});

// Retailer only
router.post("/register", authMiddleware, rbacMiddleware(Roles.CUSTOMER), (req, res) => {
    res.json({ message: "Retailer registered" });
});

router.get("/my-store", authMiddleware, rbacMiddleware(Roles.RETAILER), (req, res) => {
    res.json({ message: "My store details" });
});

router.put("/my-store", authMiddleware, rbacMiddleware(Roles.RETAILER), (req, res) => {
    res.json({ message: "Store updated" });
});

// Admin only
router.put("/:id/status", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), (req, res) => {
    res.json({ message: "Retailer status updated" });
});

export default router;
