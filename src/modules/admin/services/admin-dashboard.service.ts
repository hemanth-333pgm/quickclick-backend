import mongoose from "mongoose";
import { DashboardAnalytics } from "../models/dashboard.model";
import { ActivityLog } from "../models/activity-log.model";
import { Order } from "../../orders/models/order.model";
import { User } from "../../users/models/user.model";
import { Retailer } from "../../retailers/models/retailer.model";
import { DeliveryPartner } from "../../delivery/models/delivery-partner.model";
import { Product } from "../../products/models/product.model";
import { Zone } from "../../zones/models/zone.model";
import { OrderStatus, UserRoles, RetailerStatus } from "../../../common/constants/status.constants";
import { cacheServiceEnhanced } from "../../../config/cache.service";
import { logger } from "../../../config/logger";

export class AdminDashboardService {
    private readonly CACHE_TTL = 300; // 5 minutes
    private readonly CACHE_PREFIX = "dashboard";

    async getDashboardMetrics(): Promise<any> {
        const cacheKey = "metrics";
        const cached = await cacheServiceEnhanced.get(cacheKey, {
            ttl: this.CACHE_TTL,
            keyPrefix: this.CACHE_PREFIX,
        });

        if (cached) return cached;

        const metrics = await this.calculateMetrics();
        
        await cacheServiceEnhanced.set(cacheKey, metrics, {
            ttl: this.CACHE_TTL,
            keyPrefix: this.CACHE_PREFIX,
        });

        return metrics;
    }

    private async calculateMetrics(): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 30);

        const [
            totalUsers,
            activeUsers,
            newUsersToday,
            totalRetailers,
            activeRetailers,
            pendingRetailers,
            totalDeliveryPartners,
            activeDeliveryPartners,
            onlineDeliveryPartners,
            totalOrders,
            pendingOrders,
            processingOrders,
            completedOrders,
            cancelledOrders,
            totalRevenue,
            todayRevenue,
            weekRevenue,
            monthRevenue,
            averageOrderValue,
            topRetailers,
            topProducts,
            orderTrends,
            zoneStats,
        ] = await Promise.all([
            // User metrics
            User.countDocuments(),
            User.countDocuments({ status: "ACTIVE" }),
            User.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),

            // Retailer metrics
            Retailer.countDocuments(),
            Retailer.countDocuments({ status: RetailerStatus.APPROVED }),
            Retailer.countDocuments({ status: RetailerStatus.PENDING }),

            // Delivery partner metrics
            DeliveryPartner.countDocuments(),
            DeliveryPartner.countDocuments({ status: "APPROVED", isVerified: true }),
            DeliveryPartner.countDocuments({ availability: "ONLINE" }),

            // Order metrics
            Order.countDocuments(),
            Order.countDocuments({ status: OrderStatus.PLACED }),
            Order.countDocuments({
                status: {
                    $in: [
                        OrderStatus.ACCEPTED,
                        OrderStatus.PREPARING,
                        OrderStatus.READY_FOR_PICKUP,
                        OrderStatus.ASSIGNED,
                        OrderStatus.PICKED_UP,
                        OrderStatus.OUT_FOR_DELIVERY,
                    ],
                },
            }),
            Order.countDocuments({ status: OrderStatus.DELIVERED }),
            Order.countDocuments({ status: OrderStatus.CANCELLED }),

            // Revenue metrics
            this.calculateTotalRevenue(),
            this.calculateRevenueForPeriod(today, todayEnd),
            this.calculateRevenueForPeriod(weekStart, todayEnd),
            this.calculateRevenueForPeriod(monthStart, todayEnd),

            // Average order value
            this.calculateAverageOrderValue(),

            // Top retailers
            this.getTopRetailers(10),
            this.getTopProducts(10),
            this.getOrderTrends(7),
            this.getZoneStats(),
        ]);

        return {
            metrics: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    newToday: newUsersToday,
                    growth: this.calculateGrowth("users"),
                },
                retailers: {
                    total: totalRetailers,
                    active: activeRetailers,
                    pending: pendingRetailers,
                    approvalRate: totalRetailers > 0 ? (activeRetailers / totalRetailers) * 100 : 0,
                },
                deliveryPartners: {
                    total: totalDeliveryPartners,
                    active: activeDeliveryPartners,
                    online: onlineDeliveryPartners,
                    onlineRate: activeDeliveryPartners > 0 ? (onlineDeliveryPartners / activeDeliveryPartners) * 100 : 0,
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    processing: processingOrders,
                    completed: completedOrders,
                    cancelled: cancelledOrders,
                    completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
                },
                revenue: {
                    total: totalRevenue,
                    today: todayRevenue,
                    week: weekRevenue,
                    month: monthRevenue,
                    averageOrderValue: averageOrderValue,
                },
            },
            topRetailers,
            topProducts,
            orderTrends,
            zoneStats,
            timestamp: new Date().toISOString(),
        };
    }

    private async calculateTotalRevenue(): Promise<number> {
        const result = await Order.aggregate([
            {
                $match: {
                    status: OrderStatus.DELIVERED,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$total" },
                },
            },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }

    private async calculateRevenueForPeriod(start: Date, end: Date): Promise<number> {
        const result = await Order.aggregate([
            {
                $match: {
                    status: OrderStatus.DELIVERED,
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$total" },
                },
            },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }

    private async calculateAverageOrderValue(): Promise<number> {
        const result = await Order.aggregate([
            {
                $match: {
                    status: OrderStatus.DELIVERED,
                },
            },
            {
                $group: {
                    _id: null,
                    average: { $avg: "$total" },
                },
            },
        ]);
        return result.length > 0 ? Math.round(result[0].average) : 0;
    }

    private async getTopRetailers(limit: number): Promise<any[]> {
        return await Order.aggregate([
            {
                $match: {
                    status: OrderStatus.DELIVERED,
                },
            },
            {
                $group: {
                    _id: "$retailerId",
                    totalOrders: { $sum: 1 },
                    revenue: { $sum: "$total" },
                    averageOrderValue: { $avg: "$total" },
                },
            },
            {
                $lookup: {
                    from: "retailers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "retailer",
                },
            },
            {
                $unwind: "$retailer",
            },
            {
                $lookup: {
                    from: "users",
                    localField: "retailer.ownerId",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            {
                $unwind: {
                    path: "$owner",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    retailerId: "$_id",
                    shopName: "$retailer.shopName",
                    ownerName: "$owner.name",
                    totalOrders: 1,
                    revenue: 1,
                    averageOrderValue: 1,
                    rating: "$retailer.rating",
                },
            },
            {
                $sort: { revenue: -1 },
            },
            {
                $limit: limit,
            },
        ]);
    }

    private async getTopProducts(limit: number): Promise<any[]> {
        return await Order.aggregate([
            {
                $match: {
                    status: OrderStatus.DELIVERED,
                },
            },
            {
                $unwind: "$items",
            },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.total" },
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product",
                },
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    productId: "$_id",
                    name: 1,
                    totalSold: 1,
                    revenue: 1,
                    imageUrl: { $arrayElemAt: ["$product.imageUrl", 0] },
                },
            },
            {
                $sort: { totalSold: -1 },
            },
            {
                $limit: limit,
            },
        ]);
    }

    private async getOrderTrends(days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        return await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    },
                    orders: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", OrderStatus.DELIVERED] },
                                "$total",
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $sort: { "_id.date": 1 },
            },
            {
                $project: {
                    date: "$_id.date",
                    orders: 1,
                    revenue: 1,
                    _id: 0,
                },
            },
        ]);
    }

    private async getZoneStats(): Promise<any[]> {
        return await Zone.aggregate([
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "zoneId",
                    as: "orders",
                },
            },
            {
                $addFields: {
                    totalOrders: { $size: "$orders" },
                    revenue: {
                        $sum: {
                            $map: {
                                input: "$orders",
                                as: "order",
                                in: {
                                    $cond: [
                                        { $eq: ["$$order.status", OrderStatus.DELIVERED] },
                                        "$$order.total",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                    retailerCount: { $size: "$retailers" },
                },
            },
            {
                $project: {
                    zoneId: "$_id",
                    name: 1,
                    orders: "$totalOrders",
                    revenue: 1,
                    retailers: "$retailerCount",
                },
            },
            {
                $sort: { orders: -1 },
            },
            {
                $limit: 5,
            },
        ]);
    }

    private calculateGrowth(type: string): number {
        // Simplified growth calculation
        // In production, compare with previous period
        return Math.round(Math.random() * 20 + 5); // Placeholder
    }

    async getRealtimeStats(): Promise<any> {
        const cacheKey = "realtime";
        const cached = await cacheServiceEnhanced.get(cacheKey, {
            ttl: 30, // 30 seconds
            keyPrefix: this.CACHE_PREFIX,
        });

        if (cached) return cached;

        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

        const [recentOrders, recentUsers, activeOrders] = await Promise.all([
            Order.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
            User.countDocuments({ lastLoginAt: { $gte: fiveMinutesAgo } }),
            Order.countDocuments({
                status: {
                    $in: [
                        OrderStatus.PLACED,
                        OrderStatus.ACCEPTED,
                        OrderStatus.PREPARING,
                        OrderStatus.READY_FOR_PICKUP,
                        OrderStatus.ASSIGNED,
                        OrderStatus.PICKED_UP,
                        OrderStatus.OUT_FOR_DELIVERY,
                    ],
                },
            }),
        ]);

        const stats = {
            recentOrders,
            recentUsers,
            activeOrders,
            timestamp: now.toISOString(),
        };

        await cacheServiceEnhanced.set(cacheKey, stats, {
            ttl: 30,
            keyPrefix: this.CACHE_PREFIX,
        });

        return stats;
    }

    async getActivityLogs(filters: {
        userId?: string;
        module?: string;
        action?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<any> {
        const query: any = {};

        if (filters.userId) query.userId = filters.userId;
        if (filters.module) query.module = filters.module;
        if (filters.action) query.action = filters.action;
        if (filters.status) query.status = filters.status;
        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) query.createdAt.$gte = filters.startDate;
            if (filters.endDate) query.createdAt.$lte = filters.endDate;
        }

        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 100);
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .populate("userId", "name mobile email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(query),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async logActivity(data: {
        userId: string;
        userName: string;
        userRole: string;
        action: string;
        module: string;
        entityId?: string;
        entityType?: string;
        changes?: any;
        ipAddress: string;
        userAgent: string;
        status?: "SUCCESS" | "FAILED";
        errorMessage?: string;
        metadata?: any;
    }): Promise<void> {
        try {
            await ActivityLog.create({
                userId: new mongoose.Types.ObjectId(data.userId),
                userName: data.userName,
                userRole: data.userRole,
                action: data.action,
                module: data.module,
                entityId: data.entityId ? new mongoose.Types.ObjectId(data.entityId) : undefined,
                entityType: data.entityType,
                changes: data.changes,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                status: data.status || "SUCCESS",
                errorMessage: data.errorMessage,
                metadata: data.metadata,
            });
        } catch (error) {
            logger.error("Failed to log activity:", error);
        }
    }

    async getDashboardAnalytics(date?: Date): Promise<any> {
        const targetDate = date || new Date();
        targetDate.setHours(0, 0, 0, 0);

        let analytics = await DashboardAnalytics.findOne({ date: targetDate });

        if (!analytics) {
            // Generate analytics if not exists
            const metrics = await this.calculateMetrics();
            analytics = await DashboardAnalytics.create({
                date: targetDate,
                ...metrics,
            });
        }

        return analytics;
    }

    async getChartData(
        type: "orders" | "revenue" | "users" | "retailers",
        period: "day" | "week" | "month" | "year"
    ): Promise<any> {
        const cacheKey = `chart:${type}:${period}`;
        const cached = await cacheServiceEnhanced.get(cacheKey, {
            ttl: 3600,
            keyPrefix: this.CACHE_PREFIX,
        });

        if (cached) return cached;

        let startDate = new Date();
        let groupFormat = "";

        switch (period) {
            case "day":
                startDate.setHours(0, 0, 0, 0);
                groupFormat = "%Y-%m-%d %H:00";
                break;
            case "week":
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                groupFormat = "%Y-%m-%d";
                break;
            case "month":
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                groupFormat = "%Y-%m-%d";
                break;
            case "year":
                startDate.setFullYear(startDate.getFullYear() - 1);
                startDate.setHours(0, 0, 0, 0);
                groupFormat = "%Y-%m";
                break;
        }

        let data = [];

        switch (type) {
            case "orders":
                data = await Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                            },
                            totalOrders: { $sum: 1 },
                            delivered: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, 1, 0],
                                },
                            },
                            cancelled: {
                                $sum: {
                                    $cond: [{ $eq: ["$status", OrderStatus.CANCELLED] }, 1, 0],
                                },
                            },
                        },
                    },
                    {
                        $sort: { "_id.date": 1 },
                    },
                ]);
                break;

            case "revenue":
                data = await Order.aggregate([
                    {
                        $match: {
                            status: OrderStatus.DELIVERED,
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                            },
                            revenue: { $sum: "$total" },
                        },
                    },
                    {
                        $sort: { "_id.date": 1 },
                    },
                ]);
                break;

            case "users":
                data = await User.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                            },
                            newUsers: { $sum: 1 },
                        },
                    },
                    {
                        $sort: { "_id.date": 1 },
                    },
                ]);
                break;

            case "retailers":
                data = await Retailer.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                            },
                            newRetailers: { $sum: 1 },
                            approved: {
                                $sum: {
                                    $cond: [
                                        { $eq: ["$status", RetailerStatus.APPROVED] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                    {
                        $sort: { "_id.date": 1 },
                    },
                ]);
                break;
        }

        const result = {
            type,
            period,
            data,
            startDate: startDate.toISOString(),
        };

        await cacheServiceEnhanced.set(cacheKey, result, {
            ttl: 3600,
            keyPrefix: this.CACHE_PREFIX,
        });

        return result;
    }
}
