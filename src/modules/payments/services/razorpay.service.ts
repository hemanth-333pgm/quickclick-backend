import { Payment } from "../models/payment.model";
import { Order } from "../../orders/models/order.model";
import { logger } from "../../../config/logger";

export class RazorpayService {
    async createOrder(orderId: string): Promise<any> {
        const order = await Order.findById(orderId);
        if (!order) throw new Error("Order not found");

        const payment = await Payment.create({
            orderId: order._id,
            userId: order.userId,
            amount: order.total,
            currency: "INR",
            method: "RAZORPAY",
            status: "PENDING",
            razorpayOrderId: `order_${order.orderNumber}`,
            transactionId: `order_${order.orderNumber}`,
        });

        return {
            orderId: payment.razorpayOrderId,
            amount: payment.amount * 100,
            currency: payment.currency,
            key: process.env.RAZORPAY_KEY_ID || "test_key",
            payment,
        };
    }

    async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<any> {
        const payment = await Payment.findOne({ razorpayOrderId });
        if (!payment) throw new Error("Payment not found");

        payment.status = "COMPLETED";
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.paidAt = new Date();
        await payment.save();

        await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: "COMPLETED" });
        return { success: true, payment };
    }

    async handleWebhook(payload: any): Promise<any> {
        logger.info("Webhook received:", payload);
        return { success: true };
    }

    async refundPayment(paymentId: string, amount?: number): Promise<any> {
        const payment = await Payment.findById(paymentId);
        if (!payment) throw new Error("Payment not found");

        payment.status = "REFUNDED";
        payment.refundedAt = new Date();
        payment.refundAmount = amount || payment.amount;
        await payment.save();

        return { success: true, payment };
    }
}
