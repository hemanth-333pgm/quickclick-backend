const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://hemanth333nandee_db_user:Prajnan123@cluster0.qw0jyce.mongodb.net/quickclick?retryWrites=true&w=majority';

async function setAdminPassword() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        console.log(`📊 Database: ${mongoose.connection.name}`);

        // Define User schema with all fields
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

        // Check current admin
        console.log('\n📋 Checking for admin user...');
        const admin = await User.findOne({ email: 'admin@quickclick.com' });
        
        if (admin) {
            console.log('✅ Admin user found:');
            console.log('   ID:', admin._id);
            console.log('   Name:', admin.name);
            console.log('   Email:', admin.email);
            console.log('   Role:', admin.role);
            console.log('   Has Password:', !!admin.password);
            console.log('   Password Value:', admin.password || 'NOT SET');
        } else {
            console.log('⚠️ Admin user not found. Creating one...');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        console.log('✅ Password hashed: Admin@123');

        // Update or create admin with password
        const result = await User.findOneAndUpdate(
            { email: 'admin@quickclick.com' },
            {
                $set: {
                    name: 'Super Admin',
                    mobile: '+919888888888',
                    email: 'admin@quickclick.com',
                    password: hashedPassword,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    isVerified: true,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { 
                new: true, 
                upsert: true,
                runValidators: true 
            }
        );

        console.log('\n✅ Admin user updated/created with password!');
        console.log('   ID:', result._id);
        console.log('   Name:', result.name);
        console.log('   Email:', result.email);
        console.log('   Role:', result.role);
        console.log('   Has Password:', !!result.password);
        console.log('   Password Hash Length:', result.password ? result.password.length : 0);

        // Verify login with the password
        console.log('\n🔐 Testing password verification...');
        const isValid = await bcrypt.compare('Admin@123', result.password);
        console.log('   Password verification:', isValid ? '✅ PASSED' : '❌ FAILED');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

setAdminPassword();
