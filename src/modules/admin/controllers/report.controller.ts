import { Request, Response, NextFunction } from "express";
import { Order } from "../../orders/models/order.model";
import { User } from "../../users/models/user.model";
import { Retailer } from "../../retailers/models/retailer.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class ReportController {
    async getDailyReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { date } = req.query;
            const targetDate = date ? new Date(date as string) : new Date();
            
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const [orders, newUsers, newRetailers] = await Promise.all([
                Order.find({
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }),
                User.countDocuments({
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                }),
                Retailer.countDocuments({
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                })
            ]);
            
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
            const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
            
            // Order status breakdown
            const statusBreakdown: any = {};
            for (const order of orders) {
                statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
            }
            
            // Top retailers
            const retailerMap: any = {};
            for (const order of orders) {
                const id = order.retailerId.toString();
                if (!retailerMap[id]) {
                    retailerMap[id] = { orders: 0, revenue: 0 };
                }
                retailerMap[id].orders++;
                retailerMap[id].revenue += order.total;
            }
            const topRetailers = Object.entries(retailerMap)
                .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
                .slice(0, 5)
                .map(([id, data]: [string, any]) => ({
                    retailerId: id,
                    ...data
                }));
            
            res.json(SuccessResponse.success("Daily report retrieved", {
                date: targetDate.toISOString().split('T')[0],
                summary: {
                    totalOrders: orders.length,
                    totalRevenue,
                    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                    newUsers,
                    newRetailers,
                    deliveredOrders: deliveredOrders.length
                },
                orderBreakdown: statusBreakdown,
                topRetailers
            }));
        } catch (error) {
            next(error);
        }
    }

    async getWeeklyReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { week, year } = req.query;
            const targetYear = parseInt(year as string) || new Date().getFullYear();
            const targetWeek = parseInt(week as string) || 0;
            
            // Calculate week start and end
            const now = new Date();
            const currentWeekNumber = Math.ceil((now.getDate() - 1) / 7);
            const weekNumber = targetWeek || currentWeekNumber;
            
            const startOfWeek = new Date(targetYear, 0, (weekNumber - 1) * 7 + 1);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            const orders = await Order.find({
                createdAt: { $gte: startOfWeek, $lte: endOfWeek }
            });
            
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
            
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
            
            res.json(SuccessResponse.success("Weekly report retrieved", {
                week: weekNumber,
                year: targetYear,
                startDate: startOfWeek,
                endDate: endOfWeek,
                summary: {
                    totalOrders: orders.length,
                    totalRevenue,
                    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
                },
                dailyData
            }));
        } catch (error) {
            next(error);
        }
    }

    async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { month, year } = req.query;
            const targetYear = parseInt(year as string) || new Date().getFullYear();
            const targetMonth = parseInt(month as string) || new Date().getMonth() + 1;
            
            const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
            const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
            
            const orders = await Order.find({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
            
            // Weekly breakdown
            const weeklyData: any = {};
            for (const order of orders) {
                const week = Math.ceil((order.createdAt.getDate() - 1) / 7);
                if (!weeklyData[week]) {
                    weeklyData[week] = { orders: 0, revenue: 0 };
                }
                weeklyData[week].orders++;
                weeklyData[week].revenue += order.total;
            }
            
            res.json(SuccessResponse.success("Monthly report retrieved", {
                month: targetMonth,
                year: targetYear,
                startDate: startOfMonth,
                endDate: endOfMonth,
                summary: {
                    totalOrders: orders.length,
                    totalRevenue,
                    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
                },
                weeklyData
            }));
        } catch (error) {
            next(error);
        }
    }
}
