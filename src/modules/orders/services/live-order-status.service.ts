import { EventEmitter } from "events";
import { Order } from "../models/order.model";
import { OrderStatus } from "../../../common/constants/status.constants";
import { logger } from "../../../config/logger";

class LiveOrderStore {
    private static instance: LiveOrderStore;
    private subscribers: Map<string, Set<string>> = new Map();
    private orderStatusCache: Map<string, { status: string; timestamp: Date; data: any }> = new Map();

    private constructor() {}

    static getInstance(): LiveOrderStore {
        if (!LiveOrderStore.instance) {
            LiveOrderStore.instance = new LiveOrderStore();
        }
        return LiveOrderStore.instance;
    }

    subscribe(orderId: string, socketId: string): void {
        if (!this.subscribers.has(orderId)) {
            this.subscribers.set(orderId, new Set());
        }
        this.subscribers.get(orderId)!.add(socketId);
        logger.debug(`Socket ${socketId} subscribed to order ${orderId}`);
    }

    unsubscribe(orderId: string, socketId: string): void {
        const subscribers = this.subscribers.get(orderId);
        if (subscribers) {
            subscribers.delete(socketId);
            if (subscribers.size === 0) {
                this.subscribers.delete(orderId);
            }
        }
    }

    getSubscribers(orderId: string): string[] {
        return Array.from(this.subscribers.get(orderId) || []);
    }

    updateOrderStatus(orderId: string, status: string, data: any): void {
        this.orderStatusCache.set(orderId, {
            status,
            timestamp: new Date(),
            data
        });
    }

    getOrderStatus(orderId: string): any {
        return this.orderStatusCache.get(orderId);
    }
}

export class LiveOrderStatusService {
    private store = LiveOrderStore.getInstance();
    private eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.setMaxListeners(100);
    }

    async updateOrderStatus(orderId: string, newStatus: string, data: any = {}): Promise<void> {
        try {
            const order = await Order.findById(orderId)
                .populate("userId", "name mobile")
                .populate("retailerId", "shopName")
                .populate("deliveryPartnerId", "name")
                .lean();

            if (!order) {
                logger.error(`Order ${orderId} not found for status update`);
                return;
            }

            this.store.updateOrderStatus(orderId, newStatus, {
                orderId,
                status: newStatus,
                orderNumber: order.orderNumber,
                total: order.total,
                items: order.items.length,
                updatedAt: new Date().toISOString(),
                ...data
            });

            const subscribers = this.store.getSubscribers(orderId);
            
            if (subscribers.length > 0) {
                const payload = {
                    type: "ORDER_STATUS_UPDATE",
                    orderId,
                    status: newStatus,
                    orderNumber: order.orderNumber,
                    timestamp: new Date().toISOString(),
                    data: {
                        status: newStatus,
                        items: order.items,
                        total: order.total,
                        retailerName: (order.retailerId as any)?.shopName,
                        deliveryPartner: (order.deliveryPartnerId as any)?.name,
                        ...data
                    }
                };

                subscribers.forEach(socketId => {
                    this.eventEmitter.emit(`socket:${socketId}`, payload);
                });

                logger.info(`Order ${orderId} status updated to ${newStatus} for ${subscribers.length} subscribers`);
            }

            if (this.isCriticalStatus(newStatus)) {
                this.broadcastToAdmins({
                    type: "CRITICAL_ORDER_UPDATE",
                    orderId,
                    status: newStatus,
                    orderNumber: order.orderNumber,
                    timestamp: new Date().toISOString(),
                    data
                });
            }
        } catch (error) {
            logger.error(`Failed to update order ${orderId} status:`, error);
        }
    }

    subscribe(orderId: string, socketId: string): void {
        this.store.subscribe(orderId, socketId);
        const cached = this.store.getOrderStatus(orderId);
        if (cached) {
            this.eventEmitter.emit(`socket:${socketId}`, {
                type: "CURRENT_ORDER_STATUS",
                orderId,
                ...cached
            });
        }
    }

    unsubscribe(orderId: string, socketId: string): void {
        this.store.unsubscribe(orderId, socketId);
    }

    async getLiveOrderStatus(orderId: string): Promise<any> {
        const cached = this.store.getOrderStatus(orderId);
        if (cached) return cached;
        const order = await Order.findById(orderId).lean();
        if (!order) return null;
        return {
            orderId: order._id,
            status: order.status,
            orderNumber: order.orderNumber,
            total: order.total,
            items: order.items.length,
            updatedAt: order.updatedAt
        };
    }

    private isCriticalStatus(status: string): boolean {
        return [OrderStatus.REJECTED, OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(status as any);
    }

    private broadcastToAdmins(payload: any): void {
        this.eventEmitter.emit("order:critical:alert", payload);
    }

    getEventEmitter(): EventEmitter {
        return this.eventEmitter;
    }
}
