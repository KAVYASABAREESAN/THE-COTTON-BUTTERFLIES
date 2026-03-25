const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

const logProductRoute = (...args) => {
  console.log('[productRoutes]', ...args);
};

const normalizeProductPayload = (body = {}) => {
  const normalized = { ...body };
  const category = typeof normalized.category === 'string' ? normalized.category.toLowerCase() : normalized.category;

  if (category !== 'accessories') {
    normalized.subcategory = null;
  }

  if (category === 'accessories' && !normalized.subcategory) {
    const error = new Error('Accessory products require a subcategory.');
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const sendProductError = (res, error, fallbackMessage) => {
  console.error('[productRoutes]', fallbackMessage + ':', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Product validation failed',
      error: error.message,
      fields: Object.fromEntries(
        Object.entries(error.errors || {}).map(([key, value]) => [key, value.message])
      )
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  return res.status(500).json({
    status: 'error',
    message: fallbackMessage,
    error: error.message
  });
};

// ============================================
// PUBLIC PRODUCT ROUTES
// ============================================

// GET /api/products - Get all products with filtering, sorting, pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      featured,
      type,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      page = 1,
      limit = 12,
      search,
      colors,
      sizes,
      inStock
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Category filter
    if (category) {
      const categories = category.split(',');
      filter.category = { $in: categories };
    }

    // Featured filter
    if (featured === 'true') {
      filter.featured = true;
    }

    // Type filter
    if (type) {
      const types = type.split(',');
      filter.type = { $in: types };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Color filter
    if (colors) {
      const colorArray = colors.split(',');
      filter.colors = { $in: colorArray };
    }

    // Size filter
    if (sizes) {
      const sizeArray = sizes.split(',');
      filter.sizes = { $in: sizeArray };
    }

    // Stock filter
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Search by name, description, or tags
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Get unique values for filters (for filter sidebar)
    const categories = await Product.distinct('category');
    const types = await Product.distinct('type');
    const allColors = await Product.distinct('colors');
    const allSizes = await Product.distinct('sizes');
    
    // Get min and max price
    const priceStats = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: null, 
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }}
    ]);

    res.json({
      status: 'success',
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      filters: {
        categories,
        types,
        colors: allColors,
        sizes: allSizes,
        priceRange: priceStats.length > 0 ? {
          min: priceStats[0].minPrice,
          max: priceStats[0].maxPrice
        } : { min: 0, max: 10000 }
      },
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const featuredProducts = await Product.find({ 
      featured: true,
      isActive: true,
      stock: { $gt: 0 }
    })
      .sort('-createdAt')
      .limit(Number(limit));

    res.json({
      status: 'success',
      count: featuredProducts.length,
      data: featuredProducts
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching featured products',
      error: error.message
    });
  }
});

// GET /api/products/new-arrivals - Get new arrivals
router.get('/new-arrivals', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const newArrivals = await Product.find({ 
      isActive: true,
      stock: { $gt: 0 }
    })
      .sort('-createdAt')
      .limit(Number(limit));

    res.json({
      status: 'success',
      count: newArrivals.length,
      data: newArrivals
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching new arrivals',
      error: error.message
    });
  }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit, page = 1, sort = '-createdAt' } = req.query;

    const pageSize = Number(limit) || 12;
    const skip = (Number(page) - 1) * pageSize;

    const filter = { 
      category,
      isActive: true,
      stock: { $gt: 0 }
    };

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments(filter);

    res.json({
      status: 'success',
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / pageSize),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching category products',
      error: error.message
    });
  }
});

// GET /api/products/search - Search products
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Text search
    const products = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(
      { $text: { $search: q } }
    );

    res.json({
      status: 'success',
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error searching products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Get related products (same category, similar price range, excluding current product)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
      stock: { $gt: 0 },
      price: {
        $gte: product.price * 0.7,
        $lte: product.price * 1.3
      }
    })
    .limit(4)
    .select('name price images category type');

    // If not enough related products, get any from same category
    if (relatedProducts.length < 4) {
      const additionalProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id, $nin: relatedProducts.map(p => p._id) },
        isActive: true
      })
      .limit(4 - relatedProducts.length)
      .select('name price images category type');
      
      relatedProducts.push(...additionalProducts);
    }

    res.json({
      status: 'success',
      data: {
        product,
        relatedProducts
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

// POST /api/products - Create new product (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    req.body = normalizeProductPayload(req.body);
    logProductRoute('create:start', {
      userId: req.user?._id?.toString(),
      role: req.user?.role,
      body: req.body
    });
    const product = await Product.create(req.body);
    logProductRoute('create:success', {
      productId: product._id.toString(),
      name: product.name
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    return sendProductError(res, error, 'Error creating product');
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    req.body = normalizeProductPayload(req.body);
    logProductRoute('update:start', {
      userId: req.user?._id?.toString(),
      role: req.user?.role,
      productId: req.params.id,
      body: req.body
    });
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    logProductRoute('update:success', {
      productId: product._id.toString(),
      name: product.name
    });

    res.json({
      status: 'success',
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    return sendProductError(res, error, 'Error updating product');
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting product',
      error: error.message
    });
  }
});

module.exports = router;
