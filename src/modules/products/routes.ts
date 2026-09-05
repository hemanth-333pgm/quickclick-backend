import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();

// Public routes
router.get("/", (req, res) => {
    res.json({ 
        message: "Products list",
        data: []
    });
});

router.get("/:id", (req, res) => {
    res.json({ 
        message: "Product details",
        data: { id: req.params.id, name: "Sample Product" }
    });
});

// Retailer routes
router.post("/", 
    authMiddleware, 
    rbacMiddleware(Roles.RETAILER), 
    (req, res) => {
        res.json({ 
            message: "Product created",
            data: req.body
        });
    }
);

router.put("/:id", 
    authMiddleware, 
    rbacMiddleware(Roles.RETAILER), 
    (req, res) => {
        res.json({ 
            message: "Product updated",
            data: { id: req.params.id, ...req.body }
        });
    }
);

router.delete("/:id", 
    authMiddleware, 
    rbacMiddleware(Roles.RETAILER), 
    (req, res) => {
        res.json({ 
            message: "Product deleted",
            data: { productId: req.params.id }
        });
    }
);

router.patch("/:id/stock",
    authMiddleware,
    rbacMiddleware(Roles.RETAILER),
    (req, res) => {
        res.json({ 
            message: "Stock updated",
            data: { productId: req.params.id, stock: req.body.stock }
        });
    }
);

// Admin routes
router.put("/:id/status",
    authMiddleware,
    rbacMiddleware(Roles.ANY_ADMIN),
    (req, res) => {
        res.json({ 
            message: "Product status updated",
            data: { productId: req.params.id, status: req.body.status }
        });
    }
);

export default router;
