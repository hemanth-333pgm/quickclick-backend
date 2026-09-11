import { Router } from "express";
import { Product } from "./models/product.model";
import { Retailer } from "../retailers/models/retailer.model";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rbacMiddleware, Roles } from "../../middleware/rbac.middleware";

const router = Router();

// ── Helper: allow RETAILER or ADMIN or SUPER_ADMIN ─────────
// rbacMiddleware takes a single role string, so we dispatch manually.
const requireRetailerOrAdmin = (req: any, res: any, next: any) => {
  const role = req.user?.role || req.userRole || req.userData?.role;
  if (role === "RETAILER" || role === "ADMIN" || role === "SUPER_ADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: { code: "AUTH_FORBIDDEN", message: "Insufficient permissions" },
  });
};

// ═══════════════════════════════════════════════════════════
// PUBLIC
// ═══════════════════════════════════════════════════════════

// GET /api/v1/products?categoryId=&retailerId=&search=&featured=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { categoryId, retailerId, search, featured, status } = req.query;
    const page  = Math.max(1, parseInt((req.query.page  as string) || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "20", 10)));

    const filter: any = { status: status ? String(status) : "ACTIVE" };
    if (categoryId) filter.categoryId = categoryId;
    if (retailerId) filter.retailerId = retailerId;
    if (featured === "true") filter.isFeatured = true;

    if (search) {
      filter.$or = [
        { name:        { $regex: String(search), $options: "i" } },
        { description: { $regex: String(search), $options: "i" } },
        { tags:        { $regex: String(search), $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .populate("retailerId", "shopName location rating")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ isFeatured: -1, createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: "Products list",
      data: items,
      meta: {
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (e) { next(e); }
});

// GET /api/v1/products/featured
router.get("/featured", async (_req, res, next) => {
  try {
    const items = await Product.find({ status: "ACTIVE", isFeatured: true })
      .populate("categoryId", "name slug")
      .populate("retailerId", "shopName location")
      .limit(20);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

// GET /api/v1/products/search?q=...
router.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ success: true, data: [] });

    const items = await Product.find({
      status: "ACTIVE",
      $or: [
        { name:        { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags:        { $regex: q, $options: "i" } },
      ],
    }).limit(50);

    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

// GET /api/v1/products/:id  — MUST be after /featured and /search
router.get("/:id", async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id)
      .populate("categoryId", "name slug")
      .populate("retailerId", "shopName location rating phone");

    if (!p) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Product not found" },
      });
    }
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════
// RETAILER / ADMIN — create, update, delete, stock
// ═══════════════════════════════════════════════════════════

router.post("/", authMiddleware, requireRetailerOrAdmin, async (req: any, res, next) => {
  try {
    const retailer = await Retailer.findOne({ ownerId: req.user._id });
    if (!retailer) {
      return res.status(404).json({
        success: false,
        error: { code: "RESOURCE_NOT_FOUND", message: "Retailer profile not found" },
      });
    }
    const p = await Product.create({ ...req.body, retailerId: retailer._id });
    res.status(201).json({ success: true, data: p });
  } catch (e) { next(e); }
});

router.put("/:id", authMiddleware, requireRetailerOrAdmin, async (req: any, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Product not found" } });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

router.delete("/:id", authMiddleware, requireRetailerOrAdmin, async (req: any, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, { status: "INACTIVE" }, { new: true });
    if (!p) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Product not found" } });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

router.patch("/:id/stock", authMiddleware, requireRetailerOrAdmin, async (req: any, res, next) => {
  try {
    const { stock } = req.body;
    if (typeof stock !== "number") {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "stock (number) required" } });
    }
    const p = await Product.findByIdAndUpdate(req.params.id, { stockQty: stock }, { new: true });
    if (!p) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Product not found" } });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — status change
// ═══════════════════════════════════════════════════════════

router.put("/:id/status", authMiddleware, rbacMiddleware(Roles.ADMIN), async (req: any, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!p) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Product not found" } });
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
});

export default router;



