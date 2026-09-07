import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
    res.json({ message: "Cart retrieved", data: { items: [], subtotal: 0 } });
});

router.post("/items", authMiddleware, (req, res) => {
    res.json({ message: "Item added to cart", data: req.body });
});

router.patch("/items/:itemId", authMiddleware, (req, res) => {
    res.json({ message: "Item updated", data: req.body });
});

router.delete("/items/:itemId", authMiddleware, (req, res) => {
    res.json({ message: "Item removed" });
});

router.delete("/", authMiddleware, (req, res) => {
    res.json({ message: "Cart cleared" });
});

export default router;
