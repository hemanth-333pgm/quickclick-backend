import { Server as HTTPServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { LiveOrderStatusService } from "../../modules/orders/services/live-order-status.service";
import { logger } from "../../config/logger";

export class WebSocketService {
    private io: SocketServer;
    private liveOrderService: LiveOrderStatusService;

    constructor(server: HTTPServer) {
        this.io = new SocketServer(server, {
            cors: {
                origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
                credentials: true
            },
            path: "/socket.io",
            transports: ["websocket", "polling"]
        });

        this.liveOrderService = new LiveOrderStatusService();
        this.initialize();
    }

    private initialize(): void {
        // Authentication middleware for Socket.IO
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error("Authentication required"));
                }

                // Verify token (would use your auth service)
                (socket as any).userId = "user_id_from_token";
                (socket as any).userRole = "CUSTOMER";
                next();
            } catch (error) {
                next(new Error("Invalid token"));
            }
        });

        this.io.on("connection", (socket: Socket) => {
            logger.info(`Socket connected: ${socket.id}`);
            
            this.handleConnection(socket);
            
            socket.on("disconnect", () => {
                this.handleDisconnection(socket);
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });

        // Connect live order service events to socket broadcasts
        this.setupLiveOrderBroadcasting();
    }

    private handleConnection(socket: Socket): void {
        const userId = (socket as any).userId;
        const userRole = (socket as any).userRole;

        // Join user's personal room for private messages
        socket.join(`user:${userId}`);

        // Join role-based rooms
        if (userRole) {
            socket.join(`role:${userRole}`);
        }

        // Handle subscription to order updates
        socket.on("subscribe:order", (data: { orderId: string }) => {
            const { orderId } = data;
            if (orderId) {
                this.liveOrderService.subscribe(orderId, socket.id);
                socket.join(`order:${orderId}`);
                logger.info(`Socket ${socket.id} subscribed to order ${orderId}`);
            }
        });

        socket.on("unsubscribe:order", (data: { orderId: string }) => {
            const { orderId } = data;
            if (orderId) {
                this.liveOrderService.unsubscribe(orderId, socket.id);
                socket.leave(`order:${orderId}`);
                logger.info(`Socket ${socket.id} unsubscribed from order ${orderId}`);
            }
        });

        // Handle location updates for delivery partners
        socket.on("location:update", async (data: {
            orderId: string;
            latitude: number;
            longitude: number;
        }) => {
            const { orderId, latitude, longitude } = data;
            if (orderId && latitude && longitude) {
                // Broadcast to all subscribers of this order
                this.io.to(`order:${orderId}`).emit("location:updated", {
                    orderId,
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Handle order status updates (from delivery partners)
        socket.on("order:status:update", async (data: {
            orderId: string;
            status: string;
            notes?: string;
            otpCode?: string;
        }) => {
            const { orderId, status, notes, otpCode } = data;
            if (orderId && status) {
                try {
                    await this.liveOrderService.updateOrderStatus(orderId, status, {
                        notes,
                        otpCode,
                        updatedBy: socket.id
                    });
                } catch (error) {
                    logger.error("Failed to update order status:", error);
                    socket.emit("error", {
                        code: "UPDATE_FAILED",
                        message: "Failed to update order status"
                    });
                }
            }
        });
    }

    private handleDisconnection(socket: Socket): void {
        // Clean up subscriptions
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room.startsWith("order:")) {
                const orderId = room.replace("order:", "");
                this.liveOrderService.unsubscribe(orderId, socket.id);
            }
        });

        logger.info(`Cleaned up subscriptions for socket ${socket.id}`);
    }

    private setupLiveOrderBroadcasting(): void {
        const eventEmitter = this.liveOrderService.getEventEmitter();
        
        eventEmitter.on("order:status:changed", (data: any) => {
            // Broadcast to all subscribers
            this.io.to(`order:${data.orderId}`).emit("order:status:changed", data);
            
            // Also notify role-based rooms
            this.io.to("role:ADMIN").emit("order:status:changed", data);
            this.io.to("role:RETAILER").emit("order:status:changed", data);
        });

        eventEmitter.on("order:delivery:assigned", (data: any) => {
            this.io.to(`user:${data.deliveryPartnerId}`).emit("delivery:assigned", data);
        });

        eventEmitter.on("order:delivery:completed", (data: any) => {
            this.io.to(`user:${data.customerId}`).emit("order:delivered", data);
        });

        eventEmitter.on("order:critical:alert", (data: any) => {
            this.io.to("role:ADMIN").emit("critical:alert", data);
            this.io.to("role:SUPER_ADMIN").emit("critical:alert", data);
        });
    }

    getIO(): SocketServer {
        return this.io;
    }
}
