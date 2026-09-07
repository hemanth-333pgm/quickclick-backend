import { Payment } from "../models/payment.model";
import { Order } from "../../orders/models/order.model";
import { PaymentStatus } from "../../../common/constants/status.constants";

export class CODService {
    async createCODOrder(orderId: string, userId: string): Promise<any> {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error("Order not found");
        }

        const payment = await Payment.create({
            orderId: order._id,
            userId,
            amount: order.total,
            currency: "INR",
            method: "COD",
            status: PaymentStatus.PENDING,
            transactionId: `COD_${order.orderNumber}`,
        });

        return {
            payment,
            message: "COD order created. Payment will be collected on delivery.",
        };
    }

    async completeCODOrder(orderId: string): Promise<any> {
        const payment = await Payment.findOne({ orderId, method: "COD" });
        if (!payment) {
            throw new Error("Payment not found");
        }

        payment.status = PaymentStatus.COMPLETED;
        payment.paidAt = new Date();
        await payment.save();

        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: PaymentStatus.COMPLETED,
        });

        return payment;
    }
}
