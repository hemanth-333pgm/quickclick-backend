import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, (req, res) => {
    res.json({ 
        message: "User profile",
        data: req.user || { id: "mock-user", name: "Test User" }
    });
});

router.put("/me", authMiddleware, (req, res) => {
    res.json({ 
        message: "Profile updated",
        data: req.body
    });
});

router.get("/", authMiddleware, (req, res) => {
    res.json({ 
        message: "Users list",
        data: []
    });
});

export default router;
