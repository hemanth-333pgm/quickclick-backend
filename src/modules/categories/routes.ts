import { Router } from "express";
import { Category } from "./models/category.model";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const cats = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: cats });
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Category not found" } });
    res.json({ success: true, data: cat });
  } catch (e) { next(e); }
});

export default router;
