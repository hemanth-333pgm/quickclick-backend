import mongoose from "mongoose";
import { logger } from "./logger";

export const createOptimizedIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        if (!db) return;

        logger.info("📊 Creating optimized database indexes...");

        // Users Collection
        await db.collection("users").createIndexes([
            { key: { mobile: 1 }, unique: true },
            { key: { email: 1 }, sparse: true, unique: true },
            { key: { role: 1, status: 1 } },
            { key: { createdAt: -1 } },
            { key: { "zone.taluk": 1, "zone.district": 1 } }
        ]);

        // Products Collection
        await db.collection("products").createIndexes([
            { key: { retailerId: 1, status: 1, categoryId: 1 } },
            { key: { name: "text", tags: "text", description: "text" } },
            { key: { price: 1 } },
            { key: { createdAt: -1 } },
            { key: { stockQty: 1, status: 1 } },
            { key: { isFeatured: 1, status: 1 } }
        ]);

        // Orders Collection
        await db.collection("orders").createIndexes([
            { key: { orderNumber: 1 }, unique: true },
            { key: { userId: 1, createdAt: -1 } },
            { key: { retailerId: 1, status: 1, createdAt: -1 } },
            { key: { status: 1, createdAt: -1 } },
            { key: { deliveryPartnerId: 1, status: 1 } },
            { key: { "addressSnapshot.pincode": 1 } },
            { key: { createdAt: -1 } },
            { key: { total: 1 } }
        ]);

        // Retailers Collection
        await db.collection("retailers").createIndexes([
            { key: { location: "2dsphere" } },
            { key: { status: 1, isOpen: 1 } },
            { key: { "zone.taluk": 1, "zone.district": 1 } },
            { key: { rating: -1 } },
            { key: { totalOrders: -1 } }
        ]);

        // Delivery Assignments
        await db.collection("deliveryassignments").createIndexes([
            { key: { orderId: 1 }, unique: true },
            { key: { deliveryPartnerId: 1, status: 1, createdAt: -1 } },
            { key: { status: 1, offeredAt: 1 } },
            { key: { "dropoffLocation": "2dsphere" } },
            { key: { "pickupLocation": "2dsphere" } }
        ]);

        // Zones Collection
        await db.collection("zones").createIndexes([
            { key: { boundaries: "2dsphere" } },
            { key: { center: "2dsphere" } },
            { key: { taluk: 1, district: 1 } },
            { key: { pincodes: 1 } },
            { key: { isActive: 1 } }
        ]);

        // Notifications Collection
        await db.collection("notifications").createIndexes([
            { key: { userId: 1, createdAt: -1 } },
            { key: { read: 1, createdAt: -1 } }
        ]);

        // Carts Collection
        await db.collection("carts").createIndexes([
            { key: { userId: 1 }, unique: true },
            { key: { updatedAt: -1 } }
        ]);

        logger.info("✅ Database indexes created successfully");
    } catch (error) {
        logger.error("❌ Failed to create indexes:", error);
    }
};
