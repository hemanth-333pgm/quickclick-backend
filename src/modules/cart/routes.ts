import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Cart retrieved",
        data: {
            items: [],
            subtotal: 0,
            deliveryFee: 0,
            total: 0
        }
    });
});

router.post("/items", (req, res) => {
    res.json({
        success: true,
        message: "Item added to cart",
        data: req.body
    });
});

router.patch("/items/:itemId", (req, res) => {
    res.json({
        success: true,
        message: "Item updated",
        data: { itemId: req.params.itemId, ...req.body }
    });
});

router.delete("/items/:itemId", (req, res) => {
    res.json({
        success: true,
        message: "Item removed",
        data: { itemId: req.params.itemId }
    });
});

router.delete("/", (req, res) => {
    res.json({
        success: true,
        message: "Cart cleared"
    });
});

export default router;
