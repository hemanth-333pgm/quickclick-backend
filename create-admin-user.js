const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use your connection string
const uri = 'mongodb+srv://hemanth333nandee_db_user:Prajnan123@cluster0.qw0jyce.mongodb.net/quickclick?retryWrites=true&w=majority';

async function createAdmin() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        
        // Define User schema
        const userSchema = new mongoose.Schema({
            name: String,
            mobile: String,
            email: String,
            password: String,
            role: String,
            status: String,
            isVerified: Boolean,
            createdAt: Date,
            updatedAt: Date
        });
        
        const User = mongoose.model('User', userSchema);
        
        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@quickclick.com' });
        if (existingAdmin) {
            console.log('✅ Admin already exists!');
            console.log('   Email:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);
            console.log('   Status:', existingAdmin.status);
            process.exit(0);
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        
        // Create admin
        const admin = await User.create({
            name: 'Super Admin',
            mobile: '+919888888888',
            email: 'admin@quickclick.com',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('✅ Admin user created successfully!');
        console.log('   ID:', admin._id);
        console.log('   Name:', admin.name);
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Password: Admin@123');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createAdmin();
