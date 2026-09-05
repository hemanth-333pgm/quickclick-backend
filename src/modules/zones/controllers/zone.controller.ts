import { Request, Response, NextFunction } from "express";
import { ZoneService } from "../services/zone.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class ZoneController {
    private zoneService: ZoneService;

    constructor() {
        this.zoneService = new ZoneService();
    }

    createZone = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const data = req.body;
            const zone = await this.zoneService.createZone(adminId, data);
            res.status(201).json(SuccessResponse.success("Zone created successfully", zone));
        } catch (error) {
            next(error);
        }
    };

    getZonesByTaluk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { taluk, district } = req.params;
            const zones = await this.zoneService.getZonesByTaluk(taluk, district);
            res.json(SuccessResponse.success("Zones retrieved successfully", zones));
        } catch (error) {
            next(error);
        }
    };

    getZoneById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const zone = await this.zoneService.getZoneById(id);
            if (!zone) {
                throw new AppError("Zone not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            res.json(SuccessResponse.success("Zone details retrieved", zone));
        } catch (error) {
            next(error);
        }
    };

    updateZone = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { id } = req.params;
            const data = req.body;
            const zone = await this.zoneService.updateZone(id, adminId, data);
            res.json(SuccessResponse.success("Zone updated successfully", zone));
        } catch (error) {
            next(error);
        }
    };

    assignRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { zoneId, retailerId } = req.params;
            const result = await this.zoneService.assignRetailerToZone(zoneId, retailerId, adminId);
            res.json(SuccessResponse.success("Retailer assigned to zone successfully", result));
        } catch (error) {
            next(error);
        }
    };

    assignDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { zoneId, partnerId } = req.params;
            const result = await this.zoneService.assignDeliveryPartnerToZone(zoneId, partnerId, adminId);
            res.json(SuccessResponse.success("Delivery partner assigned to zone successfully", result));
        } catch (error) {
            next(error);
        }
    };

    checkServiceability = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pincode, lat, lng } = req.query;
            
            if (!pincode || !lat || !lng) {
                throw new AppError("Pincode, latitude, and longitude are required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.zoneService.isServiceable(
                pincode as string,
                parseFloat(lat as string),
                parseFloat(lng as string)
            );
            
            res.json(SuccessResponse.success("Serviceability checked", result));
        } catch (error) {
            next(error);
        }
    };

    getZoneByPincode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { pincode } = req.params;
            const zone = await this.zoneService.getZoneByPincode(pincode);
            if (!zone) {
                throw new AppError("No zone found for this pincode", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            res.json(SuccessResponse.success("Zone found", zone));
        } catch (error) {
            next(error);
        }
    };

    getTalukDashboard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const adminId = req.userId;
            if (!adminId) {
                throw new AppError("Admin not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const dashboard = await this.zoneService.getTalukDashboard(adminId);
            res.json(SuccessResponse.success("Dashboard retrieved", dashboard));
        } catch (error) {
            next(error);
        }
    };
}
