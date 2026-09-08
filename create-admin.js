const mongoose = require('mongoose');

// Use your actual connection string from .env
const uri = 'mongodb+srv://hemanth333nandee_db_user:Prajnan123@cluster0.qw0jyce.mongodb.net/quickclick?retryWrites=true&w=majority';

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        
        // Define User schema
        const userSchema = new mongoose.Schema({
            name: String,
            mobile: String,
            email: String,
            role: String,
            status: String,
            isVerified: Boolean,
            createdAt: Date,
            updatedAt: Date
        });
        
        const User = mongoose.model('User', userSchema);
        
        // Create admin user
        return User.create({
            name: "Admin User",
            mobile: "+919888888888",
            email: "admin@quickclick.com",
            role: "ADMIN",
            status: "ACTIVE",
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    })
    .then(() => {
        console.log('✅ Admin user created successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
