import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    getNotifications = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { page = 1, limit = 20 } = req.query;
            const result = await this.notificationService.getNotifications(
                userId,
                parseInt(page as string),
                parseInt(limit as string)
            );
            res.json(SuccessResponse.success("Notifications retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    markAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { id } = req.params;
            const result = await this.notificationService.markAsRead(id, userId);
            res.json(SuccessResponse.success("Notification marked as read", result));
        } catch (error) {
            next(error);
        }
    };

    markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const result = await this.notificationService.markAllAsRead(userId);
            res.json(SuccessResponse.success("All notifications marked as read", result));
        } catch (error) {
            next(error);
        }
    };

    getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const count = await this.notificationService.getUnreadCount(userId);
            res.json(SuccessResponse.success("Unread count retrieved", { count }));
        } catch (error) {
            next(error);
        }
    };

    deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { id } = req.params;
            const result = await this.notificationService.deleteNotification(id, userId);
            res.json(SuccessResponse.success("Notification deleted", result));
        } catch (error) {
            next(error);
        }
    };
}
