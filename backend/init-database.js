const mongoose = require('mongoose');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Setting up MongoDB Atlas Database...\n');
  
  try {
    // Connect to Atlas
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = mongoose.connection.db;
    
    // Drop existing collections (optional - for clean setup)
    console.log('\n🗑️  Cleaning existing collections...');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
      console.log(`   Dropped: ${collection.name}`);
    }
    
    // Create collections
    console.log('\n📁 Creating collections...');
    
    // Users collection
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { bsonType: 'string' },
            email: { bsonType: 'string' },
            password: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            role: { bsonType: 'string', enum: ['customer', 'admin'] },
            addresses: { bsonType: 'array' },
            wishlist: { bsonType: 'array' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('   ✅ Created: users');
    
    // Products collection
    await db.createCollection('products', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'description', 'category', 'price', 'stock'],
          properties: {
            name: { bsonType: 'string' },
            description: { bsonType: 'string' },
            category: { bsonType: 'string', enum: ['women', 'kids', 'accessories'] },
            type: { bsonType: 'string' },
            price: { bsonType: 'number' },
            originalPrice: { bsonType: 'number' },
            discount: { bsonType: 'number' },
            colors: { bsonType: 'array' },
            sizes: { bsonType: 'array' },
            ageGroups: { bsonType: 'array' },
            images: { bsonType: 'array' },
            stock: { bsonType: 'number' },
            isActive: { bsonType: 'bool' },
            featured: { bsonType: 'bool' },
            tags: { bsonType: 'array' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('   ✅ Created: products');
    
    // Orders collection
    await db.createCollection('orders', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['orderId', 'user', 'items', 'totalAmount', 'paymentMethod'],
          properties: {
            orderId: { bsonType: 'string' },
            user: { bsonType: 'objectId' },
            items: { bsonType: 'array' },
            totalAmount: { bsonType: 'number' },
            paymentMethod: { bsonType: 'string', enum: ['razorpay', 'cod'] },
            paymentStatus: { bsonType: 'string' },
            orderStatus: { bsonType: 'string' },
            shippingAddress: { bsonType: 'object' },
            razorpayOrderId: { bsonType: 'string' },
            razorpayPaymentId: { bsonType: 'string' },
            estimatedDelivery: { bsonType: 'date' },
            deliveredAt: { bsonType: 'date' },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('   ✅ Created: orders');
    
    // Carts collection
    await db.createCollection('carts', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user', 'items'],
          properties: {
            user: { bsonType: 'objectId' },
            items: { bsonType: 'array' },
            total: { bsonType: 'number' },
            itemCount: { bsonType: 'number' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });
    console.log('   ✅ Created: carts');
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('   ✅ Index: users.email (unique)');
    
    // Product indexes
    await db.collection('products').createIndex({ name: 'text', description: 'text', tags: 'text' });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ featured: 1 });
    console.log('   ✅ Index: products.text_search, category, featured');
    
    // Order indexes
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
    await db.collection('orders').createIndex({ user: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    console.log('   ✅ Index: orders.orderId (unique), user, createdAt');
    
    // Cart indexes
    await db.collection('carts').createIndex({ user: 1 }, { unique: true });
    console.log('   ✅ Index: carts.user (unique)');
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📁 Collections created:');
    console.log('   - users');
    console.log('   - products');
    console.log('   - orders');
    console.log('   - carts');
    
    await mongoose.disconnect();
    console.log('\n🔗 Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
