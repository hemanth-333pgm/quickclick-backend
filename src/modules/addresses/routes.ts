import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
    res.json({ message: "Addresses list" });
});

router.post("/", authMiddleware, (req, res) => {
    res.json({ message: "Address created" });
});

router.patch("/:id", authMiddleware, (req, res) => {
    res.json({ message: "Address updated" });
});

router.delete("/:id", authMiddleware, (req, res) => {
    res.json({ message: "Address deleted" });
});

router.post("/:id/default", authMiddleware, (req, res) => {
    res.json({ message: "Default address set" });
});

export default router;
