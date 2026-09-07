import { Order } from "../../orders/models/order.model";
import { User } from "../../users/models/user.model";
import { Retailer } from "../../retailers/models/retailer.model";
import { DeliveryPartner } from "../../delivery/models/delivery-partner.model";
import { Product } from "../../products/models/product.model";
import { DeliveryAssignment } from "../../delivery/models/delivery-assignment.model";
import { logger } from "../../../config/logger";

export class ReportService {
    async generateSalesReport(startDate: Date, endDate: Date): Promise<any> {
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: "DELIVERED",
        });

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Daily breakdown
        const dailyData: any = {};
        for (const order of orders) {
            const day = order.createdAt.toISOString().split('T')[0];
            if (!dailyData[day]) {
                dailyData[day] = { orders: 0, revenue: 0 };
            }
            dailyData[day].orders++;
            dailyData[day].revenue += order.total;
        }

        // Top products - Fix: Convert ObjectId to string
        const productMap: any = {};
        for (const order of orders) {
            for (const item of order.items) {
                const productId = item.productId.toString();
                if (!productMap[productId]) {
                    productMap[productId] = {
                        productId: item.productId,
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productMap[productId].quantity += item.quantity;
                productMap[productId].revenue += item.total;
            }
        }
        const topProducts = Object.values(productMap)
            .sort((a: any, b: any) => b.revenue - a.revenue)
            .slice(0, 10);

        return {
            period: {
                start: startDate,
                end: endDate,
            },
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
            },
            dailyData,
            topProducts,
            generatedAt: new Date(),
        };
    }

    async generateRetailerReport(retailerId: string, startDate: Date, endDate: Date): Promise<any> {
        const orders = await Order.find({
            retailerId,
            createdAt: { $gte: startDate, $lte: endDate },
        });

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === "DELIVERED").length;
        const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;
        const rejectedOrders = orders.filter(o => o.status === "REJECTED").length;

        // Order status breakdown
        const statusBreakdown: any = {};
        for (const order of orders) {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        }

        // Average delivery time - Fix: Use order fields
        let totalDeliveryTime = 0;
        let deliveredOrders = 0;
        for (const order of orders) {
            if (order.status === "DELIVERED" && order.updatedAt && order.createdAt) {
                // Check if order has delivery time tracking
                const deliveryTime = order.updatedAt.getTime() - order.createdAt.getTime();
                totalDeliveryTime += deliveryTime / 60000;
                deliveredOrders++;
            }
        }
        const avgDeliveryTime = deliveredOrders > 0 ? totalDeliveryTime / deliveredOrders : 0;

        return {
            retailerId,
            period: {
                start: startDate,
                end: endDate,
            },
            summary: {
                totalRevenue,
                totalOrders,
                completedOrders,
                cancelledOrders,
                rejectedOrders,
                completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
                avgDeliveryTime,
            },
            statusBreakdown,
            orders,
            generatedAt: new Date(),
        };
    }

    async generateDeliveryPartnerReport(partnerId: string, startDate: Date, endDate: Date): Promise<any> {
        const assignments = await DeliveryAssignment.find({
            deliveryPartnerId: partnerId,
            createdAt: { $gte: startDate, $lte: endDate },
        });

        const totalDeliveries = assignments.length;
        const completedDeliveries = assignments.filter(a => a.status === "DELIVERED").length;
        const rejectedDeliveries = assignments.filter(a => a.status === "REJECTED").length;
        const cancelledDeliveries = assignments.filter(a => a.status === "CANCELLED").length;

        let totalEarnings = 0;
        let totalDistance = 0;
        let totalTime = 0;

        for (const assignment of assignments) {
            if (assignment.earnings) {
                totalEarnings += assignment.earnings;
            }
            if (assignment.distanceKm) {
                totalDistance += assignment.distanceKm;
            }
            if (assignment.durationMinutes) {
                totalTime += assignment.durationMinutes;
            }
        }

        return {
            partnerId,
            period: {
                start: startDate,
                end: endDate,
            },
            summary: {
                totalDeliveries,
                completedDeliveries,
                rejectedDeliveries,
                cancelledDeliveries,
                successRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
                totalEarnings,
                totalDistance,
                totalTime,
                averageEarnings: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
            },
            assignments,
            generatedAt: new Date(),
        };
    }

    async generateCustomerReport(customerId: string, startDate: Date, endDate: Date): Promise<any> {
        const orders = await Order.find({
            userId: customerId,
            createdAt: { $gte: startDate, $lte: endDate },
        });

        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;
        const completedOrders = orders.filter(o => o.status === "DELIVERED").length;
        const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;

        // Most ordered products - Fix: Convert ObjectId to string
        const productMap: any = {};
        for (const order of orders) {
            if (order.status !== "DELIVERED") continue;
            for (const item of order.items) {
                const productId = item.productId.toString();
                if (!productMap[productId]) {
                    productMap[productId] = {
                        productId: item.productId,
                        name: item.name,
                        quantity: 0,
                    };
                }
                productMap[productId].quantity += item.quantity;
            }
        }
        const topProducts = Object.values(productMap)
            .sort((a: any, b: any) => b.quantity - a.quantity)
            .slice(0, 10);

        // Preferred retailers - Fix: Convert ObjectId to string
        const retailerMap: any = {};
        for (const order of orders) {
            if (order.status !== "DELIVERED") continue;
            const retailerId = order.retailerId.toString();
            if (!retailerMap[retailerId]) {
                retailerMap[retailerId] = {
                    retailerId: order.retailerId,
                    orders: 0,
                    spent: 0,
                };
            }
            retailerMap[retailerId].orders++;
            retailerMap[retailerId].spent += order.total;
        }
        const topRetailers = Object.values(retailerMap)
            .sort((a: any, b: any) => b.orders - a.orders)
            .slice(0, 5);

        return {
            customerId,
            period: {
                start: startDate,
                end: endDate,
            },
            summary: {
                totalSpent,
                totalOrders,
                completedOrders,
                cancelledOrders,
                averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
            },
            topProducts,
            topRetailers,
            generatedAt: new Date(),
        };
    }

    async generateProductReport(productId: string, startDate: Date, endDate: Date): Promise<any> {
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: "DELIVERED",
        });

        let totalQuantity = 0;
        let totalRevenue = 0;
        let orderCount = 0;

        for (const order of orders) {
            for (const item of order.items) {
                if (item.productId.toString() === productId) {
                    totalQuantity += item.quantity;
                    totalRevenue += item.total;
                    orderCount++;
                }
            }
        }

        return {
            productId,
            period: {
                start: startDate,
                end: endDate,
            },
            summary: {
                totalQuantity,
                totalRevenue,
                orderCount,
                averagePrice: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
            },
            generatedAt: new Date(),
        };
    }
}
