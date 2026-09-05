import mongoose, { Schema, Document } from "mongoose";

export interface IDashboardAnalytics extends Document {
    date: Date;
    metrics: {
        totalUsers: number;
        activeUsers: number;
        newUsers: number;
        totalRetailers: number;
        activeRetailers: number;
        pendingRetailers: number;
        totalDeliveryPartners: number;
        activeDeliveryPartners: number;
        onlineDeliveryPartners: number;
        totalOrders: number;
        pendingOrders: number;
        processingOrders: number;
        completedOrders: number;
        cancelledOrders: number;
        totalRevenue: number;
        todayRevenue: number;
        weekRevenue: number;
        monthRevenue: number;
        averageOrderValue: number;
    };
    topRetailers: Array<{
        retailerId: mongoose.Types.ObjectId;
        shopName: string;
        totalOrders: number;
        revenue: number;
        rating: number;
    }>;
    topProducts: Array<{
        productId: mongoose.Types.ObjectId;
        name: string;
        totalSold: number;
        revenue: number;
    }>;
    orderTrends: Array<{
        date: string;
        orders: number;
        revenue: number;
    }>;
    zoneStats: Array<{
        zoneId: mongoose.Types.ObjectId;
        name: string;
        orders: number;
        revenue: number;
        retailers: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const DashboardAnalyticsSchema = new Schema<IDashboardAnalytics>(
    {
        date: {
            type: Date,
            required: true,
            unique: true,
            index: true,
        },
        metrics: {
            totalUsers: { type: Number, default: 0 },
            activeUsers: { type: Number, default: 0 },
            newUsers: { type: Number, default: 0 },
            totalRetailers: { type: Number, default: 0 },
            activeRetailers: { type: Number, default: 0 },
            pendingRetailers: { type: Number, default: 0 },
            totalDeliveryPartners: { type: Number, default: 0 },
            activeDeliveryPartners: { type: Number, default: 0 },
            onlineDeliveryPartners: { type: Number, default: 0 },
            totalOrders: { type: Number, default: 0 },
            pendingOrders: { type: Number, default: 0 },
            processingOrders: { type: Number, default: 0 },
            completedOrders: { type: Number, default: 0 },
            cancelledOrders: { type: Number, default: 0 },
            totalRevenue: { type: Number, default: 0 },
            todayRevenue: { type: Number, default: 0 },
            weekRevenue: { type: Number, default: 0 },
            monthRevenue: { type: Number, default: 0 },
            averageOrderValue: { type: Number, default: 0 },
        },
        topRetailers: [
            {
                retailerId: { type: Schema.Types.ObjectId, ref: "Retailer" },
                shopName: { type: String },
                totalOrders: { type: Number, default: 0 },
                revenue: { type: Number, default: 0 },
                rating: { type: Number, default: 0 },
            },
        ],
        topProducts: [
            {
                productId: { type: Schema.Types.ObjectId, ref: "Product" },
                name: { type: String },
                totalSold: { type: Number, default: 0 },
                revenue: { type: Number, default: 0 },
            },
        ],
        orderTrends: [
            {
                date: { type: String },
                orders: { type: Number, default: 0 },
                revenue: { type: Number, default: 0 },
            },
        ],
        zoneStats: [
            {
                zoneId: { type: Schema.Types.ObjectId, ref: "Zone" },
                name: { type: String },
                orders: { type: Number, default: 0 },
                revenue: { type: Number, default: 0 },
                retailers: { type: Number, default: 0 },
            },
        ],
    },
    {
        timestamps: true,
    }
);

DashboardAnalyticsSchema.index({ date: -1 });

export const DashboardAnalytics = mongoose.model<IDashboardAnalytics>(
    "DashboardAnalytics",
    DashboardAnalyticsSchema
);
