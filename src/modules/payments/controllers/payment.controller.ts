import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service";
import { CODService } from "../services/cod.service";
import { RazorpayService } from "../services/razorpay.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class PaymentController {
    private paymentService: PaymentService;
    private codService: CODService;
    private razorpayService: RazorpayService;

    constructor() {
        this.paymentService = new PaymentService();
        this.codService = new CODService();
        this.razorpayService = new RazorpayService();
    }

    // ==================== COD PAYMENT ====================

    createCODOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { orderId } = req.body;
            const result = await this.codService.createCODOrder(orderId, userId);
            res.status(201).json(SuccessResponse.success("COD order created", result));
        } catch (error) {
            next(error);
        }
    };

    // ==================== RAZORPAY PAYMENTS ====================

    createRazorpayOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { orderId } = req.body;
            const result = await this.razorpayService.createOrder(orderId);
            res.status(201).json(SuccessResponse.success("Razorpay order created", result));
        } catch (error) {
            next(error);
        }
    };

    verifyRazorpayPayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
            
            const result = await this.razorpayService.verifyPayment(
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            );
            
            res.status(200).json(SuccessResponse.success("Payment verified", result));
        } catch (error) {
            next(error);
        }
    };

    razorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.razorpayService.handleWebhook(req.body);
            res.status(200).json(SuccessResponse.success("Webhook received", result));
        } catch (error) {
            next(error);
        }
    };

    // ==================== PAYMENT STATUS ====================

    getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await this.paymentService.getPaymentStatus(id);
            res.json(SuccessResponse.success("Payment status retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    refundPayment = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { amount } = req.body;
            const result = await this.razorpayService.refundPayment(id, amount);
            res.json(SuccessResponse.success("Refund processed", result));
        } catch (error) {
            next(error);
        }
    };
}
