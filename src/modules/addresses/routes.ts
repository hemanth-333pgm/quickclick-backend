import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Address } from "./models/address.model";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: any, res, next) => {
  try {
    const list = await Address.find({ userId: req.user?._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (e) { next(e); }
});

router.post("/", async (req: any, res, next) => {
  try {
    const created = await Address.create({ ...req.body, userId: req.user?._id });
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

router.get("/:id", async (req: any, res, next) => {
  try {
    const doc = await Address.findOne({ _id: req.params.id, userId: req.user?._id });
    if (!doc) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Address not found" } });
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

router.patch("/:id", async (req: any, res, next) => {
  try {
    const doc = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { $set: req.body },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Address not found" } });
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req: any, res, next) => {
  try {
    const doc = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user?._id });
    if (!doc) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Address not found" } });
    res.json({ success: true, message: "Address deleted" });
  } catch (e) { next(e); }
});

router.post("/:id/default", async (req: any, res, next) => {
  try {
    await Address.updateMany({ userId: req.user?._id }, { $set: { isDefault: false } });
    const doc = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      { $set: { isDefault: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "Address not found" } });
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

export default router;
