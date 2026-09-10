import express, { Application } from "express";
import mongoose from "mongoose";
import { ensureGeoIndexes } from "./config/database-indexes";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./modules/auth/routes";
import userRoutes from "./modules/users/routes";
import retailerRoutes from "./modules/retailers/routes";
import productRoutes from "./modules/products/routes";
import orderRoutes from "./modules/orders/routes";
import deliveryRoutes from "./modules/delivery/routes";
import adminRoutes from "./modules/admin/routes";
import locationRoutes from "./modules/location/routes/location.routes";
import zoneRoutes from "./modules/zones/routes/zone.routes";
import notificationRoutes from "./modules/notifications/routes";
import verificationRoutes from "./modules/verification/routes/verification.routes";
import addressRoutes from "./modules/addresses/routes";
import cartRoutes from "./modules/cart/routes";
import categoryRoutes from "./modules/categories/routes";
import couponRoutes from "./modules/coupons/routes";
import kycRoutes from "./modules/kyc/routes";
import mapRoutes from "./modules/map/routes/map.routes";
import paymentRoutes from "./modules/payments/routes";
import ratingRoutes from "./modules/ratings/routes";
import reportRoutes from "./modules/reports/routes";
import walletRoutes from "./modules/wallet/routes";
import wishlistRoutes from "./modules/wishlist/routes";
import customerRoutes from "./modules/customer/routes";

// Import middleware
import { errorHandler } from "./middleware/error.middleware";
import { HealthController } from "./controllers/health.controller";

// Import WebSocket
import { WebSocketService } from "./integrations/websocket/websocket.service";

const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quickclick";
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

// Initialize WebSocket
const webSocketService = new WebSocketService(server);

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true
}));
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check
app.get("/health", HealthController.getHealthStatus);

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/retailers`, retailerRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/delivery`, deliveryRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/location`, locationRoutes);
app.use(`${API_PREFIX}/zones`, zoneRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/verification`, verificationRoutes);
app.use(`${API_PREFIX}/retailer`, retailerRoutes);
app.use(`${API_PREFIX}/addresses`, addressRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);
app.use(`${API_PREFIX}/kyc`, kycRoutes);
app.use(`${API_PREFIX}/map`, mapRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/ratings`, ratingRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
app.use(`${API_PREFIX}/customer`, customerRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: `Route ${req.method} ${req.url} not found`
        }
    });
});

// Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        await ensureGeoIndexes();
        console.log("✅ MongoDB connected successfully");
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`📍 Host: ${mongoose.connection.host}`);

        server.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║  🚀 QUICKCLICK BACKEND SERVER                                         ║
║  📡 Environment: ${process.env.NODE_ENV || "development"}                         ║
║  🌐 URL: http://localhost:${PORT}                                      ║
║  🔌 WebSocket: ws://localhost:${PORT}/socket.io                        ║
║  🗄️  Database: ✅ Connected                                          ║
║  📚 Health: http://localhost:${PORT}/health                            ║
║                                                                        ║
║  📦 API Endpoints:                                                     ║
║  👤 Auth: ${API_PREFIX}/auth                                         ║
║  👤 Users: ${API_PREFIX}/users                                       ║
║  🏪 Retailers: ${API_PREFIX}/retailers                               ║
║  📦 Products: ${API_PREFIX}/products                                 ║
║  📋 Orders: ${API_PREFIX}/orders                                     ║
║  🚚 Delivery: ${API_PREFIX}/delivery                                 ║
║  👑 Admin: ${API_PREFIX}/admin                                       ║
║  🗺️  Location: ${API_PREFIX}/location                                ║
║  🌍 Zones: ${API_PREFIX}/zones                                       ║
║  🔔 Notifications: ${API_PREFIX}/notifications                       ║
║  ✅ Verification: ${API_PREFIX}/verification                         ║
╚══════════════════════════════════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();

// Graceful Shutdown
process.on("SIGINT", async () => {
    console.log("\n🔄 Shutting down gracefully...");
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🔄 Shutting down gracefully...");
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
    process.exit(0);
});



