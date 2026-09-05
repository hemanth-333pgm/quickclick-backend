import { PaymentProvider, PaymentResult, WebhookPayload } from "./payment.interface";
import { logger } from "../../config/logger";

export class CODProvider implements PaymentProvider {
    async createPayment(order: any): Promise<PaymentResult> {
        logger.info(`💳 COD payment created for order ${order._id}`);
        return {
            success: true,
            paymentId: `COD_${order._id}`,
            status: "PENDING",
            amount: order.total,
            currency: "INR",
            provider: "COD",
        };
    }

    async verifyPayment(payload: any): Promise<PaymentResult> {
        return {
            success: true,
            paymentId: payload.paymentId || "COD_PENDING",
            status: "PENDING",
            amount: payload.amount || 0,
            currency: "INR",
            provider: "COD",
        };
    }

    async handleWebhook(payload: any): Promise<any> {
        return { received: true };
    }

    async refund(paymentId: string, amount: number): Promise<PaymentResult> {
        logger.warn(`Refund attempted for COD payment ${paymentId}`);
        return {
            success: false,
            paymentId,
            status: "FAILED",
            amount,
            currency: "INR",
            provider: "COD",
            error: "Refunds not supported for COD",
        };
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
        return {
            success: true,
            paymentId,
            status: "PENDING",
            amount: 0,
            currency: "INR",
            provider: "COD",
        };
    }
}
