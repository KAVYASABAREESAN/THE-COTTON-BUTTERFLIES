const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching wishlist for user:', req.user._id);
    
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product', 'name price images stock category originalPrice');

    if (!wishlist) {
      console.log('No wishlist found, creating new one');
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: []
      });
    }

    res.json({
      status: 'success',
      data: wishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/wishlist/items
// @desc    Add item to wishlist
// @access  Private
router.post('/items', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    console.log('Adding to wishlist:', { userId: req.user._id, productId });

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        items: []
      });
    }

    // Check if product already in wishlist
    const exists = wishlist.items.some(item => 
      item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({
        status: 'error',
        message: 'Product already in wishlist'
      });
    }

    wishlist.items.push({
      product: productId,
      addedAt: new Date()
    });

    await wishlist.save();
    await wishlist.populate('items.product', 'name price images stock');

    res.json({
      status: 'success',
      message: 'Added to wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   DELETE /api/wishlist/items/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/items/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('Removing from wishlist:', { userId: req.user._id, productId });

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Wishlist not found'
      });
    }

    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== productId
    );

    await wishlist.save();

    res.json({
      status: 'success',
      message: 'Removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   DELETE /api/wishlist
// @desc    Clear wishlist
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    console.log('Clearing wishlist for user:', req.user._id);
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Wishlist not found'
      });
    }

    wishlist.items = [];
    await wishlist.save();

    res.json({
      status: 'success',
      message: 'Wishlist cleared',
      data: wishlist
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;