import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware as authenticate } from "../../middleware/auth.middleware";
import { Retailer } from "../retailers/models/retailer.model";
import { Category } from "../categories/models/category.model";

const router = Router();

router.get("/stores/nearby", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat((req.query.radius as string) || "5");
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "lat and lng are required" },
      });
    }
    const stores = await Retailer.find({
      status: "APPROVED",
      isOpen: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(50);
    res.json({ success: true, data: stores });
  } catch (e) { next(e); }
});

router.get("/stores/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Retailer.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Store not found" },
      });
    }
    res.json({ success: true, data: store });
  } catch (e) { next(e); }
});

router.get("/catalog/categories", async (_req: Request, res: Response) => {
  try {
    const cats = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: cats });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to load categories" },
    });
  }
});

export default router;
