import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/daily", authMiddleware, (req, res) => {
    res.json({ message: "Daily report" });
});

router.get("/weekly", authMiddleware, (req, res) => {
    res.json({ message: "Weekly report" });
});

router.get("/monthly", authMiddleware, (req, res) => {
    res.json({ message: "Monthly report" });
});

export default router;
