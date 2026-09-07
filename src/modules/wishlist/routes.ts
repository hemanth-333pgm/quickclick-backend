import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
    res.json({ message: "Wishlist retrieved" });
});

router.post("/:productId", authMiddleware, (req, res) => {
    res.json({ message: "Added to wishlist" });
});

router.delete("/:productId", authMiddleware, (req, res) => {
    res.json({ message: "Removed from wishlist" });
});

export default router;
