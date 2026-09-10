import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Wishlist } from "./models/wishlist.model";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: any, res, next) => {
  try {
    const doc = (await Wishlist.findOne({ userId: req.user?._id })) || { products: [] };
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

router.post("/:productId", async (req: any, res, next) => {
  try {
    let doc: any = await Wishlist.findOne({ userId: req.user?._id });
    if (!doc) doc = await Wishlist.create({ userId: req.user?._id, products: [] });
    if (!doc.products.some((p: any) => String(p) === req.params.productId)) {
      doc.products.push(req.params.productId);
      await doc.save();
    }
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

router.delete("/:productId", async (req: any, res, next) => {
  try {
    const doc: any = await Wishlist.findOne({ userId: req.user?._id });
    if (doc) { doc.products.pull(req.params.productId); await doc.save(); }
    res.json({ success: true, data: doc || { products: [] } });
  } catch (e) { next(e); }
});

router.delete("/", async (req: any, res, next) => {
  try {
    await Wishlist.findOneAndDelete({ userId: req.user?._id });
    res.json({ success: true, message: "Wishlist cleared" });
  } catch (e) { next(e); }
});

export default router;
