import mongoose from "mongoose";
import { Zone, IZone } from "../models/zone.model";
import { TalukAdmin } from "../../users/models/taluk-admin.model";
import { UserZone } from "../models/user-zone.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { logger } from "../../../config/logger";

export class ZoneService {
    async createZone(adminId: string, data: any): Promise<IZone> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const talukAdmin = await TalukAdmin.findOne({
                userId: adminId,
                isActive: true,
            });

            if (!talukAdmin) {
                throw new AppError("Admin not authorized", 403, ErrorCodes.AUTH_FORBIDDEN);
            }

            const existingZone = await Zone.findOne({
                taluk: data.taluk,
                district: data.district,
                name: data.name,
            });

            if (existingZone) {
                throw new AppError("Zone already exists", 409, ErrorCodes.USER_ALREADY_EXISTS);
            }

            const zone = new Zone({
                ...data,
                isActive: true,
                assignedAdmins: [talukAdmin._id],
                stats: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    activeRetailers: 0,
                    activeDeliveryPartners: 0,
                },
            });

            await zone.save({ session });
            await TalukAdmin.findByIdAndUpdate(
                talukAdmin._id,
                { $push: { zones: zone._id } },
                { session }
            );

            await session.commitTransaction();
            return zone;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getZonesByTaluk(taluk: string, district: string): Promise<IZone[]> {
        return await Zone.find({
            taluk,
            district,
            isActive: true,
        }).sort({ name: 1 });
    }

    async getZoneById(zoneId: string): Promise<IZone | null> {
        return await Zone.findById(zoneId)
            .populate("assignedAdmins", "name email mobile")
            .populate("retailers", "shopName phone")
            .populate("deliveryPartners", "name mobile vehicleType");
    }

    async updateZone(zoneId: string, adminId: string, data: any): Promise<IZone | null> {
        const talukAdmin = await TalukAdmin.findOne({
            userId: adminId,
            zones: zoneId,
            isActive: true,
        });

        if (!talukAdmin) {
            throw new AppError("Admin not authorized for this zone", 403, ErrorCodes.AUTH_FORBIDDEN);
        }

        const zone = await Zone.findByIdAndUpdate(
            zoneId,
            { ...data },
            { new: true, runValidators: true }
        );

        if (!zone) {
            throw new AppError("Zone not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        return zone;
    }

    async assignRetailerToZone(zoneId: string, retailerId: string, adminId: string): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const talukAdmin = await TalukAdmin.findOne({
                userId: adminId,
                zones: zoneId,
                isActive: true,
            });

            if (!talukAdmin) {
                throw new AppError("Admin not authorized", 403, ErrorCodes.AUTH_FORBIDDEN);
            }

            await Zone.findByIdAndUpdate(
                zoneId,
                {
                    $addToSet: { retailers: retailerId },
                    $inc: { "stats.activeRetailers": 1 },
                },
                { session }
            );

            await UserZone.create([{
                userId: retailerId,
                zoneId,
                userType: "RETAILER",
                status: "ACTIVE",
                assignedBy: adminId,
            }], { session });

            await session.commitTransaction();
            return { success: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async assignDeliveryPartnerToZone(zoneId: string, partnerId: string, adminId: string): Promise<any> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const talukAdmin = await TalukAdmin.findOne({
                userId: adminId,
                zones: zoneId,
                isActive: true,
            });

            if (!talukAdmin) {
                throw new AppError("Admin not authorized", 403, ErrorCodes.AUTH_FORBIDDEN);
            }

            await Zone.findByIdAndUpdate(
                zoneId,
                {
                    $addToSet: { deliveryPartners: partnerId },
                    $inc: { "stats.activeDeliveryPartners": 1 },
                },
                { session }
            );

            await UserZone.create([{
                userId: partnerId,
                zoneId,
                userType: "DELIVERY",
                status: "ACTIVE",
                assignedBy: adminId,
            }], { session });

            await session.commitTransaction();
            return { success: true };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getZoneByPincode(pincode: string): Promise<IZone | null> {
        return await Zone.findOne({
            pincodes: pincode,
            isActive: true,
        });
    }

    async getZoneByLocation(lat: number, lng: number): Promise<IZone | null> {
        return await Zone.findOne({
            isActive: true,
            boundaries: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                },
            },
        });
    }

    async isServiceable(pincode: string, lat: number, lng: number): Promise<any> {
        let zone = await this.getZoneByPincode(pincode);

        if (!zone) {
            zone = await this.getZoneByLocation(lat, lng);
        }

        if (!zone) {
            return {
                serviceable: false,
                message: "This location is not serviceable",
            };
        }

        if (!zone.isActive) {
            return {
                serviceable: false,
                message: "This zone is currently inactive",
            };
        }

        if (zone.settings.holidayMode) {
            return {
                serviceable: false,
                message: "Zone is in holiday mode",
            };
        }

        return {
            serviceable: true,
            zone,
        };
    }

    async getTalukDashboard(talukAdminId: string): Promise<any> {
        const talukAdmin = await TalukAdmin.findOne({
            userId: talukAdminId,
            isActive: true,
        }).populate("zones");

        if (!talukAdmin) {
            throw new AppError("Admin not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        const zones = await Zone.find({
            _id: { $in: talukAdmin.zones },
        });

        const totalOrders = zones.reduce((sum, z) => sum + z.stats.totalOrders, 0);
        const totalRevenue = zones.reduce((sum, z) => sum + z.stats.totalRevenue, 0);
        const totalRetailers = zones.reduce((sum, z) => sum + z.stats.activeRetailers, 0);
        const totalDeliveryPartners = zones.reduce((sum, z) => sum + z.stats.activeDeliveryPartners, 0);

        return {
            admin: talukAdmin,
            zones: zones,
            summary: {
                totalZones: zones.length,
                totalOrders,
                totalRevenue,
                totalRetailers,
                totalDeliveryPartners,
            },
        };
    }
}

