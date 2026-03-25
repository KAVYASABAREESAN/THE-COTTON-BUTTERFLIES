require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Debugging MongoDB Connection...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found (hidden for security)' : 'NOT FOUND');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  console.log('📁 Current directory:', __dirname);
  console.log('🔧 Try loading dotenv with path:');
  require('dotenv').config({ path: __dirname + '/.env' });
  console.log('MONGODB_URI after explicit load:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
  process.exit(1);
}

async function testConnection() {
  try {
    console.log('🔗 Attempting to connect to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test if we can list collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    await mongoose.disconnect();
    console.log('🔗 Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 Tips:');
      console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('2. Verify your username and password');
      console.log('3. Make sure the cluster is running');
      console.log('4. Check network connectivity');
    }
    
    process.exit(1);
  }
}

testConnection();