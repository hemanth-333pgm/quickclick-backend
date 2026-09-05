import { Router } from "express";

const router = Router();

router.post("/send-otp", (req, res) => {
    res.json({ message: "OTP sent" });
});

router.post("/verify-otp", (req, res) => {
    res.json({ message: "OTP verified", accessToken: "mock-token" });
});

router.post("/logout", (req, res) => {
    res.json({ message: "Logged out" });
});

router.post("/refresh", (req, res) => {
    res.json({ message: "Token refreshed" });
});

export default router;
