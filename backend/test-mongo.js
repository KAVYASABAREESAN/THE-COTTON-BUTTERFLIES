// backend/test-mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB!');
    
    // List databases
    const adminDb = mongoose.connection.db.admin();
    const databases = await adminDb.listDatabases();
    console.log('Available databases:');
    databases.databases.forEach(db => console.log(`  - ${db.name}`));
    
    // List collections in current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in current database:');
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    // Try to create a test user
    const User = require('./src/models/User');
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123'
    });
    
    console.log('✅ Test user created:', testUser._id);
    
    // Find all users
    const users = await User.find({});
    console.log(`📊 Total users in database: ${users.length}`);
    
    mongoose.connection.close();
    console.log('Test completed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();