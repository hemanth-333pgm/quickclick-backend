import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
    res.json({ message: "Cart retrieved" });
});

router.post("/items", authMiddleware, (req, res) => {
    res.json({ message: "Item added to cart" });
});

router.patch("/items/:itemId", authMiddleware, (req, res) => {
    res.json({ message: "Item updated" });
});

router.delete("/items/:itemId", authMiddleware, (req, res) => {
    res.json({ message: "Item removed" });
});

router.delete("/", authMiddleware, (req, res) => {
    res.json({ message: "Cart cleared" });
});

export default router;
