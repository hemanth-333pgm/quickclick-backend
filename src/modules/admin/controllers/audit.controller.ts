import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../../audit/models/audit.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class AuditController {
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                page = 1,
                limit = 20,
                module,
                action,
                userId,
                dateFrom,
                dateTo
            } = req.query;
            
            const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
            
            const query: any = {};
            if (module) query.module = module;
            if (action) query.action = action;
            if (userId) query.actorId = userId;
            if (dateFrom || dateTo) {
                query.createdAt = {};
                if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
                if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
            }
            
            const [logs, total] = await Promise.all([
                AuditLog.find(query)
                    .populate("actorId", "name email")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit as string)),
                AuditLog.countDocuments(query)
            ]);
            
            res.json(SuccessResponse.success("Audit logs retrieved", {
                logs,
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

    async getAuditLogById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const log = await AuditLog.findById(id)
                .populate("actorId", "name email");
            
            if (!log) {
                throw new AppError("Audit log not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Audit log retrieved", log));
        } catch (error) {
            next(error);
        }
    }
}
