const mongoose = require('mongoose');
const Product = require('./src/models/Product');
require('dotenv').config();

async function checkDressProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const dressProducts = await Product.find({
      $or: [
        { type: { $regex: /dress/i } },
        { category: 'women' }
      ]
    }).limit(5);

    console.log('Found', dressProducts.length, 'potential dress products:');
    dressProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - Type: ${product.type}, Category: ${product.category}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDressProducts();