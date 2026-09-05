import { PaymentProvider, PaymentResult } from "../../../integrations/payments/payment.interface";
import { CODProvider } from "../../../integrations/payments/cod.provider";
import { Payment } from "../models/payment.model";
import { Order } from "../../orders/models/order.model";
import { logger } from "../../../config/logger";

export class PaymentService {
    private providers: Map<string, PaymentProvider> = new Map();

    constructor() {
        // Register providers
        this.providers.set("COD", new CODProvider());
        
        // Future providers
        // this.providers.set("RAZORPAY", new RazorpayProvider());
        // this.providers.set("STRIPE", new StripeProvider());
        
        logger.info(`💳 Payment service initialized with providers: ${Array.from(this.providers.keys()).join(", ")}`);
    }

    async processPayment(
        orderId: string,
        method: string,
        amount: number,
        metadata?: any
    ): Promise<PaymentResult> {
        try {
            const provider = this.providers.get(method);
            if (!provider) {
                throw new Error(`Payment provider ${method} not found`);
            }

            // Get order
            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error("Order not found");
            }

            // Create payment record
            const payment = new Payment({
                orderId: order._id,
                method,
                amount,
                status: "PENDING",
                metadata,
            });
            await payment.save();

            // Process with provider
            const result = await provider.createPayment(order);

            // Update payment record
            payment.status = result.status;
            payment.transactionId = result.paymentId;
            await payment.save();

            // Update order payment status
            order.paymentStatus = result.status === "COMPLETED" ? "COMPLETED" : "PENDING";
            await order.save();

            return result;
        } catch (error) {
            logger.error("Payment processing error:", error);
            throw error;
        }
    }

    async verifyPayment(paymentId: string, payload: any): Promise<PaymentResult> {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error("Payment not found");
        }

        const provider = this.providers.get(payment.method);
        if (!provider) {
            throw new Error(`Payment provider ${payment.method} not found`);
        }

        return await provider.verifyPayment(payload);
    }

    async handleWebhook(payload: any): Promise<any> {
        const { provider, event } = payload;
        const paymentProvider = this.providers.get(provider);
        if (!paymentProvider) {
            throw new Error(`Payment provider ${provider} not found`);
        }

        return await paymentProvider.handleWebhook(payload);
    }

    async refundPayment(paymentId: string, amount: number): Promise<PaymentResult> {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error("Payment not found");
        }

        const provider = this.providers.get(payment.method);
        if (!provider) {
            throw new Error(`Payment provider ${payment.method} not found`);
        }

        return await provider.refund(paymentId, amount);
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error("Payment not found");
        }

        const provider = this.providers.get(payment.method);
        if (!provider) {
            throw new Error(`Payment provider ${payment.method} not found`);
        }

        return await provider.getPaymentStatus(paymentId);
    }
}
