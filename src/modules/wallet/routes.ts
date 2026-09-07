import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get wallet balance
router.get("/balance", (req, res) => {
    res.json({
        success: true,
        message: "Wallet balance retrieved",
        data: {
            balance: 0,
            currency: "INR",
            status: "ACTIVE"
        }
    });
});

// Get transaction history
router.get("/transactions", (req, res) => {
    res.json({
        success: true,
        message: "Transactions retrieved",
        data: []
    });
});

// Add money to wallet
router.post("/deposit", (req, res) => {
    res.json({
        success: true,
        message: "Deposit initiated",
        data: req.body
    });
});

// Withdraw from wallet
router.post("/withdraw", (req, res) => {
    res.json({
        success: true,
        message: "Withdrawal initiated",
        data: req.body
    });
});

export default router;
