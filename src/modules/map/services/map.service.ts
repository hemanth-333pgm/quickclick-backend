import mongoose from "mongoose";
import axios from "axios";
import { MapMarker, MapRoute, GeoFence } from "../models/map.model";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCodes } from "../../../common/constants/error-codes.constants";
import { logger } from "../../../config/logger";

export class MapService {
    // ==================== GEOCODING ====================

    async geocodeAddress(address: string): Promise<any> {
        try {
            // Using Nominatim (OpenStreetMap) - Free
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "QuickClick App",
                },
            });

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    displayName: result.display_name,
                    osmId: result.osm_id,
                    osmType: result.osm_type,
                };
            }
            return null;
        } catch (error) {
            logger.error("Geocoding failed:", error);
            throw new AppError("Geocoding failed", 500, ErrorCodes.INTERNAL_ERROR);
        }
    }

    async reverseGeocode(lat: number, lng: number): Promise<any> {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "QuickClick App",
                },
            });

            if (response.data) {
                return {
                    address: response.data.display_name,
                    latitude: lat,
                    longitude: lng,
                };
            }
            return null;
        } catch (error) {
            logger.error("Reverse geocoding failed:", error);
            throw new AppError("Reverse geocoding failed", 500, ErrorCodes.INTERNAL_ERROR);
        }
    }

    // ==================== ROUTING ====================

    async getRoute(
        start: { lat: number; lng: number },
        end: { lat: number; lng: number },
        mode: "DRIVING" | "WALKING" | "BICYCLING" = "DRIVING"
    ): Promise<any> {
        try {
            // Using OSRM (OpenStreetMap Routing Machine) - Free
            const profileMap = {
                DRIVING: "driving",
                WALKING: "walking",
                BICYCLING: "cycling",
            };

            const url = `https://router.project-osrm.org/route/v1/${profileMap[mode]}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            
            const response = await axios.get(url);

            if (response.data && response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const geometry = route.geometry;

                return {
                    distance: route.distance / 1000, // Convert to kilometers
                    duration: route.duration / 60, // Convert to minutes
                    polyline: this.encodePolyline(geometry.coordinates),
                    geometry: geometry,
                    coordinates: geometry.coordinates.map((coord: number[]) => ({
                        latitude: coord[1],
                        longitude: coord[0],
                    })),
                };
            }
            return null;
        } catch (error) {
            logger.error("Routing failed:", error);
            throw new AppError("Routing failed", 500, ErrorCodes.INTERNAL_ERROR);
        }
    }

    async getOptimalRoute(
        start: { lat: number; lng: number },
        waypoints: Array<{ lat: number; lng: number }>,
        end: { lat: number; lng: number },
        mode: "DRIVING" | "WALKING" | "BICYCLING" = "DRIVING"
    ): Promise<any> {
        try {
            const profileMap = {
                DRIVING: "driving",
                WALKING: "walking",
                BICYCLING: "cycling",
            };

            // Build coordinates string
            const coords = [
                `${start.lng},${start.lat}`,
                ...waypoints.map(w => `${w.lng},${w.lat}`),
                `${end.lng},${end.lat}`,
            ].join(";");

            const url = `https://router.project-osrm.org/route/v1/${profileMap[mode]}/${coords}?overview=full&geometries=geojson&steps=true`;
            
            const response = await axios.get(url);

            if (response.data && response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const geometry = route.geometry;

                return {
                    distance: route.distance / 1000,
                    duration: route.duration / 60,
                    polyline: this.encodePolyline(geometry.coordinates),
                    geometry: geometry,
                    coordinates: geometry.coordinates.map((coord: number[]) => ({
                        latitude: coord[1],
                        longitude: coord[0],
                    })),
                    waypointOrder: route.waypoints.map((w: any) => w.waypoint_index),
                };
            }
            return null;
        } catch (error) {
            logger.error("Optimal routing failed:", error);
            throw new AppError("Optimal routing failed", 500, ErrorCodes.INTERNAL_ERROR);
        }
    }

    // ==================== POLYLINE ENCODING ====================

    encodePolyline(coordinates: number[][]): string {
        let polyline = "";
        let prevLat = 0;
        let prevLng = 0;

        for (const coord of coordinates) {
            const lat = Math.round(coord[1] * 1e5);
            const lng = Math.round(coord[0] * 1e5);
            
            const dLat = lat - prevLat;
            const dLng = lng - prevLng;
            
            polyline += this.encodeNumber(dLat);
            polyline += this.encodeNumber(dLng);
            
            prevLat = lat;
            prevLng = lng;
        }

        return polyline;
    }

    private encodeNumber(num: number): string {
        const n = num < 0 ? ~(num << 1) : num << 1;
        return this.encodeUnsigned(n);
    }

    private encodeUnsigned(num: number): string {
        let result = "";
        let n = num;
        while (n >= 0x20) {
            result += String.fromCharCode((n & 0x1f) | 0x20);
            n >>= 5;
        }
        result += String.fromCharCode(n | 0x20);
        return result;
    }

    // ==================== MARKERS ====================

    async createMarker(data: any): Promise<any> {
        const marker = new MapMarker({
            ...data,
            location: {
                type: "Point",
                coordinates: [data.location.longitude, data.location.latitude],
            },
        });
        await marker.save();
        return marker;
    }

    async getMarkersByType(
        type: string,
        lat: number,
        lng: number,
        radius: number = 10
    ): Promise<any[]> {
        return await MapMarker.find({
            type,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: radius * 1000,
                },
            },
        }).populate("referenceId");
    }

    async updateMarkerLocation(
        markerId: string,
        lat: number,
        lng: number
    ): Promise<any> {
        const marker = await MapMarker.findByIdAndUpdate(
            markerId,
            {
                location: {
                    type: "Point",
                    coordinates: [lng, lat],
                },
            },
            { new: true }
        );
        if (!marker) {
            throw new AppError("Marker not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }
        return marker;
    }

    // ==================== GEO FENCING ====================

    async createGeofence(data: any): Promise<any> {
        const geofence = new GeoFence(data);
        await geofence.save();
        return geofence;
    }

    async checkPointInGeofence(
        lat: number,
        lng: number,
        geofenceId: string
    ): Promise<boolean> {
        const geofence = await GeoFence.findById(geofenceId);
        if (!geofence) {
            throw new AppError("Geofence not found", 404, ErrorCodes.RESOURCE_NOT_FOUND);
        }

        // Check if point is inside polygon
        return this.isPointInPolygon(lat, lng, geofence.coordinates[0]);
    }

    private isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
        let inside = false;
        const x = lng;
        const y = lat;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0];
            const yi = polygon[i][1];
            const xj = polygon[j][0];
            const yj = polygon[j][1];

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    }

    async getGeofencesByLocation(
        lat: number,
        lng: number
    ): Promise<any[]> {
        return await GeoFence.find({
            isActive: true,
            coordinates: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                },
            },
        });
    }
}
