const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/quickclick';

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...');
    console.log(`📡 URI: ${uri}`);
    
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        console.log('✅ Connected successfully!');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`📍 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        
        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📚 Collections: ${collections.map(c => c.name).join(', ') || 'none'}`);
        
        await mongoose.disconnect();
        console.log('✅ Test complete!');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Check if MongoDB is running: netstat -ano | findstr :27017');
        console.log('2. The URI in .env should be: mongodb://localhost:27017/quickclick');
        console.log('3. Try connecting with mongosh: C:\\Users\\admin\\AppData\\Roaming\\npm\\mongosh.cmd');
    }
}

testConnection();
