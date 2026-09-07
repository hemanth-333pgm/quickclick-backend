import { Router } from "express";
import { CategoryController } from "./controllers/category.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// Admin routes
router.post("/", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), categoryController.createCategory);
router.put("/:id", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), categoryController.updateCategory);
router.delete("/:id", authMiddleware, rbacMiddleware(Roles.ANY_ADMIN), categoryController.deleteCategory);

export default router;
