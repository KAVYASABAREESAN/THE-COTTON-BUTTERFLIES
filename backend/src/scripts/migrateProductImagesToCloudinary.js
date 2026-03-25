require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const localUploadDirs = [
  path.resolve(__dirname, '../../src/uploads'),
  path.resolve(__dirname, '../../uploads')
];

const isCloudinaryUrl = (value = '') =>
  typeof value === 'string' && value.includes('res.cloudinary.com');

const resolveLocalFile = (imageValue = '') => {
  if (!imageValue || typeof imageValue !== 'string') return null;

  const normalized = imageValue.replace(/\\/g, '/');
  const uploadIndex = normalized.lastIndexOf('/uploads/');
  const candidateName =
    uploadIndex >= 0 ? normalized.slice(uploadIndex + '/uploads/'.length) : normalized;

  for (const dir of localUploadDirs) {
    const absolutePath = path.join(dir, path.basename(candidateName));
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
};

const uploadImageToCloudinary = async (filePath, product) => {
  const folder =
    product.category === 'accessories'
      ? 'the-cotton-butterflies/accessories'
      : 'the-cotton-butterflies/products';

  const options = {
    folder,
    resource_type: 'image'
  };

  if (product.category === 'accessories') {
    options.background_removal = 'cloudinary_ai';
    options.format = 'png';
  }

  const result = await cloudinary.uploader.upload(filePath, options);
  return result.secure_url;
};

const migrate = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are missing');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let updatedProducts = 0;
  let updatedImages = 0;
  let skippedImages = 0;

  for (const product of products) {
    let changed = false;
    const nextImages = [];

    for (const image of product.images || []) {
      if (isCloudinaryUrl(image)) {
        nextImages.push(image);
        continue;
      }

      const localFile = resolveLocalFile(image);
      if (!localFile) {
        console.warn(`Skipping missing local file for product ${product._id}: ${image}`);
        nextImages.push(image);
        skippedImages += 1;
        continue;
      }

      try {
        const cloudinaryUrl = await uploadImageToCloudinary(localFile, product);
        nextImages.push(cloudinaryUrl);
        updatedImages += 1;
        changed = true;
        console.log(`Uploaded ${path.basename(localFile)} for product ${product._id}`);
      } catch (error) {
        console.warn(
          `Failed to upload ${localFile} for product ${product._id}: ${error.message}`
        );
        nextImages.push(image);
        skippedImages += 1;
      }
    }

    if (changed) {
      product.images = nextImages;
      await product.save();
      updatedProducts += 1;
    }
  }

  console.log(
    `Migration complete. Updated products: ${updatedProducts}, uploaded images: ${updatedImages}, skipped images: ${skippedImages}`
  );
  await mongoose.disconnect();
};

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Migration failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_error) {
      // ignore disconnect errors on failure path
    }
    process.exit(1);
  });
