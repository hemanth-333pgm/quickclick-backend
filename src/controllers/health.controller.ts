import { Request, Response } from "express";
import mongoose from "mongoose";
import os from "os";

export class HealthController {
    static async getHealthStatus(req: Request, res: Response) {
        const startTime = process.hrtime();
        const dbStatus = await HealthController.checkDatabase();

        const elapsed = process.hrtime(startTime);
        const responseTime = (elapsed[0] * 1000 + elapsed[1] / 1000000).toFixed(2);

        const status = {
            status: dbStatus ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: `${responseTime}ms`,
            components: {
                database: {
                    status: dbStatus ? "connected" : "disconnected",
                    readyState: mongoose.connection.readyState
                },
                system: {
                    memory: HealthController.getMemoryUsage(),
                    cpu: HealthController.getCpuUsage()
                }
            }
        };

        res.status(dbStatus ? 200 : 503).json(status);
    }

    static async checkDatabase(): Promise<boolean> {
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.db.admin().ping();
                return true;
            }
            return false;
        } catch { 
            return false; 
        }
    }

    static getMemoryUsage(): any {
        const mem = process.memoryUsage();
        return {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        };
    }

    static getCpuUsage(): any {
        return { cpus: os.cpus().length, loadAvg: os.loadavg() };
    }
}
