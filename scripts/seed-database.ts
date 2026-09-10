// scripts/seed-database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ── Schemas ────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true },
  email: String,
  role: String,
  status: String,
  isVerified: Boolean,
  avatarUrl: String,
  lastLoginAt: Date,
}, { timestamps: true });

const RetailerSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  shopName: String,
  phone: String,
  email: String,
  address: { line1: String, line2: String, city: String, state: String, postalCode: String, country: String },
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: [Number] },
  serviceRadiusKm: Number,
  status: String,
  isOpen: Boolean,
  rating: Number,
  totalOrders: Number,
  categories: [String],
}, { timestamps: true });

const DeliveryPartnerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  vehicleType: String,
  vehicleNumber: String,
  vehicleModel: String,
  licenseNumber: String,
  availability: String,
  latitude: Number,
  longitude: Number,
  status: String,
  isVerified: Boolean,
  rating: Number,
  totalDeliveries: Number,
  earningsToday: Number,
  earningsThisWeek: Number,
  earningsThisMonth: Number,
  maxConcurrentDeliveries: Number,
  currentDeliveries: Number,
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: String, slug: String, description: String, imageUrl: String,
  isActive: Boolean, isFeatured: Boolean, sortOrder: Number,
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  retailerId: mongoose.Schema.Types.ObjectId,
  categoryId: mongoose.Schema.Types.ObjectId,
  name: String, description: String,
  price: Number, discountPrice: Number,
  unit: String, stockQty: Number,
  imageUrl: [String], status: String, isFeatured: Boolean,
  tags: [String], preparationTime: Number,
}, { timestamps: true });

const AddressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  label: String,
  line1: String, line2: String, city: String, state: String, postalCode: String, country: String,
  latitude: Number, longitude: Number,
  instructions: String, isDefault: Boolean,
}, { timestamps: true });

const ZoneSchema = new mongoose.Schema({
  name: String, taluk: String, district: String, state: String,
  pincodes: [String],
  center: { latitude: Number, longitude: Number },
  boundaries: { type: { type: String, enum: ["Polygon"] }, coordinates: [[[Number]]] },
  radius: Number, isActive: Boolean,
  deliveryCharge: Number, minOrderAmount: Number,
  assignedAdmins: [mongoose.Schema.Types.ObjectId],
  stats: { totalOrders: Number, totalRevenue: Number, activeRetailers: Number, activeDeliveryPartners: Number },
});

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  type: String, value: Number, minOrderValue: Number, maxDiscount: Number,
  startAt: Date, endAt: Date, usageLimit: Number, perUserLimit: Number,
  usedCount: Number, isActive: Boolean, description: String, applicableTo: String,
  metadata: { createdBy: mongoose.Schema.Types.ObjectId, campaignName: String },
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  userId: mongoose.Schema.Types.ObjectId,
  retailerId: mongoose.Schema.Types.ObjectId,
  addressSnapshot: {
    line1: String, city: String, state: String, postalCode: String,
    latitude: Number, longitude: Number,
  },
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String, price: Number, quantity: Number, unit: String, total: Number,
  }],
  subtotal: Number, deliveryFee: Number, platformFee: Number, discount: Number, tax: Number, total: Number,
  paymentMethod: String, paymentStatus: String,
  status: String,
  statusHistory: [{ fromStatus: String, toStatus: String, actorRole: String, timestamp: Date }],
  isRated: Boolean,
}, { timestamps: true });

const DeliveryAssignmentSchema = new mongoose.Schema({
  orderId: mongoose.Schema.Types.ObjectId,
  deliveryPartnerId: mongoose.Schema.Types.ObjectId,
  status: String,
  offeredAt: Date,
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  rejectedReason: String,
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Retailer = mongoose.model("Retailer", RetailerSchema);
const DeliveryPartner = mongoose.model("DeliveryPartner", DeliveryPartnerSchema);
const Category = mongoose.model("Category", CategorySchema);
const Product = mongoose.model("Product", ProductSchema);
const Address = mongoose.model("Address", AddressSchema);
const Zone = mongoose.model("Zone", ZoneSchema);
const Coupon = mongoose.model("Coupon", CouponSchema);
const Order = mongoose.model("Order", OrderSchema);
const DeliveryAssignment = mongoose.model("DeliveryAssignment", DeliveryAssignmentSchema);

const orderNumber = (i: number) => `QC-2026-${String(i).padStart(4, "0")}`;

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/quickclick");
    console.log("✅ Connected to MongoDB");
    console.log(`📊 Database: ${mongoose.connection.name}`);

    console.log("\n🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}), Retailer.deleteMany({}), DeliveryPartner.deleteMany({}),
      Category.deleteMany({}), Product.deleteMany({}), Address.deleteMany({}),
      Zone.deleteMany({}), Coupon.deleteMany({}), Order.deleteMany({}),
      DeliveryAssignment.deleteMany({}),
    ]);
    console.log("✅ Data cleared");

    // ═══════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════
    console.log("\n👥 Users...");

    const admin = await User.create({
      name: "Super Admin",
      mobile: "+919888888888",
      email: "admin@quickclick.com",
      role: "ADMIN",
      status: "ACTIVE",
      isVerified: true,
      avatarUrl: "https://ui-avatars.com/api/?name=Admin&background=FF6B35&color=fff",
      lastLoginAt: new Date(),
    });

    const customers = await User.insertMany([
      { name: "John Doe",      mobile: "+919999999901", email: "john@example.com",    role: "CUSTOMER", status: "ACTIVE", isVerified: true },
      { name: "Priya Mehta",   mobile: "+919999999902", email: "priya@example.com",   role: "CUSTOMER", status: "ACTIVE", isVerified: true },
      { name: "Arjun Rao",     mobile: "+919999999903", email: "arjun@example.com",   role: "CUSTOMER", status: "ACTIVE", isVerified: true },
      { name: "Neha Singh",    mobile: "+919999999904", email: "neha@example.com",    role: "CUSTOMER", status: "ACTIVE", isVerified: true },
      { name: "Vikram Patel",  mobile: "+919999999905", email: "vikram@example.com",  role: "CUSTOMER", status: "ACTIVE", isVerified: true },
    ]);

    const retailerOwners = await User.insertMany([
      { name: "Rajesh Kumar",   mobile: "+918888888801", email: "rajesh@quickstore.com",  role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "Priya Sharma",   mobile: "+918888888802", email: "priya@freshmart.com",    role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "DailyNeeds Mgr", mobile: "+918888888803", email: "mgr@dailyneeds.com",    role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "BigBasket Owner",mobile: "+918888888804", email: "owner@bigbasket.com",   role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "Corner Shop",    mobile: "+918888888805", email: "corner@shop.com",       role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "Organic Hub",    mobile: "+918888888806", email: "hub@organic.com",       role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "Pending Shop 1", mobile: "+918888888807", email: "pending1@shop.com",     role: "RETAILER", status: "ACTIVE", isVerified: true },
      { name: "Pending Shop 2", mobile: "+918888888808", email: "pending2@shop.com",     role: "RETAILER", status: "ACTIVE", isVerified: true },
    ]);

    const dpUsers = await User.insertMany([
      { name: "Arun V",       mobile: "+917777777701", email: "arun@dp.com",     role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Suresh K",     mobile: "+917777777702", email: "suresh@dp.com",   role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Manish T",     mobile: "+917777777703", email: "manish@dp.com",   role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Ravi N",       mobile: "+917777777704", email: "ravi@dp.com",     role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Karthik S",    mobile: "+917777777705", email: "karthik@dp.com",  role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Deepak M",     mobile: "+917777777706", email: "deepak@dp.com",   role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Anil R",       mobile: "+917777777707", email: "anil@dp.com",     role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
      { name: "Pending DP",   mobile: "+917777777708", email: "pending@dp.com",  role: "DELIVERY_PARTNER", status: "ACTIVE", isVerified: true },
    ]);

    console.log(`✅ ${await User.countDocuments()} users`);

    // ═══════════════════════════════════════════════════════
    // CATEGORIES
    // ═══════════════════════════════════════════════════════
    console.log("\n📁 Categories...");
    const categories = await Category.insertMany([
      { name: "Fruits & Vegetables", slug: "fruits-vegetables", description: "Fresh produce",   imageUrl: "https://via.placeholder.com/200?text=Fruits",   isActive: true, isFeatured: true,  sortOrder: 1 },
      { name: "Groceries",           slug: "groceries",         description: "Daily staples",   imageUrl: "https://via.placeholder.com/200?text=Grocery",  isActive: true, isFeatured: true,  sortOrder: 2 },
      { name: "Dairy & Eggs",        slug: "dairy-eggs",        description: "Milk, cheese",    imageUrl: "https://via.placeholder.com/200?text=Dairy",    isActive: true, isFeatured: true,  sortOrder: 3 },
      { name: "Beverages",           slug: "beverages",         description: "Drinks",          imageUrl: "https://via.placeholder.com/200?text=Drinks",   isActive: true, isFeatured: true,  sortOrder: 4 },
      { name: "Snacks",              slug: "snacks",            description: "Chips & biscuits",imageUrl: "https://via.placeholder.com/200?text=Snacks",   isActive: true, isFeatured: false, sortOrder: 5 },
      { name: "Personal Care",       slug: "personal-care",     description: "Hygiene",         imageUrl: "https://via.placeholder.com/200?text=Care",     isActive: true, isFeatured: false, sortOrder: 6 },
      { name: "Frozen Foods",        slug: "frozen-foods",      description: "Ready to cook",   imageUrl: "https://via.placeholder.com/200?text=Frozen",   isActive: true, isFeatured: false, sortOrder: 7 },
      { name: "Bakery",              slug: "bakery",            description: "Breads & cakes",  imageUrl: "https://via.placeholder.com/200?text=Bakery",   isActive: true, isFeatured: false, sortOrder: 8 },
      { name: "Baby Care",           slug: "baby-care",         description: "Diapers & food",  imageUrl: "https://via.placeholder.com/200?text=Baby",     isActive: true, isFeatured: false, sortOrder: 9 },
      { name: "Household",           slug: "household",         description: "Cleaning supplies",imageUrl:"https://via.placeholder.com/200?text=House",    isActive: true, isFeatured: false, sortOrder: 10 },
      { name: "Pet Care",            slug: "pet-care",          description: "Pet food",        imageUrl: "https://via.placeholder.com/200?text=Pet",      isActive: true, isFeatured: false, sortOrder: 11 },
      { name: "Organic",             slug: "organic",           description: "Certified organic",imageUrl:"https://via.placeholder.com/200?text=Organic",  isActive: true, isFeatured: false, sortOrder: 12 },
    ]);
    console.log(`✅ ${categories.length} categories`);

    // ═══════════════════════════════════════════════════════
    // RETAILERS
    // ═══════════════════════════════════════════════════════
    console.log("\n🏪 Retailers...");
    const retailers = await Retailer.insertMany([
      { ownerId: retailerOwners[0]._id, shopName: "QuickStore Supermarket", phone: "+918888888801", email: "store1@quickstore.com",
        address: { line1: "123 Main Street", city: "New Delhi", state: "Delhi", postalCode: "110001", country: "India" },
        location: { type: "Point", coordinates: [77.2090, 28.6139] }, serviceRadiusKm: 10,
        status: "APPROVED", isOpen: true,  rating: 4.5, totalOrders: 150, categories: ["Groceries","Essentials","Fresh Food"] },
      { ownerId: retailerOwners[1]._id, shopName: "FreshMart Grocery", phone: "+918888888802", email: "store2@freshmart.com",
        address: { line1: "456 Park Avenue", city: "New Delhi", state: "Delhi", postalCode: "110002", country: "India" },
        location: { type: "Point", coordinates: [77.2190, 28.6239] }, serviceRadiusKm: 8,
        status: "APPROVED", isOpen: true,  rating: 4.2, totalOrders: 80,  categories: ["Groceries","Organic"] },
      { ownerId: retailerOwners[2]._id, shopName: "Daily Needs Store", phone: "+918888888803", email: "store3@dailyneeds.com",
        address: { line1: "789 Market Road", city: "New Delhi", state: "Delhi", postalCode: "110003", country: "India" },
        location: { type: "Point", coordinates: [77.2290, 28.6339] }, serviceRadiusKm: 5,
        status: "APPROVED", isOpen: true,  rating: 4.0, totalOrders: 45,  categories: ["Essentials"] },
      { ownerId: retailerOwners[3]._id, shopName: "BigBasket Express", phone: "+918888888804", email: "store4@bigbasket.com",
        address: { line1: "100 MG Road", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India" },
        location: { type: "Point", coordinates: [77.5946, 12.9716] }, serviceRadiusKm: 12,
        status: "APPROVED", isOpen: true,  rating: 4.6, totalOrders: 220, categories: ["Groceries","Fresh","Beverages"] },
      { ownerId: retailerOwners[4]._id, shopName: "Corner Shop", phone: "+918888888805", email: "store5@corner.com",
        address: { line1: "5 Linking Road", city: "Mumbai", state: "Maharashtra", postalCode: "400001", country: "India" },
        location: { type: "Point", coordinates: [72.8777, 19.0760] }, serviceRadiusKm: 3,
        status: "APPROVED", isOpen: false, rating: 3.8, totalOrders: 30,  categories: ["Snacks","Beverages"] },
      { ownerId: retailerOwners[5]._id, shopName: "Organic Hub", phone: "+918888888806", email: "store6@organic.com",
        address: { line1: "12 Marine Drive", city: "Mumbai", state: "Maharashtra", postalCode: "400002", country: "India" },
        location: { type: "Point", coordinates: [72.8230, 18.9430] }, serviceRadiusKm: 8,
        status: "APPROVED", isOpen: true,  rating: 4.7, totalOrders: 60,  categories: ["Organic","Fresh"] },
      { ownerId: retailerOwners[6]._id, shopName: "Pending Shop 1", phone: "+918888888807", email: "store7@pending.com",
        address: { line1: "77 Test Lane", city: "New Delhi", state: "Delhi", postalCode: "110010", country: "India" },
        location: { type: "Point", coordinates: [77.1000, 28.7000] }, serviceRadiusKm: 5,
        status: "PENDING", isOpen: false, rating: 0, totalOrders: 0, categories: ["Groceries"] },
      { ownerId: retailerOwners[7]._id, shopName: "Pending Shop 2", phone: "+918888888808", email: "store8@pending.com",
        address: { line1: "88 Test Road", city: "Bengaluru", state: "Karnataka", postalCode: "560010", country: "India" },
        location: { type: "Point", coordinates: [77.6000, 12.9500] }, serviceRadiusKm: 5,
        status: "PENDING", isOpen: false, rating: 0, totalOrders: 0, categories: ["Essentials"] },
    ]);
    console.log(`✅ ${retailers.length} retailers`);

    // ═══════════════════════════════════════════════════════
    // DELIVERY PARTNERS
    // ═══════════════════════════════════════════════════════
    console.log("\n🚚 Delivery partners...");
    const dpSeed = [
      { i: 0, avail: "ONLINE",  lat: 28.6150, lng: 77.2100, status: "APPROVED", veh: "BIKE" },
      { i: 1, avail: "ONLINE",  lat: 28.6250, lng: 77.2200, status: "APPROVED", veh: "SCOOTER" },
      { i: 2, avail: "ONLINE",  lat: 12.9716, lng: 77.5946, status: "APPROVED", veh: "BIKE" },
      { i: 3, avail: "ONLINE",  lat: 12.9800, lng: 77.6000, status: "APPROVED", veh: "SCOOTER" },
      { i: 4, avail: "OFFLINE", lat: 19.0760, lng: 72.8777, status: "APPROVED", veh: "BIKE" },
      { i: 5, avail: "ONLINE",  lat: 19.0800, lng: 72.8800, status: "APPROVED", veh: "SCOOTER" },
      { i: 6, avail: "BUSY",    lat: 28.6100, lng: 77.2000, status: "APPROVED", veh: "BIKE" },
      { i: 7, avail: "OFFLINE", lat: 28.6000, lng: 77.2000, status: "PENDING",  veh: "SCOOTER" },
    ];
    const partners = await DeliveryPartner.insertMany(
      dpSeed.map((d, idx) => ({
        userId: dpUsers[d.i]._id,
        vehicleType: d.veh,
        vehicleNumber: `DL-01-XX-${1000 + idx}`,
        vehicleModel: d.veh === "BIKE" ? "Honda Activa" : "TVS Jupiter",
        licenseNumber: `DL-${9000000 + idx}`,
        availability: d.avail,
        latitude: d.lat,
        longitude: d.lng,
        status: d.status,
        isVerified: d.status === "APPROVED",
        rating: 4.0 + (idx % 5) * 0.1,
        totalDeliveries: 20 + idx * 15,
        earningsToday: 0, earningsThisWeek: 0, earningsThisMonth: 0,
        maxConcurrentDeliveries: 3,
        currentDeliveries: 0,
      }))
    );
    console.log(`✅ ${partners.length} delivery partners`);

    // ═══════════════════════════════════════════════════════
    // PRODUCTS (60 across 8 retailers)
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 Products...");
    const productTemplates = [
      { cat: 0, name: "Organic Apples",         price: 120, disc: 100, unit: "kg",     stock: 100, tags: ["organic","fresh"],  featured: true  },
      { cat: 0, name: "Fresh Bananas",          price: 50,  disc: 45,  unit: "dozen",  stock: 80,  tags: ["fresh"],            featured: true  },
      { cat: 0, name: "Ripe Tomatoes",          price: 40,  disc: 35,  unit: "kg",     stock: 60,  tags: ["fresh"],            featured: false },
      { cat: 0, name: "Green Spinach",          price: 30,  disc: 25,  unit: "bunch",  stock: 40,  tags: ["leafy"],            featured: false },
      { cat: 0, name: "Onions 1kg",             price: 45,  disc: 40,  unit: "kg",     stock: 200, tags: ["staple"],           featured: false },
      { cat: 1, name: "Premium Basmati Rice",   price: 85,  disc: 75,  unit: "kg",     stock: 200, tags: ["staple"],           featured: true  },
      { cat: 1, name: "Whole Wheat Atta 5kg",   price: 300, disc: 280, unit: "bag",    stock: 60,  tags: ["staple"],           featured: true  },
      { cat: 1, name: "Toor Dal 1kg",           price: 160, disc: 150, unit: "kg",     stock: 100, tags: ["dal"],              featured: false },
      { cat: 1, name: "Sunflower Oil 1L",       price: 140, disc: 130, unit: "L",      stock: 90,  tags: ["oil"],              featured: false },
      { cat: 1, name: "Sugar 1kg",              price: 45,  disc: 42,  unit: "kg",     stock: 150, tags: ["sugar"],            featured: false },
      { cat: 1, name: "Salt 1kg",               price: 20,  disc: 18,  unit: "kg",     stock: 200, tags: ["salt"],             featured: false },
      { cat: 2, name: "Organic Milk 1L",        price: 60,  disc: 55,  unit: "L",      stock: 50,  tags: ["dairy"],            featured: true  },
      { cat: 2, name: "Farm Fresh Eggs",        price: 90,  disc: 85,  unit: "dozen",  stock: 60,  tags: ["eggs"],             featured: false },
      { cat: 2, name: "Paneer 200g",            price: 80,  disc: 75,  unit: "pack",   stock: 30,  tags: ["dairy"],            featured: false },
      { cat: 2, name: "Yogurt 400g",            price: 45,  disc: 40,  unit: "cup",    stock: 45,  tags: ["dairy"],            featured: false },
      { cat: 2, name: "Cheddar Cheese 200g",    price: 220, disc: 200, unit: "pack",   stock: 25,  tags: ["dairy"],            featured: false },
      { cat: 3, name: "Orange Juice 1L",        price: 90,  disc: 80,  unit: "L",      stock: 40,  tags: ["beverage"],         featured: false },
      { cat: 3, name: "Coca-Cola 2L",           price: 90,  disc: 85,  unit: "bottle", stock: 60,  tags: ["cold drink"],       featured: false },
      { cat: 3, name: "Green Tea 25 bags",      price: 250, disc: 220, unit: "box",    stock: 30,  tags: ["tea"],              featured: false },
      { cat: 3, name: "Filter Coffee 500g",     price: 300, disc: 270, unit: "pack",   stock: 40,  tags: ["coffee"],           featured: false },
      { cat: 4, name: "Potato Chips 200g",      price: 50,  disc: 45,  unit: "pack",   stock: 120, tags: ["snack"],            featured: false },
      { cat: 4, name: "Marie Biscuits",         price: 30,  disc: 28,  unit: "pack",   stock: 150, tags: ["biscuit"],          featured: false },
      { cat: 4, name: "Salted Peanuts 500g",    price: 90,  disc: 80,  unit: "pack",   stock: 80,  tags: ["nuts"],             featured: false },
      { cat: 4, name: "Chocolate Bar 100g",     price: 60,  disc: 55,  unit: "bar",    stock: 90,  tags: ["chocolate"],        featured: false },
      { cat: 5, name: "Colgate Toothpaste",     price: 90,  disc: 85,  unit: "tube",   stock: 70,  tags: ["dental"],           featured: false },
      { cat: 5, name: "Dove Shampoo 400ml",     price: 280, disc: 250, unit: "bottle", stock: 40,  tags: ["hair"],             featured: false },
      { cat: 5, name: "Dettol Handwash 500ml",  price: 150, disc: 140, unit: "bottle", stock: 60,  tags: ["hygiene"],          featured: false },
      { cat: 6, name: "Frozen Peas 500g",       price: 90,  disc: 80,  unit: "pack",   stock: 40,  tags: ["frozen"],           featured: false },
      { cat: 6, name: "Frozen French Fries",    price: 130, disc: 120, unit: "pack",   stock: 35,  tags: ["frozen"],           featured: false },
      { cat: 7, name: "Whole Wheat Bread",      price: 40,  disc: 35,  unit: "loaf",   stock: 30,  tags: ["bread"],            featured: false },
      { cat: 7, name: "Croissants 4pc",         price: 100, disc: 90,  unit: "pack",   stock: 20,  tags: ["bakery"],           featured: false },
      { cat: 8, name: "Pampers M 30pc",         price: 550, disc: 500, unit: "pack",   stock: 25,  tags: ["baby"],             featured: false },
      { cat: 9, name: "Vim Dishwash Bar",       price: 25,  disc: 22,  unit: "bar",    stock: 100, tags: ["household"],        featured: false },
      { cat: 9, name: "Harpic Cleaner 500ml",   price: 95,  disc: 85,  unit: "bottle", stock: 50,  tags: ["household"],        featured: false },
      { cat: 10, name: "Pedigree Dog Food 1kg", price: 320, disc: 290, unit: "pack",   stock: 30,  tags: ["pet"],              featured: false },
      { cat: 11, name: "Organic Quinoa 500g",   price: 350, disc: 320, unit: "pack",   stock: 25,  tags: ["organic"],          featured: false },
    ];

    const allProducts: any[] = [];
    // Assign products to retailers 0..5 (approved ones)
    // Each retailer gets a rotating subset
    for (let r = 0; r < 6; r++) {
      const count = 6 + r * 2; // 6, 8, 10, 12, 14, 16
      for (let p = 0; p < count; p++) {
        const t = productTemplates[(r * 5 + p) % productTemplates.length];
        allProducts.push({
          retailerId: retailers[r]._id,
          categoryId: categories[t.cat]._id,
          name: t.name,
          description: `${t.name} — ${t.tags.join(", ")}`,
          price: t.price,
          discountPrice: t.disc,
          unit: t.unit,
          stockQty: t.stock,
          imageUrl: [`https://via.placeholder.com/300x300/CCCCCC/000000?text=${encodeURIComponent(t.name.split(" ")[0])}`],
          status: "ACTIVE",
          isFeatured: t.featured && p < 3,
          tags: t.tags,
          preparationTime: 2 + (p % 5),
        });
      }
    }
    const products = await Product.insertMany(allProducts);
    console.log(`✅ ${products.length} products`);

    // ═══════════════════════════════════════════════════════
    // ADDRESSES (2 per customer)
    // ═══════════════════════════════════════════════════════
    console.log("\n📍 Addresses...");
    const addressData: any[] = [];
    const cityData = [
      { city: "New Delhi", state: "Delhi",       lat: 28.6139, lng: 77.2090, pin: "110001" },
      { city: "New Delhi", state: "Delhi",       lat: 28.6350, lng: 77.2250, pin: "110002" },
      { city: "Bengaluru", state: "Karnataka",   lat: 12.9716, lng: 77.5946, pin: "560001" },
      { city: "Bengaluru", state: "Karnataka",   lat: 12.9800, lng: 77.6100, pin: "560002" },
      { city: "Mumbai",    state: "Maharashtra", lat: 19.0760, lng: 72.8777, pin: "400001" },
    ];

    for (let i = 0; i < customers.length; i++) {
      const c = cityData[i % cityData.length];
      addressData.push({
        userId: customers[i]._id,
        label: "Home",
        line1: `Flat ${i + 1}A, Green Residency`,
        city: c.city, state: c.state, postalCode: c.pin, country: "India",
        latitude: c.lat, longitude: c.lng,
        instructions: "Ring the bell twice",
        isDefault: true,
      });
      addressData.push({
        userId: customers[i]._id,
        label: "Office",
        line1: `Floor ${i + 2}, Tech Park`,
        city: c.city, state: c.state, postalCode: c.pin, country: "India",
        latitude: c.lat + 0.005, longitude: c.lng + 0.005,
        instructions: "Leave at reception",
        isDefault: false,
      });
    }
    const addresses = await Address.insertMany(addressData);
    console.log(`✅ ${addresses.length} addresses`);

    // ═══════════════════════════════════════════════════════
    // ZONES
    // ═══════════════════════════════════════════════════════
    console.log("\n🌍 Zones...");
    const zones = await Zone.insertMany([
      { name: "Delhi Central", taluk: "New Delhi", district: "New Delhi", state: "Delhi",
        pincodes: ["110001","110002","110003","110004","110005"],
        center: { latitude: 28.6139, longitude: 77.2090 },
        boundaries: { type: "Polygon", coordinates: [[[77.15,28.55],[77.30,28.55],[77.30,28.70],[77.15,28.70],[77.15,28.55]]] },
        radius: 15, isActive: true, deliveryCharge: 30, minOrderAmount: 100,
        assignedAdmins: [admin._id], stats: { totalOrders: 0, totalRevenue: 0, activeRetailers: 3, activeDeliveryPartners: 3 } },
      { name: "Bengaluru South", taluk: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka",
        pincodes: ["560001","560002","560003"],
        center: { latitude: 12.9716, longitude: 77.5946 },
        boundaries: { type: "Polygon", coordinates: [[[77.55,12.90],[77.65,12.90],[77.65,13.00],[77.55,13.00],[77.55,12.90]]] },
        radius: 15, isActive: true, deliveryCharge: 35, minOrderAmount: 150,
        assignedAdmins: [admin._id], stats: { totalOrders: 0, totalRevenue: 0, activeRetailers: 1, activeDeliveryPartners: 2 } },
      { name: "Mumbai West", taluk: "Mumbai", district: "Mumbai", state: "Maharashtra",
        pincodes: ["400001","400002","400003"],
        center: { latitude: 19.0760, longitude: 72.8777 },
        boundaries: { type: "Polygon", coordinates: [[[72.80,18.90],[72.90,18.90],[72.90,19.15],[72.80,19.15],[72.80,18.90]]] },
        radius: 20, isActive: true, deliveryCharge: 40, minOrderAmount: 200,
        assignedAdmins: [admin._id], stats: { totalOrders: 0, totalRevenue: 0, activeRetailers: 2, activeDeliveryPartners: 2 } },
      { name: "Kochi", taluk: "Kochi", district: "Ernakulam", state: "Kerala",
        pincodes: ["682001","682002"],
        center: { latitude: 9.9312, longitude: 76.2673 },
        boundaries: { type: "Polygon", coordinates: [[[76.20,9.90],[76.30,9.90],[76.30,10.00],[76.20,10.00],[76.20,9.90]]] },
        radius: 10, isActive: true, deliveryCharge: 25, minOrderAmount: 100,
        assignedAdmins: [admin._id], stats: { totalOrders: 0, totalRevenue: 0, activeRetailers: 0, activeDeliveryPartners: 0 } },
    ]);
    console.log(`✅ ${zones.length} zones`);

    // ═══════════════════════════════════════════════════════
    // COUPONS
    // ═══════════════════════════════════════════════════════
    console.log("\n🎫 Coupons...");
    const coupons = await Coupon.insertMany([
      { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrderValue: 100, maxDiscount: 50,
        startAt: new Date(), endAt: new Date(Date.now() + 30*86400*1000),
        usageLimit: 1000, perUserLimit: 1, usedCount: 0, isActive: true,
        description: "10% off on first order", applicableTo: "ALL",
        metadata: { createdBy: admin._id, campaignName: "Welcome" } },
      { code: "FLAT50", type: "FIXED", value: 50, minOrderValue: 200, maxDiscount: 50,
        startAt: new Date(), endAt: new Date(Date.now() + 15*86400*1000),
        usageLimit: 500, perUserLimit: 1, usedCount: 0, isActive: true,
        description: "Flat 50 off above 200", applicableTo: "ALL",
        metadata: { createdBy: admin._id, campaignName: "Festival" } },
      { code: "SAVE20", type: "PERCENTAGE", value: 20, minOrderValue: 300, maxDiscount: 100,
        startAt: new Date(), endAt: new Date(Date.now() + 30*86400*1000),
        usageLimit: 200, perUserLimit: 2, usedCount: 0, isActive: true,
        description: "20% off above 300", applicableTo: "ALL",
        metadata: { createdBy: admin._id, campaignName: "BigSave" } },
      { code: "NEWUSER", type: "FIXED", value: 100, minOrderValue: 250, maxDiscount: 100,
        startAt: new Date(), endAt: new Date(Date.now() + 90*86400*1000),
        usageLimit: 5000, perUserLimit: 1, usedCount: 0, isActive: true,
        description: "100 off for new users", applicableTo: "NEW_USER",
        metadata: { createdBy: admin._id, campaignName: "Acquisition" } },
      { code: "FREESHIP", type: "FIXED", value: 30, minOrderValue: 150, maxDiscount: 30,
        startAt: new Date(), endAt: new Date(Date.now() + 60*86400*1000),
        usageLimit: 1000, perUserLimit: 5, usedCount: 0, isActive: true,
        description: "Free delivery above 150", applicableTo: "ALL",
        metadata: { createdBy: admin._id, campaignName: "Logistics" } },
      { code: "FRESH15", type: "PERCENTAGE", value: 15, minOrderValue: 200, maxDiscount: 80,
        startAt: new Date(), endAt: new Date(Date.now() + 30*86400*1000),
        usageLimit: 500, perUserLimit: 3, usedCount: 0, isActive: true,
        description: "15% off on fresh items", applicableTo: "FRUITS_VEGETABLES",
        metadata: { createdBy: admin._id, campaignName: "FreshPush" } },
      { code: "DAIRY10", type: "PERCENTAGE", value: 10, minOrderValue: 100, maxDiscount: 40,
        startAt: new Date(), endAt: new Date(Date.now() + 30*86400*1000),
        usageLimit: 500, perUserLimit: 3, usedCount: 0, isActive: true,
        description: "10% off on dairy", applicableTo: "DAIRY_EGGS",
        metadata: { createdBy: admin._id, campaignName: "DairyPush" } },
      { code: "EXPIRED", type: "FIXED", value: 25, minOrderValue: 100, maxDiscount: 25,
        startAt: new Date(Date.now() - 30*86400*1000), endAt: new Date(Date.now() - 86400*1000),
        usageLimit: 100, perUserLimit: 1, usedCount: 0, isActive: false,
        description: "Expired — for testing", applicableTo: "ALL",
        metadata: { createdBy: admin._id, campaignName: "Test" } },
    ]);
    console.log(`✅ ${coupons.length} coupons`);

    // ═══════════════════════════════════════════════════════
    // ORDERS — one in each state for testing
    // ═══════════════════════════════════════════════════════
    console.log("\n📋 Orders...");

    const buildOrder = (i: number, userId: any, retailer: any, status: string, itemCount: number, address: any) => {
      const items = [];
      let subtotal = 0;
      for (let k = 0; k < itemCount; k++) {
        const p = products[(i * 3 + k) % products.length];
        const qty = 1 + (k % 3);
        const lineTotal = p.discountPrice * qty;
        subtotal += lineTotal;
        items.push({
          productId: p._id,
          name: p.name,
          price: p.discountPrice,
          quantity: qty,
          unit: p.unit,
          total: lineTotal,
        });
      }
      const deliveryFee = 30;
      const platformFee = 10;
      return {
        orderNumber: orderNumber(i + 1),
        userId,
        retailerId: retailer._id,
        addressSnapshot: {
          line1: address.line1, city: address.city, state: address.state,
          postalCode: address.postalCode,
          latitude: address.latitude, longitude: address.longitude,
        },
        items,
        subtotal,
        deliveryFee,
        platformFee,
        discount: 0,
        tax: 0,
        total: subtotal + deliveryFee + platformFee,
        paymentMethod: "COD",
        paymentStatus: status === "DELIVERED" ? "COMPLETED" : "PENDING",
        status,
        statusHistory: [
          { fromStatus: "PLACED", toStatus: status, actorRole: "SYSTEM", timestamp: new Date() },
        ],
        isRated: status === "DELIVERED",
      };
    };

    const approvedRetailers = retailers.filter(r => r.status === "APPROVED");
    const getAddr = (i: number) => addresses[i % addresses.length];

    const ordersToCreate = [
      { user: customers[0], retailer: approvedRetailers[0], status: "PLACED",           items: 2 },
      { user: customers[1], retailer: approvedRetailers[0], status: "PLACED",           items: 1 },
      { user: customers[2], retailer: approvedRetailers[1], status: "ACCEPTED",         items: 3 },
      { user: customers[3], retailer: approvedRetailers[1], status: "PREPARING",        items: 2 },
      { user: customers[4], retailer: approvedRetailers[2], status: "READY_FOR_PICKUP", items: 1 },
      { user: customers[0], retailer: approvedRetailers[0], status: "ASSIGNED",         items: 4 },
      { user: customers[1], retailer: approvedRetailers[3], status: "PICKED_UP",        items: 2 },
      { user: customers[2], retailer: approvedRetailers[3], status: "OUT_FOR_DELIVERY", items: 3 },
      { user: customers[3], retailer: approvedRetailers[0], status: "DELIVERED",        items: 2 },
      { user: customers[4], retailer: approvedRetailers[1], status: "DELIVERED",        items: 5 },
      { user: customers[0], retailer: approvedRetailers[2], status: "REJECTED",         items: 1 },
      { user: customers[1], retailer: approvedRetailers[0], status: "CANCELLED",        items: 2 },
    ];

    const orders = await Order.insertMany(
      ordersToCreate.map((o, i) => buildOrder(i, o.user._id, o.retailer, o.status, o.items, getAddr(i)))
    );
    console.log(`✅ ${orders.length} orders`);

    // ═══════════════════════════════════════════════════════
    // DELIVERY ASSIGNMENTS — for in-flight orders
    // ═══════════════════════════════════════════════════════
    console.log("\n🚚 Delivery assignments...");
    const onlinePartners = partners.filter(p => p.availability === "ONLINE" && p.status === "APPROVED");

    const assignmentMap: { orderIdx: number; partnerIdx: number; status: string }[] = [
      { orderIdx: 5,  partnerIdx: 0, status: "ACCEPTED" },        // ASSIGNED
      { orderIdx: 6,  partnerIdx: 1, status: "PICKED_UP" },       // PICKED_UP
      { orderIdx: 7,  partnerIdx: 2, status: "OUT_FOR_DELIVERY" },// OUT_FOR_DELIVERY
      { orderIdx: 8,  partnerIdx: 0, status: "DELIVERED" },       // DELIVERED
      { orderIdx: 9,  partnerIdx: 1, status: "DELIVERED" },       // DELIVERED
    ];

    const assignments = await DeliveryAssignment.insertMany(
      assignmentMap.map(a => ({
        orderId: orders[a.orderIdx]._id,
        deliveryPartnerId: onlinePartners[a.partnerIdx]._id,
        status: a.status,
        offeredAt: new Date(Date.now() - 3600_000),
        acceptedAt: a.status !== "OFFERED" ? new Date(Date.now() - 3500_000) : undefined,
        pickedUpAt: ["PICKED_UP","OUT_FOR_DELIVERY","DELIVERED"].includes(a.status) ? new Date(Date.now() - 1800_000) : undefined,
        deliveredAt: a.status === "DELIVERED" ? new Date(Date.now() - 300_000) : undefined,
      }))
    );
    console.log(`✅ ${assignments.length} delivery assignments`);

    // ═══════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════
    console.log("\n📊 SEEDING SUMMARY");
    console.log("═══════════════════════════════════════════════");
    console.log(`👑 Admins              ${await User.countDocuments({ role: "ADMIN" })}`);
    console.log(`👤 Customers           ${await User.countDocuments({ role: "CUSTOMER" })}`);
    console.log(`🏪 Retailer users      ${await User.countDocuments({ role: "RETAILER" })}`);
    console.log(`🚚 Delivery users      ${await User.countDocuments({ role: "DELIVERY_PARTNER" })}`);
    console.log(`───────────────────────────────────────────────`);
    console.log(`🏪 Retailers           ${await Retailer.countDocuments()}`);
    console.log(`   ├─ APPROVED         ${await Retailer.countDocuments({ status: "APPROVED" })}`);
    console.log(`   └─ PENDING          ${await Retailer.countDocuments({ status: "PENDING" })}`);
    console.log(`🚚 Delivery partners   ${await DeliveryPartner.countDocuments()}`);
    console.log(`   ├─ ONLINE           ${await DeliveryPartner.countDocuments({ availability: "ONLINE" })}`);
    console.log(`   ├─ OFFLINE          ${await DeliveryPartner.countDocuments({ availability: "OFFLINE" })}`);
    console.log(`   └─ BUSY             ${await DeliveryPartner.countDocuments({ availability: "BUSY" })}`);
    console.log(`📁 Categories          ${await Category.countDocuments()}`);
    console.log(`📦 Products            ${await Product.countDocuments()}`);
    console.log(`📍 Addresses           ${await Address.countDocuments()}`);
    console.log(`🌍 Zones               ${await Zone.countDocuments()}`);
    console.log(`🎫 Coupons             ${await Coupon.countDocuments()}`);
    console.log(`📋 Orders              ${await Order.countDocuments()}`);
    for (const s of ["PLACED","ACCEPTED","PREPARING","READY_FOR_PICKUP","ASSIGNED","PICKED_UP","OUT_FOR_DELIVERY","DELIVERED","REJECTED","CANCELLED"]) {
      const n = await Order.countDocuments({ status: s });
      if (n) console.log(`   └─ ${s.padEnd(16)} ${n}`);
    }
    console.log(`🚚 Assignments         ${await DeliveryAssignment.countDocuments()}`);

    console.log("\n🔑 TEST ACCOUNTS — log in via POST /api/v1/auth/send-otp");
    console.log("   ┌───────────────────────────────────────────────────────");
    console.log("   │ ADMIN          +919888888888");
    console.log("   │");
    console.log("   │ CUSTOMERS");
    console.log("   │   C1 John      +919999999901   (2 addresses)");
    console.log("   │   C2 Priya     +919999999902   (2 addresses)");
    console.log("   │   C3 Arjun     +919999999903   (2 addresses)");
    console.log("   │   C4 Neha      +919999999904   (2 addresses)");
    console.log("   │   C5 Vikram    +919999999905   (2 addresses)");
    console.log("   │");
    console.log("   │ RETAILERS (APPROVED)");
    console.log("   │   R1 QuickStore   +918888888801");
    console.log("   │   R2 FreshMart    +918888888802");
    console.log("   │   R3 DailyNeeds   +918888888803");
    console.log("   │   R4 BigBasket    +918888888804  (Bengaluru)");
    console.log("   │   R5 CornerShop   +918888888805  (Mumbai, closed)");
    console.log("   │   R6 OrganicHub   +918888888806  (Mumbai)");
    console.log("   │");
    console.log("   │ RETAILERS (PENDING)");
    console.log("   │   R7 PendingShop1 +918888888807");
    console.log("   │   R8 PendingShop2 +918888888808");
    console.log("   │");
    console.log("   │ DELIVERY PARTNERS");
    console.log("   │   D1 Arun     +917777777701  ONLINE   Delhi");
    console.log("   │   D2 Suresh   +917777777702  ONLINE   Delhi");
    console.log("   │   D3 Manish   +917777777703  ONLINE   Bengaluru");
    console.log("   │   D4 Ravi     +917777777704  ONLINE   Bengaluru");
    console.log("   │   D5 Karthik  +917777777705  OFFLINE  Mumbai");
    console.log("   │   D6 Deepak   +917777777706  ONLINE   Mumbai");
    console.log("   │   D7 Anil     +917777777707  BUSY     Delhi");
    console.log("   │   D8 Pending  +917777777708  OFFLINE  PENDING");
    console.log("   └───────────────────────────────────────────────────────");

    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
