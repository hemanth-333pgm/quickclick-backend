import { Request, Response, NextFunction } from "express";
import { Coupon } from "../../coupons/models/coupon.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class CouponController {
    async getCoupons(req: Request, res: Response, next: NextFunction) {
        try {
            const coupons = await Coupon.find()
                .sort({ createdAt: -1 });
            
            res.json(SuccessResponse.success("Coupons retrieved", coupons));
        } catch (error) {
            next(error);
        }
    }

    async getCouponById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const coupon = await Coupon.findById(id);
            
            if (!coupon) {
                throw new AppError("Coupon not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Coupon retrieved", coupon));
        } catch (error) {
            next(error);
        }
    }

    async createCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                code, type, value, minOrderValue, maxDiscount,
                startAt, endAt, usageLimit, perUserLimit, description,
                applicableTo, applicableIds
            } = req.body;
            
            // Check if coupon code already exists
            const existing = await Coupon.findOne({ code: code.toUpperCase() });
            if (existing) {
                throw new AppError("Coupon code already exists", 409, ErrorCodes.USER_ALREADY_EXISTS);
            }
            
            const coupon = new Coupon({
                code: code.toUpperCase(),
                type,
                value,
                minOrderValue: minOrderValue || 0,
                maxDiscount: maxDiscount || null,
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                usageLimit: usageLimit || 1000,
                perUserLimit: perUserLimit || 1,
                isActive: true,
                description,
                applicableTo: applicableTo || "ALL",
                applicableIds: applicableIds || [],
                userIds: [],
                metadata: {
                    createdBy: req.userId,
                    campaignName: req.body.campaignName || "",
                    categories: req.body.categories || []
                }
            });
            
            await coupon.save();
            
            res.status(201).json(SuccessResponse.success("Coupon created", coupon));
        } catch (error) {
            next(error);
        }
    }

    async updateCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const coupon = await Coupon.findById(id);
            if (!coupon) {
                throw new AppError("Coupon not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            // Prevent updating code if it already exists
            if (updates.code) {
                const existing = await Coupon.findOne({ 
                    code: updates.code.toUpperCase(),
                    _id: { $ne: id }
                });
                if (existing) {
                    throw new AppError("Coupon code already exists", 409, ErrorCodes.USER_ALREADY_EXISTS);
                }
                coupon.code = updates.code.toUpperCase();
            }
            
            Object.assign(coupon, updates);
            await coupon.save();
            
            res.json(SuccessResponse.success("Coupon updated", coupon));
        } catch (error) {
            next(error);
        }
    }

    async deleteCoupon(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const coupon = await Coupon.findById(id);
            if (!coupon) {
                throw new AppError("Coupon not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            await coupon.deleteOne();
            
            res.json(SuccessResponse.success("Coupon deleted", { id }));
        } catch (error) {
            next(error);
        }
    }
}
