import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();

// Public routes
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Categories retrieved",
        data: [
            { _id: "1", name: "Fruits & Vegetables", slug: "fruits-vegetables" },
            { _id: "2", name: "Groceries", slug: "groceries" },
            { _id: "3", name: "Dairy", slug: "dairy" }
        ]
    });
});

router.get("/:id", (req, res) => {
    res.json({
        success: true,
        message: "Category retrieved",
        data: { _id: req.params.id, name: "Sample Category", slug: "sample-category" }
    });
});

router.get("/slug/:slug", (req, res) => {
    res.json({
        success: true,
        message: "Category retrieved by slug",
        data: { slug: req.params.slug, name: "Sample Category" }
    });
});

// Admin routes
router.post("/", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), (req, res) => {
    res.json({
        success: true,
        message: "Category created",
        data: req.body
    });
});

router.put("/:id", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), (req, res) => {
    res.json({
        success: true,
        message: "Category updated",
        data: { id: req.params.id, ...req.body }
    });
});

router.delete("/:id", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), (req, res) => {
    res.json({
        success: true,
        message: "Category deleted",
        data: { id: req.params.id }
    });
});

export default router;
