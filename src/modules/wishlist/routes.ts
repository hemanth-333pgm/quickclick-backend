import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Wishlist retrieved",
        data: { products: [] }
    });
});

router.post("/:productId", (req, res) => {
    res.json({
        success: true,
        message: "Added to wishlist",
        data: { productId: req.params.productId }
    });
});

router.delete("/:productId", (req, res) => {
    res.json({
        success: true,
        message: "Removed from wishlist",
        data: { productId: req.params.productId }
    });
});

router.delete("/", (req, res) => {
    res.json({
        success: true,
        message: "Wishlist cleared"
    });
});

export default router;
