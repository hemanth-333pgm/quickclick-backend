import { Request, Response, NextFunction } from "express";
import { MapService } from "../services/map.service";
import { SuccessResponse } from "../../../common/response/success-response";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";

export class MapController {
    private mapService: MapService;

    constructor() {
        this.mapService = new MapService();
    }

    // ==================== GEOCODING ====================

    geocode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { address } = req.query;
            if (!address) {
                throw new AppError("Address is required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.geocodeAddress(address as string);
            res.json(SuccessResponse.success("Address geocoded", result));
        } catch (error) {
            next(error);
        }
    };

    reverseGeocode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng } = req.query;
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.reverseGeocode(
                parseFloat(lat as string),
                parseFloat(lng as string)
            );
            res.json(SuccessResponse.success("Address found", result));
        } catch (error) {
            next(error);
        }
    };

    // ==================== ROUTING ====================

    getRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { startLat, startLng, endLat, endLng, mode = "DRIVING" } = req.query;
            
            if (!startLat || !startLng || !endLat || !endLng) {
                throw new AppError("Start and end coordinates required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.getRoute(
                {
                    lat: parseFloat(startLat as string),
                    lng: parseFloat(startLng as string),
                },
                {
                    lat: parseFloat(endLat as string),
                    lng: parseFloat(endLng as string),
                },
                mode as "DRIVING" | "WALKING" | "BICYCLING"
            );
            res.json(SuccessResponse.success("Route calculated", result));
        } catch (error) {
            next(error);
        }
    };

    getOptimalRoute = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { start, waypoints, end, mode = "DRIVING" } = req.body;
            
            if (!start || !end) {
                throw new AppError("Start and end required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.getOptimalRoute(
                start,
                waypoints || [],
                end,
                mode as "DRIVING" | "WALKING" | "BICYCLING"
            );
            res.json(SuccessResponse.success("Optimal route calculated", result));
        } catch (error) {
            next(error);
        }
    };

    // ==================== MARKERS ====================

    createMarker = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const result = await this.mapService.createMarker({
                ...req.body,
                userId,
            });
            res.status(201).json(SuccessResponse.success("Marker created", result));
        } catch (error) {
            next(error);
        }
    };

    getMarkers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type, lat, lng, radius = 10 } = req.query;
            
            if (!type || !lat || !lng) {
                throw new AppError("Type, latitude and longitude required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.getMarkersByType(
                type as string,
                parseFloat(lat as string),
                parseFloat(lng as string),
                parseFloat(radius as string)
            );
            res.json(SuccessResponse.success("Markers retrieved", result));
        } catch (error) {
            next(error);
        }
    };

    updateMarkerLocation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_UNAUTHORIZED);
            }

            const { id } = req.params;
            const { lat, lng } = req.body;

            if (!lat || !lng) {
                throw new AppError("Latitude and longitude required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.updateMarkerLocation(id, lat, lng);
            res.json(SuccessResponse.success("Marker updated", result));
        } catch (error) {
            next(error);
        }
    };

    // ==================== GEO FENCING ====================

    createGeofence = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.mapService.createGeofence(req.body);
            res.status(201).json(SuccessResponse.success("Geofence created", result));
        } catch (error) {
            next(error);
        }
    };

    checkGeofence = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng, geofenceId } = req.query;
            
            if (!lat || !lng || !geofenceId) {
                throw new AppError("Latitude, longitude and geofenceId required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.checkPointInGeofence(
                parseFloat(lat as string),
                parseFloat(lng as string),
                geofenceId as string
            );
            res.json(SuccessResponse.success("Geofence check", { inside: result }));
        } catch (error) {
            next(error);
        }
    };

    getGeofences = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { lat, lng } = req.query;
            
            if (!lat || !lng) {
                throw new AppError("Latitude and longitude required", 400, ErrorCodes.VALIDATION_ERROR);
            }

            const result = await this.mapService.getGeofencesByLocation(
                parseFloat(lat as string),
                parseFloat(lng as string)
            );
            res.json(SuccessResponse.success("Geofences retrieved", result));
        } catch (error) {
            next(error);
        }
    };
}
