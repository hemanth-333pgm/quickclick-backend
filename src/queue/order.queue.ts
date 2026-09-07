import { Queue, Worker } from "bullmq";
import { getRedisClient } from "../config/redis-cluster";
import { logger } from "../config/logger";

export const ORDER_QUEUE_NAME = "order-processing";

export class OrderQueueManager {
    private static instance: OrderQueueManager;
    private queue: Queue;
    private worker: Worker;

    private constructor() {
        const connection = {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD
        };

        this.queue = new Queue(ORDER_QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 },
                removeOnComplete: { age: 3600, count: 1000 },
                removeOnFail: { age: 86400 }
            }
        });

        this.worker = new Worker(ORDER_QUEUE_NAME, async (job) => {
            return await this.processOrderJob(job);
        }, {
            connection,
            concurrency: 10,
            limiter: { max: 100, duration: 1000 }
        });

        this.setupWorkerEvents();
    }

    static getInstance(): OrderQueueManager {
        if (!OrderQueueManager.instance) {
            OrderQueueManager.instance = new OrderQueueManager();
        }
        return OrderQueueManager.instance;
    }

    private async processOrderJob(job: any) {
        const { orderData, userId } = job.data;
        const startTime = Date.now();

        try {
            // Process order directly without lock for now
            // Import OrderService
            const { Order } = await import("../modules/orders/models/order.model");
            const order = new Order({
                ...orderData,
                userId,
                orderNumber: `ORD-${Date.now()}`,
                status: "PLACED"
            });
            await order.save();
            
            logger.info(`Order processed in ${Date.now() - startTime}ms: ${order.orderNumber}`);
            return order;
        } catch (error) {
            logger.error(`Order job ${job.id} failed:`, error);
            throw error;
        }
    }

    private setupWorkerEvents() {
        this.worker.on("completed", (job, result) => {
            logger.info(`Job ${job.id} completed for order ${result?.orderNumber}`);
        });
        this.worker.on("failed", (job, error) => {
            logger.error(`Job ${job.id} failed:`, error);
        });
        this.worker.on("error", (error) => {
            logger.error("Worker error:", error);
        });
    }

    async addOrderToQueue(orderData: any, userId: string, idempotencyKey?: string): Promise<string> {
        const job = await this.queue.add(`order-${Date.now()}`, {
            orderData,
            userId,
            idempotencyKey,
            timestamp: Date.now()
        }, {
            priority: 1,
            attempts: 3,
            backoff: { type: "exponential", delay: 1000 }
        });
        return job.id;
    }

    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
            this.queue.getDelayedCount()
        ]);
        return { waiting, active, completed, failed, delayed, total: waiting + active + completed + failed + delayed };
    }

    async shutdown() {
        await this.worker.close();
        await this.queue.close();
        logger.info("Order queue shutdown complete");
    }
}
