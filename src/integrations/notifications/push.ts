import { Notification } from "../../modules/notifications/models/notification.model";

/**
 * Fire-and-forget in-app notification. Never throws.
 */
export async function pushNotification(
  userId: string,
  title: string,
  body: string,
  type = "ORDER_UPDATE"
): Promise<void> {
  try {
    await Notification.create({ userId, title, body, type, read: false });
  } catch (e) {
    console.warn("pushNotification failed:", e);
  }
}
