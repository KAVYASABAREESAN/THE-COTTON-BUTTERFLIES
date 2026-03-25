const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { cloudinary, upload, isCloudinaryConfigured } = require('../config/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

const buildLocalUrl = (req, filename) => `${req.protocol}://${req.get('host')}/uploads/${filename}`;

const getUploadCategory = (req) => {
  const category = String(req.body?.category || req.query?.category || '').toLowerCase();
  return category || 'products';
};

const buildCloudinaryFolder = (req) => {
  const category = getUploadCategory(req);

  switch (category) {
    case 'accessories':
      return 'the-cotton-butterflies/accessories';
    case 'branding':
      return 'the-cotton-butterflies/branding';
    default:
      return 'the-cotton-butterflies/products';
  }
};

const uploadToCloudinary = async (req, file) => {
  const category = getUploadCategory(req);
  const options = {
    folder: buildCloudinaryFolder(req),
    resource_type: 'image'
  };

  // Keep the existing special-case enhancement for accessories when available.
  if (category === 'accessories') {
    options.background_removal = 'cloudinary_ai';
    options.format = 'png';
  }

  const result = await cloudinary.uploader.upload(file.path, options);
  return {
    url: result.secure_url,
    public_id: result.public_id,
    processed: category === 'accessories'
  };
};

const mapUploadedFile = async (req, file) => {
  const localAsset = {
    url: buildLocalUrl(req, file.filename),
    public_id: file.filename,
    processed: false
  };

  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary is not configured. Falling back to local uploads.');
    return localAsset;
  }

  try {
    return await uploadToCloudinary(req, file);
  } catch (error) {
    console.error('Cloudinary upload fallback:', error.message);
    return localAsset;
  } finally {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};

// Upload multiple images
router.post('/images', protect, admin, (req, res) => {
  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No image files uploaded'
        });
      }

      const urls = await Promise.all(req.files.map((file) => mapUploadedFile(req, file)));

      res.json({
        status: 'success',
        urls
      });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
});

// Upload single image
router.post('/image', protect, admin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file uploaded'
        });
      }

      const asset = await mapUploadedFile(req, req.file);

      res.json({
        status: 'success',
        url: asset.url,
        public_id: asset.public_id,
        processed: asset.processed
      });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
});

// Delete image from Cloudinary when possible, otherwise remove local fallback file.
router.delete('/image/:public_id(*)', protect, admin, async (req, res) => {
  try {
    const publicId = req.params.public_id;

    if (isCloudinaryConfigured() && publicId.includes('/')) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } else {
      const filePath = path.join(__dirname, '../uploads', publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
