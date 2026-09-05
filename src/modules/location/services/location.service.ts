import mongoose from "mongoose";
import { Location, Geofence } from "../models/location.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { logger } from "../../../config/logger";

// Define API response interfaces
interface GeocodingResult {
    lat: string;
    lon: string;
    display_name: string;
    [key: string]: any;
}

interface ReverseGeocodingResult {
    display_name: string;
    [key: string]: any;
}

interface RouteResult {
    routes: Array<{
        distance: number;
        duration: number;
        geometry: {
            coordinates: number[][];
            type: string;
        };
        [key: string]: any;
    }>;
    [key: string]: any;
}

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface RouteInfo {
    distance: number;
    duration: number;
    points: GeoPoint[];
    polyline?: string;
}

export class LocationService {
    static calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
        const R = 6371;
        const dLat = this.toRadians(point2.lat - point1.lat);
        const dLng = this.toRadians(point2.lng - point1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static calculateETA(distance: number, speed: number = 30, trafficMultiplier: number = 1.2): number {
        return (distance / speed) * 60 * trafficMultiplier;
    }

    static isWithinServiceArea(point: GeoPoint, center: GeoPoint, radiusKm: number): boolean {
        return this.calculateDistance(point, center) <= radiusKm;
    }

    async findNearestLocations(lat: number, lng: number, maxDistance: number = 10, limit: number = 10): Promise<any[]> {
        return await Location.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [lng, lat]
                    },
                    distanceField: "distance",
                    maxDistance: maxDistance * 1000,
                    spherical: true
                }
            },
            { $limit: limit }
        ]);
    }

    async getServiceableLocations(lat: number, lng: number, radius: number = 10): Promise<any> {
        const geofences = await Geofence.find({ type: "SERVICE_AREA", isActive: true });
        
        const serviceable = geofences.filter(geofence => {
            const distance = LocationService.calculateDistance(
                { lat, lng },
                { lat: geofence.center.latitude, lng: geofence.center.longitude }
            );
            return distance <= geofence.radius;
        });

        return {
            isServiceable: serviceable.length > 0,
            geofences: serviceable,
            distanceToNearest: serviceable.length > 0 ? 
                LocationService.calculateDistance(
                    { lat, lng },
                    { lat: serviceable[0].center.latitude, lng: serviceable[0].center.longitude }
                ) : null
        };
    }

    async geocodeAddress(address: string): Promise<GeoPoint | null> {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
            const response = await fetch(url);
            const data = await response.json() as GeocodingResult[];

            if (Array.isArray(data) && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
            return null;
        } catch (error) {
            logger.error("Geocoding failed:", error);
            return null;
        }
    }

    async reverseGeocode(lat: number, lng: number): Promise<string | null> {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const response = await fetch(url);
            const data = await response.json() as ReverseGeocodingResult;

            if (data && data.display_name) {
                return data.display_name;
            }
            return null;
        } catch (error) {
            logger.error("Reverse geocoding failed:", error);
            return null;
        }
    }

    async getRoute(start: GeoPoint, end: GeoPoint, profile: "car" | "bike" | "walk" = "car"): Promise<RouteInfo | null> {
        try {
            const profileMap = { car: "driving", bike: "cycling", walk: "walking" };
            const url = `https://router.project-osrm.org/route/v1/${profileMap[profile]}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            
            const response = await fetch(url);
            const data = await response.json() as RouteResult;

            if (data && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const points = route.geometry.coordinates.map((coord: number[]) => ({
                    lat: coord[1],
                    lng: coord[0]
                }));

                return {
                    distance: route.distance / 1000,
                    duration: route.duration / 60,
                    points: points,
                    polyline: JSON.stringify(route.geometry)
                };
            }
            return null;
        } catch (error) {
            logger.error("Routing failed:", error);
            return null;
        }
    }

    async getOptimalRoute(start: GeoPoint, waypoints: GeoPoint[], end: GeoPoint, profile: "car" | "bike" | "walk" = "car"): Promise<any> {
        try {
            const waypointsStr = waypoints.map(w => `${w.lng},${w.lat}`).join(";");
            const profileMap = { car: "driving", bike: "cycling", walk: "walking" };
            const url = `https://router.project-osrm.org/route/v1/${profileMap[profile]}/${start.lng},${start.lat};${waypointsStr};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
            
            const response = await fetch(url);
            const data = await response.json() as RouteResult;

            if (data && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const points = route.geometry.coordinates.map((coord: number[]) => ({
                    lat: coord[1],
                    lng: coord[0]
                }));

                return {
                    route: {
                        distance: route.distance / 1000,
                        duration: route.duration / 60,
                        points: points,
                        polyline: JSON.stringify(route.geometry)
                    },
                    optimizedOrder: []
                };
            }
            return null;
        } catch (error) {
            logger.error("Optimal routing failed:", error);
            return null;
        }
    }

    async getGeofencesForPoint(lat: number, lng: number): Promise<any[]> {
        const geofences = await Geofence.find({ isActive: true });
        return geofences.filter(geofence => 
            LocationService.isWithinServiceArea(
                { lat, lng },
                { lat: geofence.center.latitude, lng: geofence.center.longitude },
                geofence.radius
            )
        );
    }

    async saveUserLocation(userId: string, lat: number, lng: number, address?: string): Promise<any> {
        const location = new Location({
            userId: new mongoose.Types.ObjectId(userId),
            address: address || await this.reverseGeocode(lat, lng) || "Unknown location",
            latitude: lat,
            longitude: lng,
            type: "OTHER",
            isVerified: true,
            lastUsedAt: new Date()
        });
        await location.save();
        return location;
    }

    async getDeliveryTracking(orderId: string, deliveryPartnerId?: string): Promise<any> {
        return {
            orderId,
            status: "IN_TRANSIT",
            currentLocation: {
                lat: 28.6139,
                lng: 77.2090,
                accuracy: 20,
                timestamp: new Date()
            },
            route: null,
            estimatedArrival: new Date(Date.now() + 30 * 60000)
        };
    }

    static validateCoordinates(lat: number, lng: number): boolean {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
