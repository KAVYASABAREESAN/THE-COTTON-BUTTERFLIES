const mongoose = require('mongoose');
const path = require('path');
// Load .env from the backend root (not from scripts folder)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Product = require('../models/Product');

const products = [
  // Women's Dresses
  {
    name: 'Embroidered Puff-Sleeve Maxi Dress',
    description: 'Beautiful embroidered maxi dress with puff sleeves, perfect for special occasions. Made from premium cotton blend for comfort and style.',
    price: 4999,
    originalPrice: 6999,
    discount: 20,
    category: 'women',
    type: 'dress',
    colors: ['Pink', 'Blue', 'Lavender'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: [
      'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg'
    ],
    stock: 15,
    featured: true,
    tags: ['dress', 'maxi', 'embroidery', 'puff-sleeve', 'women', 'party'],
    isActive: true
  },
  {
    name: 'Lace-Trim V-Neck Crepe Maxi Dress',
    description: 'Elegant crepe maxi dress with delicate lace trim and V-neck design. Perfect for evening events and parties.',
    price: 3499,
    originalPrice: 5999,
    discount: 40,
    category: 'women',
    type: 'dress',
    colors: ['Black', 'Burgundy', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample3.jpg'],
    stock: 8,
    featured: true,
    tags: ['dress', 'maxi', 'lace', 'v-neck', 'crepe', 'women', 'evening'],
    isActive: true
  },
  {
    name: 'Floral Print Wrap Dress',
    description: 'Charming wrap dress with vibrant floral print. Adjustable fit and flattering silhouette.',
    price: 2899,
    originalPrice: 3599,
    discount: 20,
    category: 'women',
    type: 'dress',
    colors: ['Multicolor', 'Blue Floral', 'Pink Floral'],
    sizes: ['S', 'M', 'L'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample4.jpg'],
    stock: 12,
    featured: false,
    tags: ['dress', 'wrap', 'floral', 'casual', 'women'],
    isActive: true
  },

  // Women's Tops
  {
    name: 'Cotton Linen Blend Shirt',
    description: 'Breathable cotton-linen blend shirt for casual everyday wear. Perfect for summer.',
    price: 2299,
    originalPrice: 2999,
    discount: 23,
    category: 'women',
    type: 'shirt',
    colors: ['White', 'Blue', 'Beige'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample5.jpg'],
    stock: 25,
    featured: true,
    tags: ['shirt', 'linen', 'cotton', 'casual', 'women', 'summer'],
    isActive: true
  },
  {
    name: 'Printed Peplum Top',
    description: 'Stylish peplum top with abstract print. Perfect for office wear and parties.',
    price: 1899,
    originalPrice: 2499,
    discount: 24,
    category: 'women',
    type: 'top',
    colors: ['Teal', 'Maroon', 'Black'],
    sizes: ['S', 'M', 'L'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample6.jpg'],
    stock: 18,
    featured: false,
    tags: ['top', 'peplum', 'printed', 'office', 'women'],
    isActive: true
  },

  // Women's Skirts
  {
    name: 'Pleated Midi Skirt',
    description: 'Elegant pleated midi skirt with elastic waistband. Versatile piece for any occasion.',
    price: 2199,
    originalPrice: 2799,
    discount: 21,
    category: 'women',
    type: 'skirt',
    colors: ['Black', 'Navy', 'Olive'],
    sizes: ['XS', 'S', 'M', 'L'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample7.jpg'],
    stock: 14,
    featured: false,
    tags: ['skirt', 'midi', 'pleated', 'women', 'versatile'],
    isActive: true
  },

  // Women's Pants
  {
    name: 'Wide Leg Palazzo Pants',
    description: 'Comfortable wide-leg palazzo pants with high waist. Perfect for both casual and formal wear.',
    price: 2499,
    originalPrice: 3299,
    discount: 24,
    category: 'women',
    type: 'pants',
    colors: ['Black', 'Beige', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample8.jpg'],
    stock: 20,
    featured: true,
    tags: ['pants', 'palazzo', 'wide-leg', 'women', 'comfortable'],
    isActive: true
  },

  // Kids Collection
  {
    name: 'Kids Floral Print Frock',
    description: 'Adorable floral print frock for little girls. Soft and comfortable fabric with pretty details.',
    price: 1499,
    originalPrice: 1999,
    discount: 25,
    category: 'kids',
    type: 'frock',
    colors: ['Pink', 'Yellow', 'Mint'],
    sizes: [],
    ageGroups: ['2-3', '4-5', '6-7', '8-9'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample9.jpg'],
    stock: 20,
    featured: true,
    tags: ['kids', 'frock', 'floral', 'dress', 'girls'],
    isActive: true
  },
  {
    name: 'Boys Casual Shirt & Shorts Set',
    description: 'Complete 2-piece set with shirt and shorts for young boys. Perfect for casual outings.',
    price: 1799,
    originalPrice: 2499,
    discount: 28,
    category: 'kids',
    type: 'set',
    colors: ['Blue', 'Green', 'Red'],
    sizes: [],
    ageGroups: ['4-5', '6-7', '8-9', '10-11'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample10.jpg'],
    stock: 15,
    featured: true,
    tags: ['kids', 'shirt', 'shorts', 'set', 'boys', 'casual'],
    isActive: true
  },
  {
    name: 'Girls Party Wear Gown',
    description: 'Beautiful party wear gown with sequins and tulle. Perfect for weddings and special occasions.',
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    category: 'kids',
    type: 'gown',
    colors: ['Pink', 'Purple', 'Red'],
    sizes: [],
    ageGroups: ['4-5', '6-7', '8-9', '10-11', '12-13'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample11.jpg'],
    stock: 7,
    featured: true,
    tags: ['kids', 'gown', 'party', 'girls', 'wedding'],
    isActive: true
  },
  {
    name: 'Kids Ethnic Set (Kurta Pajama)',
    description: 'Traditional kurta pajama set for boys. Perfect for festivals and family gatherings.',
    price: 2199,
    originalPrice: 2999,
    discount: 27,
    category: 'kids',
    type: 'ethnic',
    colors: ['Off White', 'Beige', 'Blue'],
    sizes: [],
    ageGroups: ['4-5', '6-7', '8-9', '10-11'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample12.jpg'],
    stock: 10,
    featured: false,
    tags: ['kids', 'ethnic', 'kurta', 'boys', 'traditional'],
    isActive: true
  },

  // Accessories
  {
    name: 'Leather Crossbody Bag',
    description: 'Genuine leather crossbody bag with adjustable strap. Compact yet spacious enough for essentials.',
    price: 1899,
    originalPrice: 2499,
    discount: 24,
    category: 'accessories',
    type: 'bag',
    colors: ['Brown', 'Black', 'Tan'],
    sizes: ['One Size'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample13.jpg'],
    stock: 12,
    featured: true,
    tags: ['bag', 'leather', 'crossbody', 'accessories', 'women'],
    isActive: true
  },
  {
    name: 'Silk Print Scarf',
    description: 'Luxurious silk scarf with hand-printed design. Adds elegance to any outfit.',
    price: 899,
    originalPrice: 1499,
    discount: 40,
    category: 'accessories',
    type: 'scarf',
    colors: ['Multicolor', 'Blue', 'Pink'],
    sizes: ['One Size'],
    images: ['https://res.cloudinary.com/demo/image/upload/v1/sample14.jpg'],
    stock: 25,
    featured: false,
    tags: ['scarf', 'silk', 'accessories', 'women', 'printed'],
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🔍 Checking .env file location...');
    console.log('Current directory:', __dirname);
    console.log('Looking for .env at:', path.resolve(__dirname, '../../.env'));
    
    // Check if MONGODB_URI is loaded
    console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Not found');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully');

    // Clear existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Insert new products
    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products successfully`);
    
    console.log('\n📦 Products added:');
    inserted.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ₹${p.price}`);
    });

    // List all products in database to verify
    const allProducts = await Product.find({});
    console.log(`\n📊 Total products in database: ${allProducts.length}`);

    mongoose.connection.close();
    console.log('\n✨ Database seeding complete!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();