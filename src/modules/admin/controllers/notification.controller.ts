import { Request, Response, NextFunction } from "express";
import { Notification } from "../../notifications/models/notification.model";
import { User } from "../../users/models/user.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class NotificationController {
    async getNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, userId, type } = req.query;
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            
            const query: any = {};
            if (userId) query.userId = userId;
            if (type) query.type = type;
            
            const [notifications, total] = await Promise.all([
                Notification.find(query)
                    .populate("userId", "name mobile")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                Notification.countDocuments(query)
            ]);
            
            res.json(SuccessResponse.success("Notifications retrieved", {
                notifications,
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
    }

    async sendNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const { userIds, title, body, type, data, priority } = req.body;
            
            if (!userIds || !userIds.length) {
                throw new AppError("User IDs are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            
            const notifications = await Promise.all(
                userIds.map(async (userId: string) => {
                    return await Notification.create({
                        userId,
                        title,
                        body,
                        type: type || "PROMOTIONAL",
                        data: data || {},
                        priority: priority || "MEDIUM",
                        sentAt: new Date()
                    });
                })
            );
            
            // Push notification logic would go here
            
            res.status(201).json(SuccessResponse.success("Notification sent", {
                count: notifications.length,
                notifications
            }));
        } catch (error) {
            next(error);
        }
    }

    async markNotificationRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const notification = await Notification.findByIdAndUpdate(
                id,
                { read: true, readAt: new Date() },
                { new: true }
            );
            
            if (!notification) {
                throw new AppError("Notification not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Notification marked as read", notification));
        } catch (error) {
            next(error);
        }
    }

    async deleteNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const notification = await Notification.findByIdAndDelete(id);
            if (!notification) {
                throw new AppError("Notification not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Notification deleted", { id }));
        } catch (error) {
            next(error);
        }
    }
}
