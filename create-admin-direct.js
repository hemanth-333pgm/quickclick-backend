const mongoose = require('mongoose');

// Use direct connection (not SRV)
const uri = 'mongodb://hemanth333nandee_db_user:Prajnan123@cluster0-shard-00-00.qw0jyce.mongodb.net:27017,cluster0-shard-00-01.qw0jyce.mongodb.net:27017,cluster0-shard-00-02.qw0jyce.mongodb.net:27017/quickclick?replicaSet=atlas-ix4shg-shard-0&ssl=true&authSource=admin';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
})
.then(() => {
    console.log('✅ Connected to MongoDB');
    
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
