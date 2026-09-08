// scripts/seed-database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Define schemas directly in the script
const UserSchema = new mongoose.Schema({
    name: String,
    mobile: { type: String, unique: true },
    email: String,
    role: String,
    status: String,
    isVerified: Boolean,
    avatarUrl: String,
    lastLoginAt: Date,
    createdAt: Date,
    updatedAt: Date
});

const RetailerSchema = new mongoose.Schema({
    shopName: String,
    phone: String,
    email: String,
    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number]
    },
    serviceRadiusKm: Number,
    status: String,
    isOpen: Boolean,
    rating: Number,
    totalOrders: Number,
    categories: [String]
});

const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
    imageUrl: String,
    isActive: Boolean,
    isFeatured: Boolean,
    sortOrder: Number
});

const ProductSchema = new mongoose.Schema({
    retailerId: mongoose.Schema.Types.ObjectId,
    categoryId: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    price: Number,
    discountPrice: Number,
    unit: String,
    stockQty: Number,
    imageUrl: [String],
    status: String,
    isFeatured: Boolean,
    tags: [String],
    preparationTime: Number
});

const ZoneSchema = new mongoose.Schema({
    name: String,
    taluk: String,
    district: String,
    state: String,
    pincodes: [String],
    center: {
        latitude: Number,
        longitude: Number
    },
    boundaries: {
        type: { type: String, enum: ["Polygon"] },
        coordinates: [[[Number]]]
    },
    radius: Number,
    isActive: Boolean,
    deliveryCharge: Number,
    minOrderAmount: Number,
    assignedAdmins: [mongoose.Schema.Types.ObjectId],
    stats: {
        totalOrders: Number,
        totalRevenue: Number,
        activeRetailers: Number,
        activeDeliveryPartners: Number
    }
});

const CouponSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    type: String,
    value: Number,
    minOrderValue: Number,
    maxDiscount: Number,
    startAt: Date,
    endAt: Date,
    usageLimit: Number,
    perUserLimit: Number,
    usedCount: Number,
    isActive: Boolean,
    description: String,
    applicableTo: String,
    metadata: {
        createdBy: mongoose.Schema.Types.ObjectId,
        campaignName: String
    }
});

const User = mongoose.model("User", UserSchema);
const Retailer = mongoose.model("Retailer", RetailerSchema);
const Category = mongoose.model("Category", CategorySchema);
const Product = mongoose.model("Product", ProductSchema);
const Zone = mongoose.model("Zone", ZoneSchema);
const Coupon = mongoose.model("Coupon", CouponSchema);

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/quickclick");
        console.log("✅ Connected to MongoDB");
        console.log(`📊 Database: ${mongoose.connection.name}`);

        // ============================================
        // CLEAR EXISTING DATA
        // ============================================
        console.log("\n🧹 Clearing existing data...");
        await User.deleteMany({});
        await Retailer.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Zone.deleteMany({});
        await Coupon.deleteMany({});
        console.log("✅ Data cleared");

        // ============================================
        // CREATE ADMIN USER
        // ============================================
        console.log("\n👑 Creating Admin User...");
        const admin = await User.create({
            name: "Super Admin",
            mobile: "+919888888888",
            email: "admin@quickclick.com",
            role: "ADMIN",
            status: "ACTIVE",
            isVerified: true,
            avatarUrl: "https://ui-avatars.com/api/?name=Admin&background=FF6B35&color=fff&size=128",
            lastLoginAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`✅ Admin created: ${admin.name} (${admin.mobile})`);

        // ============================================
        // CREATE CUSTOMER
        // ============================================
        console.log("\n👤 Creating Customer...");
        const customer = await User.create({
            name: "John Doe",
            mobile: "+919999999999",
            email: "john@example.com",
            role: "CUSTOMER",
            status: "ACTIVE",
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`✅ Customer created: ${customer.name} (${customer.mobile})`);

        // ============================================
        // CREATE CATEGORIES
        // ============================================
        console.log("\n📁 Creating Categories...");
        const categories = await Category.insertMany([
            {
                name: "Fruits & Vegetables",
                slug: "fruits-vegetables",
                description: "Fresh fruits and vegetables",
                isActive: true,
                isFeatured: true,
                sortOrder: 1
            },
            {
                name: "Groceries",
                slug: "groceries",
                description: "Daily grocery items",
                isActive: true,
                isFeatured: true,
                sortOrder: 2
            },
            {
                name: "Dairy & Eggs",
                slug: "dairy-eggs",
                description: "Fresh dairy products",
                isActive: true,
                isFeatured: true,
                sortOrder: 3
            },
            {
                name: "Beverages",
                slug: "beverages",
                description: "Drinks and beverages",
                isActive: true,
                isFeatured: false,
                sortOrder: 4
            },
            {
                name: "Snacks & Packaged Food",
                slug: "snacks-packaged",
                description: "Ready to eat snacks",
                isActive: true,
                isFeatured: false,
                sortOrder: 5
            },
            {
                name: "Personal Care",
                slug: "personal-care",
                description: "Personal hygiene products",
                isActive: true,
                isFeatured: false,
                sortOrder: 6
            }
        ]);
        console.log(`✅ ${categories.length} categories created`);

        // ============================================
        // CREATE RETAILERS
        // ============================================
        console.log("\n🏪 Creating Retailers...");
        const retailers = await Retailer.insertMany([
            {
                shopName: "QuickStore Supermarket",
                phone: "+918888888881",
                email: "store1@quickstore.com",
                address: {
                    line1: "123 Main Street",
                    city: "New Delhi",
                    state: "Delhi",
                    postalCode: "110001",
                    country: "India"
                },
                location: {
                    type: "Point",
                    coordinates: [77.2090, 28.6139]
                },
                serviceRadiusKm: 10,
                status: "APPROVED",
                isOpen: true,
                rating: 4.5,
                totalOrders: 150,
                categories: ["Groceries", "Essentials", "Fresh Food"]
            },
            {
                shopName: "FreshMart Grocery",
                phone: "+918888888882",
                email: "store2@freshmart.com",
                address: {
                    line1: "456 Park Avenue",
                    city: "New Delhi",
                    state: "Delhi",
                    postalCode: "110002",
                    country: "India"
                },
                location: {
                    type: "Point",
                    coordinates: [77.2190, 28.6239]
                },
                serviceRadiusKm: 8,
                status: "APPROVED",
                isOpen: true,
                rating: 4.2,
                totalOrders: 80,
                categories: ["Groceries", "Organic"]
            },
            {
                shopName: "Daily Needs Store",
                phone: "+918888888883",
                email: "store3@dailyneeds.com",
                address: {
                    line1: "789 Market Road",
                    city: "New Delhi",
                    state: "Delhi",
                    postalCode: "110003",
                    country: "India"
                },
                location: {
                    type: "Point",
                    coordinates: [77.2290, 28.6339]
                },
                serviceRadiusKm: 5,
                status: "PENDING",
                isOpen: false,
                rating: 0,
                totalOrders: 0,
                categories: ["Essentials"]
            }
        ]);
        console.log(`✅ ${retailers.length} retailers created`);

        // ============================================
        // CREATE PRODUCTS
        // ============================================
        console.log("\n📦 Creating Products...");
        const retailer1 = retailers[0];
        const retailer2 = retailers[1];
        const catFruits = categories[0];
        const catGroceries = categories[1];
        const catDairy = categories[2];

        const products = await Product.insertMany([
            {
                retailerId: retailer1._id,
                categoryId: catFruits._id,
                name: "Organic Apples",
                description: "Fresh organic apples from Kashmir",
                price: 120,
                discountPrice: 100,
                unit: "kg",
                stockQty: 100,
                imageUrl: ["https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Apples"],
                status: "ACTIVE",
                isFeatured: true,
                tags: ["organic", "fresh", "fruit"],
                preparationTime: 5
            },
            {
                retailerId: retailer1._id,
                categoryId: catGroceries._id,
                name: "Premium Basmati Rice",
                description: "Aged basmati rice from Himalayas",
                price: 85,
                discountPrice: 75,
                unit: "kg",
                stockQty: 200,
                imageUrl: ["https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Rice"],
                status: "ACTIVE",
                isFeatured: true,
                tags: ["basmati", "premium", "staple"],
                preparationTime: 10
            },
            {
                retailerId: retailer1._id,
                categoryId: catDairy._id,
                name: "Organic Milk (1L)",
                description: "Fresh organic milk from grass-fed cows",
                price: 60,
                discountPrice: 55,
                unit: "L",
                stockQty: 50,
                imageUrl: ["https://via.placeholder.com/300x300/FFE66D/FFFFFF?text=Milk"],
                status: "ACTIVE",
                isFeatured: false,
                tags: ["organic", "dairy", "fresh"],
                preparationTime: 2
            },
            {
                retailerId: retailer1._id,
                categoryId: catGroceries._id,
                name: "Whole Wheat Bread",
                description: "Freshly baked whole wheat bread",
                price: 40,
                discountPrice: 35,
                unit: "loaf",
                stockQty: 30,
                imageUrl: ["https://via.placeholder.com/300x300/F4A460/FFFFFF?text=Bread"],
                status: "ACTIVE",
                isFeatured: false,
                tags: ["baked", "fresh", "breakfast"],
                preparationTime: 3
            },
            {
                retailerId: retailer2._id,
                categoryId: catFruits._id,
                name: "Fresh Bananas",
                description: "Ripe and sweet bananas",
                price: 50,
                discountPrice: 45,
                unit: "dozen",
                stockQty: 80,
                imageUrl: ["https://via.placeholder.com/300x300/FFD93D/FFFFFF?text=Bananas"],
                status: "ACTIVE",
                isFeatured: true,
                tags: ["fresh", "fruit", "banana"],
                preparationTime: 2
            },
            {
                retailerId: retailer2._id,
                categoryId: catDairy._id,
                name: "Farm Fresh Eggs",
                description: "Free-range farm fresh eggs",
                price: 90,
                discountPrice: 85,
                unit: "dozen",
                stockQty: 60,
                imageUrl: ["https://via.placeholder.com/300x300/FF9F43/FFFFFF?text=Eggs"],
                status: "ACTIVE",
                isFeatured: false,
                tags: ["fresh", "eggs", "farm"],
                preparationTime: 2
            }
        ]);
        console.log(`✅ ${products.length} products created`);

        // ============================================
        // CREATE ZONES
        // ============================================
        console.log("\n🌍 Creating Zones...");
        const zones = await Zone.insertMany([
            {
                name: "Kochi Central",
                taluk: "Kochi",
                district: "Ernakulam",
                state: "Kerala",
                pincodes: ["682001", "682002", "682003", "682004", "682005"],
                center: {
                    latitude: 9.9312,
                    longitude: 76.2673
                },
                boundaries: {
                    type: "Polygon",
                    coordinates: [[
                        [76.2, 9.9],
                        [76.3, 9.9],
                        [76.3, 10.0],
                        [76.2, 10.0],
                        [76.2, 9.9]
                    ]]
                },
                radius: 10,
                isActive: true,
                deliveryCharge: 30,
                minOrderAmount: 100,
                assignedAdmins: [admin._id],
                stats: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    activeRetailers: 0,
                    activeDeliveryPartners: 0
                }
            },
            {
                name: "Kochi North",
                taluk: "Kochi",
                district: "Ernakulam",
                state: "Kerala",
                pincodes: ["682006", "682007", "682008"],
                center: {
                    latitude: 10.0,
                    longitude: 76.3
                },
                boundaries: {
                    type: "Polygon",
                    coordinates: [[
                        [76.25, 9.95],
                        [76.35, 9.95],
                        [76.35, 10.05],
                        [76.25, 10.05],
                        [76.25, 9.95]
                    ]]
                },
                radius: 8,
                isActive: true,
                deliveryCharge: 40,
                minOrderAmount: 150,
                assignedAdmins: [admin._id],
                stats: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    activeRetailers: 0,
                    activeDeliveryPartners: 0
                }
            }
        ]);
        console.log(`✅ ${zones.length} zones created`);

        // ============================================
        // CREATE COUPONS
        // ============================================
        console.log("\n🎫 Creating Coupons...");
        const coupons = await Coupon.insertMany([
            {
                code: "WELCOME10",
                type: "PERCENTAGE",
                value: 10,
                minOrderValue: 100,
                maxDiscount: 50,
                startAt: new Date(),
                endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                usageLimit: 1000,
                perUserLimit: 1,
                usedCount: 0,
                isActive: true,
                description: "10% off on first order",
                applicableTo: "ALL",
                metadata: {
                    createdBy: admin._id,
                    campaignName: "Welcome Campaign"
                }
            },
            {
                code: "FLAT50",
                type: "FIXED",
                value: 50,
                minOrderValue: 200,
                maxDiscount: 50,
                startAt: new Date(),
                endAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                usageLimit: 500,
                perUserLimit: 1,
                usedCount: 0,
                isActive: true,
                description: "Flat ₹50 off on orders above ₹200",
                applicableTo: "ALL",
                metadata: {
                    createdBy: admin._id,
                    campaignName: "Festival Offer"
                }
            }
        ]);
        console.log(`✅ ${coupons.length} coupons created`);

        // ============================================
        // SUMMARY
        // ============================================
        console.log("\n📊 SEEDING SUMMARY");
        console.log("==================");
        console.log(`✅ Admin Users: ${await User.countDocuments({ role: "ADMIN" })}`);
        console.log(`✅ Customers: ${await User.countDocuments({ role: "CUSTOMER" })}`);
        console.log(`✅ Retailers: ${await Retailer.countDocuments()}`);
        console.log(`✅ Categories: ${await Category.countDocuments()}`);
        console.log(`✅ Products: ${await Product.countDocuments()}`);
        console.log(`✅ Zones: ${await Zone.countDocuments()}`);
        console.log(`✅ Coupons: ${await Coupon.countDocuments()}`);

        console.log("\n🎉 Database seeding complete!");
        console.log("\n🔑 Admin Login:");
        console.log("   Mobile: +919888888888");
        console.log("   OTP: Check Render logs");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
