import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Addresses retrieved",
        data: [
            {
                _id: "addr_1",
                address: "123 Main Street, New Delhi",
                latitude: 28.6139,
                longitude: 77.2090,
                type: "HOME",
                label: "Home",
                isDefault: true
            }
        ]
    });
});

router.post("/", (req, res) => {
    res.json({
        success: true,
        message: "Address added",
        data: { _id: "addr_new", ...req.body }
    });
});

router.patch("/:id", (req, res) => {
    res.json({
        success: true,
        message: "Address updated",
        data: { id: req.params.id, ...req.body }
    });
});

router.delete("/:id", (req, res) => {
    res.json({
        success: true,
        message: "Address deleted",
        data: { id: req.params.id }
    });
});

router.post("/:id/default", (req, res) => {
    res.json({
        success: true,
        message: "Default address set",
        data: { id: req.params.id, isDefault: true }
    });
});

export default router;
