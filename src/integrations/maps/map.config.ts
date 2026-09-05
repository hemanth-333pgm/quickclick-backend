export const MapConfig = {
    // Leaflet default settings
    defaultZoom: 13,
    defaultLat: 28.6139,
    defaultLng: 77.2090,
    
    // Service area settings
    maxServiceRadius: 50, // kilometers
    defaultServiceRadius: 10, // kilometers
    minServiceRadius: 1, // kilometers
    
    // Delivery settings
    maxDeliveryDistance: 30, // kilometers
    estimatedSpeed: 30, // km/h average
    trafficMultiplier: 1.2,
    
    // Geocoding
    geocodingProvider: "nominatim", // or "google", "openstreetmap"
    
    // Routing
    routingProvider: "osrm", // or "google", "openstreetmap"
    
    // Cache settings
    cacheTTL: 3600, // seconds
    cacheMaxSize: 1000, // items
    
    // Map tile settings
    tileLayer: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 3
    }
};

export const MapProviders = {
    OSM: "openstreetmap",
    GOOGLE: "google",
    MAPBOX: "mapbox",
    HERE: "here"
} as const;

export const MapEvents = {
    LOCATION_UPDATE: "location:update",
    ROUTE_CALCULATED: "route:calculated",
    SERVICE_AREA_CHECK: "service:area:check",
    DELIVERY_TRACKING: "delivery:tracking"
} as const;
