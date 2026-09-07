import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.post("/submit", authMiddleware, (req, res) => {
    res.json({ message: "KYC submitted" });
});

router.get("/status", authMiddleware, (req, res) => {
    res.json({ message: "KYC status" });
});

export default router;
