import { Request, Response, NextFunction } from "express";
import { LocationService } from "../services/location.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { Geofence } from "../models/location.model";

export class LocationController {
    private locationService: LocationService;

    constructor() {
        this.locationService = new LocationService();
    }

    geocodeAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { address } = req.query;
            if (!address) {
                throw new AppError("Address is required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.geocodeAddress(address as string);
            res.json(SuccessResponse.success("Address geocoded successfully", result));
        } catch (error) {
            next(error);
        }
    };

    reverseGeocode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng } = req.query;
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.reverseGeocode(
                parseFloat(lat as string),
                parseFloat(lng as string)
            );
            res.json(SuccessResponse.success("Address found successfully", result));
        } catch (error) {
            next(error);
        }
    };

    getRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startLat, startLng, endLat, endLng, profile } = req.query;
            if (!startLat || !startLng || !endLat || !endLng) {
                throw new AppError("Start and end coordinates are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const route = await this.locationService.getRoute(
                { lat: parseFloat(startLat as string), lng: parseFloat(startLng as string) },
                { lat: parseFloat(endLat as string), lng: parseFloat(endLng as string) },
                (profile as "car" | "bike" | "walk") || "car"
            );
            res.json(SuccessResponse.success("Route calculated successfully", route));
        } catch (error) {
            next(error);
        }
    };

    getOptimalRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { start, waypoints, end, profile } = req.body;
            if (!start || !waypoints || !end) {
                throw new AppError("Start, waypoints, and end are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const route = await this.locationService.getOptimalRoute(
                start,
                waypoints,
                end,
                profile || "car"
            );
            res.json(SuccessResponse.success("Optimal route calculated successfully", route));
        } catch (error) {
            next(error);
        }
    };

    checkServiceability = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng, radius } = req.query;
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.getServiceableLocations(
                parseFloat(lat as string),
                parseFloat(lng as string),
                radius ? parseFloat(radius as string) : 10
            );
            res.json(SuccessResponse.success("Serviceability checked successfully", result));
        } catch (error) {
            next(error);
        }
    };

    saveLocation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng, address } = req.body;
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.saveUserLocation(
                userId,
                lat,
                lng,
                address
            );
            res.status(201).json(SuccessResponse.success("Location saved successfully", result));
        } catch (error) {
            next(error);
        }
    };

    getNearbyLocations = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng, maxDistance, limit } = req.query;
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.findNearestLocations(
                parseFloat(lat as string),
                parseFloat(lng as string),
                maxDistance ? parseFloat(maxDistance as string) : 10,
                limit ? parseInt(limit as string) : 10
            );
            res.json(SuccessResponse.success("Nearby locations found", result));
        } catch (error) {
            next(error);
        }
    };

    getGeofences = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng } = req.query;
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.getGeofencesForPoint(
                parseFloat(lat as string),
                parseFloat(lng as string)
            );
            res.json(SuccessResponse.success("Geofences found", result));
        } catch (error) {
            next(error);
        }
    };

    getDeliveryTracking = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderId } = req.params;
            const deliveryPartnerId = req.query.deliveryPartnerId as string;
            if (!orderId) {
                throw new AppError("Order ID is required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const result = await this.locationService.getDeliveryTracking(
                orderId,
                deliveryPartnerId
            );
            res.json(SuccessResponse.success("Delivery tracking data", result));
        } catch (error) {
            next(error);
        }
    };

    createGeofence = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, center, radius, type, retailerId } = req.body;
            if (!name || !center || !radius || !type) {
                throw new AppError("Name, center, radius, and type are required", 400, ErrorCodes.VALIDATION_ERROR);
            }
            const geofence = new Geofence({
                name,
                center,
                radius,
                type,
                retailerId,
                isActive: true
            });
            await geofence.save();
            res.status(201).json(SuccessResponse.success("Geofence created successfully", geofence));
        } catch (error) {
            next(error);
        }
    };

    updateGeofence = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            const geofence = await Geofence.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            );
            if (!geofence) {
                throw new AppError("Geofence not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            res.json(SuccessResponse.success("Geofence updated successfully", geofence));
        } catch (error) {
            next(error);
        }
    };

    deleteGeofence = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const geofence = await Geofence.findByIdAndDelete(id);
            if (!geofence) {
                throw new AppError("Geofence not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
            }
            res.json(SuccessResponse.success("Geofence deleted successfully", null));
        } catch (error) {
            next(error);
        }
    };
}
