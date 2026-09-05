import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { mobile, purpose = "LOGIN" } = req.body;
        const result = await authService.sendOTP(mobile, purpose);
        res.json({ success: true, message: "OTP sent", data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { mobile, otp } = req.body;
        const result = await authService.verifyOTP(mobile, otp);
        res.json({ success: true, message: "OTP verified", data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
