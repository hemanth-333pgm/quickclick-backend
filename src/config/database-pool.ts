import mongoose from "mongoose";
import { logger } from "./logger";

interface PoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
}

export class DatabasePoolManager {
    private static instance: DatabasePoolManager;
    private poolStats: PoolStats = {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
    };

    private constructor() {
        this.startMonitoring();
    }

    static getInstance(): DatabasePoolManager {
        if (!DatabasePoolManager.instance) {
            DatabasePoolManager.instance = new DatabasePoolManager();
        }
        return DatabasePoolManager.instance;
    }

    async initializeConnection(uri: string): Promise<void> {
        try {
            await mongoose.connect(uri, {
                maxPoolSize: 50,
                minPoolSize: 10,
                maxIdleTimeMS: 30000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                family: 4,
                retryWrites: true,
                retryReads: true,
                serverSelectionTimeoutMS: 5000,
                heartbeatFrequencyMS: 10000,
            });

            logger.info("✅ Database connection pool initialized");
        } catch (error) {
            logger.error("❌ Database pool initialization failed:", error);
            throw error;
        }
    }

    async getConnection(): Promise<any> {
        try {
            const conn = mongoose.connection;
            this.updatePoolStats();
            return conn;
        } catch (error) {
            logger.error("❌ Failed to get connection:", error);
            throw error;
        }
    }

    private updatePoolStats(): void {
        try {
            const conn = mongoose.connection;
            if (conn && conn.readyState === 1) {
                // Simplified stats - just track if connected
                this.poolStats.totalConnections = 1;
                this.poolStats.activeConnections = 0;
                this.poolStats.idleConnections = 0;
            }
        } catch (error) {
            // Ignore
        }
    }

    private startMonitoring(): void {
        setInterval(() => {
            this.updatePoolStats();
            if (this.poolStats.totalConnections > 40) {
                logger.warn(`⚠️ High connection count: ${this.poolStats.totalConnections}`);
            }
        }, 30000);
    }

    getStats(): PoolStats {
        this.updatePoolStats();
        return { ...this.poolStats };
    }

    async closeAllConnections(): Promise<void> {
        await mongoose.disconnect();
        logger.info("✅ All database connections closed");
    }
}
