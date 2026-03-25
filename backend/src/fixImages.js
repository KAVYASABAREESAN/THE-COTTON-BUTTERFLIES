require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const P = require('./models/Product');

  // Get all actual files in uploads folder
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);
  console.log('Files in uploads:', files);

  // Fix all products - remove any image URLs pointing to files that don't exist
  const products = await P.find({ images: { $exists: true, $ne: [] } });

  for (const product of products) {
    const validImages = product.images.filter(img => {
      if (!img || img.startsWith('blob:') || img.includes('/api/placeholder')) return false;
      if (img.includes('localhost:5000/uploads/')) {
        const filename = img.split('/uploads/')[1];
        return files.includes(filename);
      }
      return true; // keep external URLs
    });

    if (validImages.length !== product.images.length) {
      await P.updateOne({ _id: product._id }, { $set: { images: validImages } });
      console.log(`Fixed: ${product.name} — was ${product.images.length} images, now ${validImages.length}`);
    }
  }

  // Show final state
  const all = await P.find({}, 'name images');
  console.log('\nFinal product images:');
  all.forEach(p => console.log(`${p.name}:`, p.images));

  process.exit();
});
