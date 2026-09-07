import mongoose from "mongoose";
import { Notification } from "../models/notification.model";

export class NotificationService {
    async createNotification(data: {
        userId: string;
        title: string;
        body: string;
        type: string;
        data?: any;
        priority?: "HIGH" | "MEDIUM" | "LOW";
    }): Promise<any> {
        const notification = await Notification.create({
            userId: new mongoose.Types.ObjectId(data.userId),
            title: data.title,
            body: data.body,
            type: data.type,
            data: data.data,
            priority: data.priority || "MEDIUM",
            sentAt: new Date(),
        });
        return notification;
    }

    async getNotifications(userId: string, page: number = 1, limit: number = 20): Promise<any> {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification.countDocuments({ userId }),
        ]);
        return { notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async markAsRead(notificationId: string, userId: string): Promise<any> {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { read: true, readAt: new Date() },
            { new: true }
        );
        if (!notification) throw new Error("Notification not found");
        return notification;
    }

    async markAllAsRead(userId: string): Promise<any> {
        await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });
        return { success: true };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return await Notification.countDocuments({ userId, read: false });
    }

    async deleteNotification(notificationId: string, userId: string): Promise<any> {
        const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
        if (!result) throw new Error("Notification not found");
        return { success: true };
    }
}
