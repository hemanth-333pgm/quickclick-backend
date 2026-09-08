import mongoose from 'mongoose';
import { Request, Response, NextFunction } from "express";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import { User } from "../../users/models/user.model";
import { Retailer } from "../../retailers/models/retailer.model";
import { DeliveryPartner } from "../../delivery/models/delivery-partner.model";
import { Order } from "../../orders/models/order.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class AdminController {
    private dashboardService: AdminDashboardService;

    constructor() {
        this.dashboardService = new AdminDashboardService();
    }

    // ============================================
    // DASHBOARD
    // ============================================

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

    getChartData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type, period } = req.params;
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

    // ============================================
    // USERS
    // ============================================

    getUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { role, status, search, page = 1, limit = 20 } = req.query;
            
            const query: any = {};
            if (role) query.role = role;
            if (status) query.status = status;
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { mobile: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ];
            }
            
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            
            const [users, total] = await Promise.all([
                User.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                User.countDocuments(query)
            ]);
            
            res.json(SuccessResponse.success("Users retrieved", {
                users,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit as string))
                }
            }));
        } catch (error) {
            next(error);
        }
    };

    getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            
            if (!user) {
                throw new AppError("User not found", 404, ErrorCodes.USER_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("User details retrieved", user));
        } catch (error) {
            next(error);
        }
    };

    updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;
            
            const user = await User.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
            
            if (!user) {
                throw new AppError("User not found", 404, ErrorCodes.USER_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("User status updated", user));
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // RETAILERS
    // ============================================

    getRetailers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, search, page = 1, limit = 20 } = req.query;
            
            const query: any = {};
            if (status) query.status = status;
            if (search) {
                query.$or = [
                    { shopName: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ];
            }
            
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            
            const [retailers, total] = await Promise.all([
                Retailer.find(query)
                    .populate("ownerId", "name mobile")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                Retailer.countDocuments(query)
            ]);
            
            res.json(SuccessResponse.success("Retailers retrieved", {
                retailers,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit as string))
                }
            }));
        } catch (error) {
            next(error);
        }
    };

    getRetailerDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const retailer = await Retailer.findById(id)
                .populate("ownerId", "name mobile");
            
            if (!retailer) {
                throw new AppError("Retailer not found", 404, ErrorCodes.RETAILER_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Retailer details retrieved", retailer));
        } catch (error) {
            next(error);
        }
    };

    approveRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            
            const retailer = await Retailer.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
            
            if (!retailer) {
                throw new AppError("Retailer not found", 404, ErrorCodes.RETAILER_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Retailer status updated", retailer));
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // DELIVERY PARTNERS
    // ============================================

    getDeliveryPartners = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, availability, page = 1, limit = 20 } = req.query;
            
            const query: any = {};
            if (status) query.status = status;
            if (availability) query.availability = availability;
            
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            
            const [partners, total] = await Promise.all([
                DeliveryPartner.find(query)
                    .populate("userId", "name mobile")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                DeliveryPartner.countDocuments(query)
            ]);
            
            res.json(SuccessResponse.success("Delivery partners retrieved", {
                partners,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit as string))
                }
            }));
        } catch (error) {
            next(error);
        }
    };

    updateDeliveryPartnerStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;
            
            const partner = await DeliveryPartner.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
            
            if (!partner) {
                throw new AppError("Delivery partner not found", 404, ErrorCodes.DELIVERY_PARTNER_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Delivery partner status updated", partner));
        } catch (error) {
            next(error);
        }
    };

    // ============================================
    // ORDERS
    // ============================================

    getOrders = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, retailerId, deliveryPartnerId, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;
            
            const query: any = {};
            if (status) query.status = status;
            if (retailerId) query.retailerId = retailerId;
            if (deliveryPartnerId) query.deliveryPartnerId = deliveryPartnerId;
            if (search) {
                query.orderNumber = { $regex: search, $options: "i" };
            }
            if (dateFrom || dateTo) {
                query.createdAt = {};
                if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
                if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
            }
            
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            
            const [orders, total] = await Promise.all([
                Order.find(query)
                    .populate("userId", "name mobile")
                    .populate("retailerId", "shopName")
                    .populate("deliveryPartnerId", "name mobile")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                Order.countDocuments(query)
            ]);
            
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
            
            res.json(SuccessResponse.success("Orders retrieved", {
                orders,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit as string))
                },
                summary: {
                    totalRevenue,
                    totalOrders: total,
                    avgOrderValue: total > 0 ? totalRevenue / total : 0
                }
            }));
        } catch (error) {
            next(error);
        }
    };

    getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const order = await Order.findById(id)
                .populate("userId", "name mobile email")
                .populate("retailerId", "shopName phone address")
                .populate("deliveryPartnerId", "name mobile vehicleType");
            
            if (!order) {
                throw new AppError("Order not found", 404, ErrorCodes.ORDER_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Order details retrieved", order));
        } catch (error) {
            next(error);
        }
    };

    assignDelivery = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { deliveryPartnerId } = req.body;
            
            const order = await Order.findById(id);
            if (!order) {
                throw new AppError("Order not found", 404, ErrorCodes.ORDER_NOT_FOUND);
            }
            
            order.deliveryPartnerId = deliveryPartnerId;
            order.status = "ASSIGNED";
            order.statusHistory.push({
                fromStatus: "READY_FOR_PICKUP",
                toStatus: "ASSIGNED",
                actorId: new mongoose.Types.ObjectId(req.userId),
                actorRole: "ADMIN",
                reason: `Assigned to delivery partner ${deliveryPartnerId}`,
                timestamp: new Date()
            });
            await order.save();
            
            res.json(SuccessResponse.success("Delivery assigned", order));
        } catch (error) {
            next(error);
        }
    };
}

