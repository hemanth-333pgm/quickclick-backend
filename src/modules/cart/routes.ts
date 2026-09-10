import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Cart } from "./models/cart.model";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: any, res, next) => {
  try {
    const cart = (await Cart.findOne({ userId: req.user?._id })) || { items: [], subtotal: 0 };
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.post("/items", async (req: any, res, next) => {
  try {
    let cart: any = await Cart.findOne({ userId: req.user?._id });
    if (!cart) cart = await Cart.create({ userId: req.user?._id, items: [] });
    const { productId, quantity = 1 } = req.body;
    const idx = cart.items.findIndex((it: any) => String(it.productId) === String(productId));
    if (idx >= 0) cart.items[idx].quantity += quantity;
    else cart.items.push({ productId, quantity });
    cart.subtotal = cart.items.reduce((s: number, it: any) => s + (it.price || 0) * it.quantity, 0);
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.patch("/items/:itemId", async (req: any, res, next) => {
  try {
    const cart: any = await Cart.findOne({ userId: req.user?._id });
    if (!cart) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Cart not found" } });
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Item not found" } });
    item.quantity = req.body.quantity;
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.delete("/items/:itemId", async (req: any, res, next) => {
  try {
    const cart: any = await Cart.findOne({ userId: req.user?._id });
    if (!cart) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Cart not found" } });
    cart.items.pull({ _id: req.params.itemId });
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (e) { next(e); }
});

router.delete("/", async (req: any, res, next) => {
  try {
    await Cart.findOneAndDelete({ userId: req.user?._id });
    res.json({ success: true, message: "Cart cleared" });
  } catch (e) { next(e); }
});

export default router;
