const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const adminData = {
      name: 'Admin',
      email: 'admin@cottonbutterflies.com',
      password: 'Admin@123',
      phone: '+91 9876543210',
      role: 'admin'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️ Admin already exists with this email');
      
      // Update existing user to admin if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin');
      }
    } else {
      // Create new admin
      const admin = await User.create(adminData);
      console.log('✅ Admin user created successfully');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
    }

    // List all admin users
    const admins = await User.find({ role: 'admin' });
    console.log(`\n📊 Total admin users: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

createAdmin();