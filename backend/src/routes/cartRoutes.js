const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

// Helper to normalize cart response - always use latest product image
const normalizeCart = (cart) => {
  const items = cart.items.map(item => {
    const productImage = item.product?.images?.[0] || '';
    const savedImage = item.image || '';
    // Use product's current image if saved image is missing, blob, or placeholder
    const isInvalidImage = !savedImage ||
      savedImage.startsWith('blob:') ||
      savedImage.includes('/api/placeholder');
    return {
      ...item.toObject(),
      image: isInvalidImage ? productImage : savedImage
    };
  });
  return {
    ...cart.toObject(),
    items
  };
};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price images stock');

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        total: 0,
        itemCount: 0
      });
    }

    res.json({
      status: 'success',
      data: normalizeCart(cart)
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', protect, async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({ status: 'error', message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        status: 'error',
        message: `Insufficient stock. Available: ${product.stock}`
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(item =>
      item.product.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    // Always use the latest product image
    const productImage = product.images?.[0] || '';

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].image = productImage; // refresh image
    } else {
      cart.items.push({
        product: productId,
        quantity,
        size,
        color,
        price: product.price,
        name: product.name,
        image: productImage
      });
    }

    await cart.save();
    await cart.populate('items.product', 'name price images stock');

    res.json({
      status: 'success',
      message: 'Item added to cart',
      data: normalizeCart(cart)
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   PUT /api/cart/items/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/items/:itemId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price images stock');

    res.json({
      status: 'success',
      message: 'Cart updated',
      data: normalizeCart(cart)
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   DELETE /api/cart/items/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:itemId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product', 'name price images stock');

    res.json({
      status: 'success',
      message: 'Item removed from cart',
      data: normalizeCart(cart)
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.json({ status: 'success', message: 'Cart cleared', data: cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// @route   POST /api/cart/sync
// @desc    Sync local cart with backend after login
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    const { localItems } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const localItem of localItems) {
      const product = await Product.findById(localItem.productId);
      if (!product) continue;

      const existingItem = cart.items.find(item =>
        item.product.toString() === localItem.productId &&
        item.size === localItem.size &&
        item.color === localItem.color
      );

      const productImage = product.images?.[0] || '';

      if (existingItem) {
        existingItem.quantity += localItem.quantity;
        existingItem.image = productImage;
      } else {
        cart.items.push({
          product: localItem.productId,
          quantity: localItem.quantity,
          size: localItem.size,
          color: localItem.color,
          price: product.price,
          name: product.name,
          image: productImage
        });
      }
    }

    await cart.save();
    await cart.populate('items.product', 'name price images stock');

    res.json({
      status: 'success',
      message: 'Cart synced successfully',
      data: normalizeCart(cart)
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
