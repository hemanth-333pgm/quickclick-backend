import { Request, Response, NextFunction } from "express";
import { Zone } from "../../zones/models/zone.model";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class ZoneController {
    async getZones(req: Request, res: Response, next: NextFunction) {
        try {
            const zones = await Zone.find()
                .populate("assignedAdmins", "name email")
                .sort({ createdAt: -1 });
            
            res.json(SuccessResponse.success("Zones retrieved", zones));
        } catch (error) {
            next(error);
        }
    }

    async getZoneById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const zone = await Zone.findById(id)
                .populate("assignedAdmins", "name email")
                .populate("retailers", "shopName")
                .populate("deliveryPartners", "name mobile");
            
            if (!zone) {
                throw new AppError("Zone not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            res.json(SuccessResponse.success("Zone retrieved", zone));
        } catch (error) {
            next(error);
        }
    }

    async createZone(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                name, taluk, district, state, pincodes,
                center, radius, deliveryCharge, minOrderAmount,
                settings, boundaries
            } = req.body;
            
            const zone = new Zone({
                name,
                taluk,
                district,
                state,
                pincodes,
                center,
                boundaries,
                radius: radius || 10,
                isActive: true,
                deliveryCharge: deliveryCharge || 0,
                minOrderAmount: minOrderAmount || 0,
                assignedAdmins: [req.userId],
                settings: settings || {
                    maxDeliveryDistance: 10,
                    estimatedDeliveryTime: 30,
                    surgePricing: false,
                    surgeMultiplier: 1.0,
                    workingHours: {
                        start: "08:00",
                        end: "22:00"
                    },
                    holidayMode: false
                }
            });
            
            await zone.save();
            
            res.status(201).json(SuccessResponse.success("Zone created", zone));
        } catch (error) {
            next(error);
        }
    }

    async updateZone(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const zone = await Zone.findById(id);
            if (!zone) {
                throw new AppError("Zone not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            Object.assign(zone, updates);
            await zone.save();
            
            res.json(SuccessResponse.success("Zone updated", zone));
        } catch (error) {
            next(error);
        }
    }

    async deleteZone(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            
            const zone = await Zone.findById(id);
            if (!zone) {
                throw new AppError("Zone not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            
            zone.isActive = false;
            await zone.save();
            
            res.json(SuccessResponse.success("Zone deleted", { id }));
        } catch (error) {
            next(error);
        }
    }
}
