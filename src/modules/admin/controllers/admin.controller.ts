import { Request, Response, NextFunction } from "express";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { logger } from "../../../config/logger";

export class AdminController {
    private dashboardService: AdminDashboardService;

    constructor() {
        this.dashboardService = new AdminDashboardService();
    }

    getDashboardMetrics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.dashboardService.getDashboardMetrics();
            res.json(SuccessResponse.success("Dashboard metrics retrieved", data));
        } catch (error) {
            next(error);
        }
    };

    getRealtimeStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await this.dashboardService.getRealtimeStats();
            res.json(SuccessResponse.success("Realtime stats retrieved", data));
        } catch (error) {
            next(error);
        }
    };

    getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                userId: req.query.userId as string,
                module: req.query.module as string,
                action: req.query.action as string,
                status: req.query.status as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
            };

            const data = await this.dashboardService.getActivityLogs(filters);
            res.json(SuccessResponse.success("Activity logs retrieved", data));
        } catch (error) {
            next(error);
        }
    };

    getChartData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type, period } = req.params;

            if (!type || !period) {
                throw new AppError("Type and period are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const data = await this.dashboardService.getChartData(
                type as "orders" | "revenue" | "users" | "retailers",
                period as "day" | "week" | "month" | "year"
            );

            res.json(SuccessResponse.success("Chart data retrieved", data));
        } catch (error) {
            next(error);
        }
    };

    getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { date } = req.query;
            const targetDate = date ? new Date(date as string) : undefined;
            const data = await this.dashboardService.getDashboardAnalytics(targetDate);
            res.json(SuccessResponse.success("Dashboard analytics retrieved", data));
        } catch (error) {
            next(error);
        }
    };

    // User Management
    getUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { role, status, search, page = 1, limit = 20 } = req.query;
            // Implement user listing with filters
            res.json(SuccessResponse.success("Users retrieved", { users: [] }));
        } catch (error) {
            next(error);
        }
    };

    updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Log activity
            await this.dashboardService.logActivity({
                userId: req.userId!,
                userName: req.user?.name || "Admin",
                userRole: req.userRole!,
                action: "UPDATE_USER_STATUS",
                module: "USERS",
                entityId: id,
                entityType: "User",
                changes: { status },
                ipAddress: req.ip || req.connection.remoteAddress || "unknown",
                userAgent: req.headers["user-agent"] || "unknown",
            });

            res.json(SuccessResponse.success("User status updated", { userId: id, status }));
        } catch (error) {
            next(error);
        }
    };

    // Retailer Management
    approveRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Log activity
            await this.dashboardService.logActivity({
                userId: req.userId!,
                userName: req.user?.name || "Admin",
                userRole: req.userRole!,
                action: "APPROVE_RETAILER",
                module: "RETAILERS",
                entityId: id,
                entityType: "Retailer",
                changes: { status },
                ipAddress: req.ip || req.connection.remoteAddress || "unknown",
                userAgent: req.headers["user-agent"] || "unknown",
            });

            res.json(SuccessResponse.success("Retailer status updated", { retailerId: id, status }));
        } catch (error) {
            next(error);
        }
    };

    // Delivery Partner Management
    approveDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await this.dashboardService.logActivity({
                userId: req.userId!,
                userName: req.user?.name || "Admin",
                userRole: req.userRole!,
                action: "APPROVE_DELIVERY_PARTNER",
                module: "DELIVERY",
                entityId: id,
                entityType: "DeliveryPartner",
                changes: { status },
                ipAddress: req.ip || req.connection.remoteAddress || "unknown",
                userAgent: req.headers["user-agent"] || "unknown",
            });

            res.json(SuccessResponse.success("Delivery partner status updated", { partnerId: id, status }));
        } catch (error) {
            next(error);
        }
    };

    // Order Management
    assignDelivery = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { deliveryPartnerId } = req.body;

            await this.dashboardService.logActivity({
                userId: req.userId!,
                userName: req.user?.name || "Admin",
                userRole: req.userRole!,
                action: "ASSIGN_DELIVERY",
                module: "ORDERS",
                entityId: id,
                entityType: "Order",
                changes: { deliveryPartnerId },
                ipAddress: req.ip || req.connection.remoteAddress || "unknown",
                userAgent: req.headers["user-agent"] || "unknown",
            });

            res.json(SuccessResponse.success("Delivery assigned", { orderId: id, deliveryPartnerId }));
        } catch (error) {
            next(error);
        }
    };
}
