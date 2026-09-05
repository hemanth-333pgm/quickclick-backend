import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import routes from "./routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quickclick";

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

// Health check
app.get("/health", (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime(),
        database: dbStatus,
        mongodb_uri: MONGODB_URI ? "configured" : "not configured"
    });
});

// Database status
app.get("/health/db", (req, res) => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    res.json({
        status: states[mongoose.connection.readyState as keyof typeof states] || "unknown",
        readyState: mongoose.connection.readyState,
        database: mongoose.connection.name || "quickclick",
        host: mongoose.connection.host || "localhost",
        port: mongoose.connection.port || 27017
    });
});

// API routes
app.get("/api/v1/ping", (req, res) => {
    res.json({ 
        message: "pong", 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// Mount all routes
app.use("/api/v1", routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: `Route ${req.method} ${req.url} not found`
        }
    });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error("❌ Error:", err.message);
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: err.message || "Internal Server Error"
        }
    });
});

// Connect to MongoDB with better error handling
const connectWithRetry = async (retries: number = 5, delay: number = 2000) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            console.log(`📡 Attempting to connect to MongoDB (attempt ${attempt + 1}/${retries})...`);
            console.log(`📍 URI: ${MONGODB_URI}`);
            
            await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            console.log("✅ MongoDB connected successfully!");
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`📍 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            return true;
        } catch (error) {
            attempt++;
            console.error(`❌ Connection attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
            
            if (attempt < retries) {
                console.log(`⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
};

// Start server
const startServer = async () => {
    // Try to connect to MongoDB with retries
    const connected = await connectWithRetry(5, 2000);
    
    if (!connected) {
        console.log("⚠️ Could not connect to MongoDB after multiple attempts. Running without database.");
        console.log("💡 To fix MongoDB connection:");
        console.log("   1. Check if MongoDB is running: netstat -ano | findstr :27017");
        console.log("   2. Start MongoDB: C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe --dbpath C:\\data\\db");
        console.log("   3. Check .env file has correct MONGODB_URI");
    }

    app.listen(PORT, () => {
        const dbStatus = mongoose.connection.readyState === 1 ? "✅ Connected" : "⚠️ Disconnected";
        console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║  🚀 QUICKCLICK BACKEND SERVER                                         ║
║  📡 Environment: ${process.env.NODE_ENV || "development"}                         ║
║  🌐 URL: http://localhost:${PORT}                                      ║
║  🗄️  Database: ${dbStatus}                                               ║
║  📚 Health: http://localhost:${PORT}/health                            ║
║  📊 DB Status: http://localhost:${PORT}/health/db                      ║
║                                                                        ║
║  📦 API Endpoints:                                                     ║
║  👤 Auth: /api/v1/auth                                               ║
║  👤 Users: /api/v1/users                                             ║
║  🏪 Retailers: /api/v1/retailers                                     ║
║  📦 Products: /api/v1/products                                       ║
║  📋 Orders: /api/v1/orders                                           ║
║  🚚 Delivery: /api/v1/delivery                                       ║
║  👑 Admin: /api/v1/admin                                             ║
║  🗺️  Location: /api/v1/location                                      ║
╚══════════════════════════════════════════════════════════════════════════╝
        `);
    });
};

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🔄 Shutting down gracefully...");
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log("✅ MongoDB disconnected");
    }
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🔄 Shutting down gracefully...");
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log("✅ MongoDB disconnected");
    }
    process.exit(0);
});
