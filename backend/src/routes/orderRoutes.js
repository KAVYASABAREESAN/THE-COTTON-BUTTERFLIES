const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect, admin } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// Generate order ID
const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const time = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${year}${month}${day}${time}${random}`;
};

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('Creating order with data:', req.body);
    
    const {
      items,
      shippingAddress,
      paymentMethod,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subtotal,
      shippingCost,
      tax,
      discount,
      total,
      notes
    } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        status: 'error',
        message: 'No items in order'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Shipping address is required'
      });
    }

    const normalizedShippingAddress = {
      name: shippingAddress.name || req.user.name,
      phone: shippingAddress.phone,
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.zip,
      country: shippingAddress.country || 'India'
    };

    const requiredAddressFields = ['name', 'phone', 'street', 'city', 'state', 'zip'];
    for (const field of requiredAddressFields) {
      if (!normalizedShippingAddress[field]) {
        return res.status(400).json({
          status: 'error',
          message: `Shipping address field "${field}" is required`
        });
      }
    }

    if (paymentMethod === 'razorpay') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          status: 'error',
          message: 'Razorpay payment details are required'
        });
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          status: 'error',
          message: 'Razorpay key secret is not configured on server'
        });
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid Razorpay payment signature'
        });
      }
    }

    // Validate stock
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid product ID in order items: ${item.product}`
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: `Product not found: ${item.name}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }
    }

    const baseOrderPayload = {
      user: req.user._id,
      items: items.map(item => ({
        product: item.product,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image
      })),
      shippingAddress: normalizedShippingAddress,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
      razorpayOrderId: razorpay_order_id || undefined,
      razorpayPaymentId: razorpay_payment_id || undefined,
      razorpaySignature: razorpay_signature || undefined,
      subtotal: subtotal || total,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      discount: discount || 0,
      total: total || subtotal,
      totalAmount: total || subtotal,
      orderStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Order placed successfully'
      }]
    };

    let order;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        order = await Order.create({
          ...baseOrderPayload,
          orderId: generateOrderId()
        });
        break;
      } catch (createErr) {
        if (createErr?.code === 11000 && createErr?.keyPattern?.orderId) {
          continue;
        }
        throw createErr;
      }
    }

    if (!order) {
      return res.status(500).json({
        status: 'error',
        message: 'Could not generate unique order id, please retry'
      });
    }

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    console.log('Order created:', order.orderId);

    let emailStatus = { sent: false, reason: 'NO_EMAIL_ON_USER' };
    if (req.user?.email) {
      try {
        emailStatus = await sendOrderConfirmationEmail({
          to: req.user.email,
          name: req.user.name || normalizedShippingAddress.name,
          order
        });
      } catch (mailError) {
        console.error('Order confirmation email failed:', mailError?.message || mailError);
        emailStatus = {
          sent: false,
          reason: 'SEND_FAILED',
          error: mailError?.message || 'Unknown email error'
        };
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order,
      emailStatus
    });
  } catch (error) {
    if (error?.code === 121) {
      return res.status(400).json({
        status: 'error',
        message: 'Order validation failed at database level. Please verify order totals and required fields.',
        error: error.message
      });
    }

    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/orders/test-email
// @desc    Send a test order confirmation email to logged-in user
// @access  Private
router.post('/test-email', protect, async (req, res) => {
  try {
    if (!req.user?.email) {
      return res.status(400).json({
        status: 'error',
        message: 'No email found on logged-in user'
      });
    }

    const mockOrder = {
      orderId: `TEST${Date.now()}`,
      paymentMethod: 'cod',
      total: 1,
      items: [{ name: 'Test Product', quantity: 1, price: 1 }]
    };

    const emailStatus = await sendOrderConfirmationEmail({
      to: req.user.email,
      name: req.user.name || 'Customer',
      order: mockOrder
    });

    return res.json({
      status: 'success',
      message: 'Test email attempted',
      emailStatus
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Failed to send test email'
    });
  }
});

// @route   POST /api/orders/razorpay/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!keyId || !keySecret) {
      return res.status(500).json({
        status: 'error',
        message: 'Razorpay keys are not configured on server'
      });
    }

    if (keyId.startsWith('your_') || keySecret.startsWith('your_')) {
      return res.status(500).json({
        status: 'error',
        message: 'Razorpay keys are still placeholders in backend .env'
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid amount is required'
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`
    });

    res.json({
      status: 'success',
      data: {
        key: process.env.RAZORPAY_KEY_ID,
        order: razorpayOrder
      }
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    const providerMessage =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      'Failed to create Razorpay order';
    res.status(500).json({
      status: 'error',
      message: providerMessage
    });
  }
});

// @route   POST /api/orders/razorpay/verify
// @desc    Verify Razorpay payment signature
// @access  Private
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        status: 'error',
        message: 'Razorpay key secret is not configured on server'
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing Razorpay verification fields'
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Razorpay payment signature'
      });
    }

    res.json({
      status: 'success',
      message: 'Payment verified successfully',
      data: {
        razorpay_order_id,
        razorpay_payment_id
      }
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to verify payment'
    });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get user's orders
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: req.user._id })
    ]);

    res.json({
      status: 'success',
      data: orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    res.json({
      status: 'success',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled'
      });
    }

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: req.body.reason || 'Cancelled by user'
    });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.orderStatus = req.query.status;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { orderId: searchRegex },
        { 'shippingAddress.phone': searchRegex }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      data: orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/orders/admin/stats
// @desc    Get order stats (admin)
// @access  Private/Admin
router.get('/admin/stats', protect, admin, async (req, res) => {
  try {
    const [summary] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: {
              $cond: [
                { $in: ['$orderStatus', ['shipped', 'out_for_delivery']] },
                1,
                0
              ]
            }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$orderStatus',
                    ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']
                  ]
                },
                '$total',
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: {
        summary: summary || {
          totalOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          totalRevenue: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   GET /api/orders/admin/analytics
// @desc    Get sales analytics for admin dashboard
// @access  Private/Admin
router.get('/admin/analytics', protect, admin, async (req, res) => {
  try {
    const includedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
    const excludedStatuses = ['cancelled', 'refunded'];
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [summaryAgg, topSellingAgg, monthlyAgg, newUsersThisMonth] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $in: ['$orderStatus', includedStatuses] }, '$total', 0]
              }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $in: includedStatuses } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.name' },
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 1 }
      ]),
      Order.aggregate([
        {
          $match: {
            orderStatus: { $nin: excludedStatuses },
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      User.countDocuments({
        createdAt: { $gte: startOfCurrentMonth, $lt: startOfNextMonth }
      })
    ]);

    const monthlyByKey = new Map(
      monthlyAgg.map((item) => [`${item._id.year}-${item._id.month}`, item])
    );

    const monthlySales = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      const current = monthlyByKey.get(key);

      monthlySales.push({
        year,
        month,
        label: date.toLocaleString('en-US', { month: 'short' }),
        revenue: current?.revenue || 0,
        orders: current?.orders || 0
      });
    }

    const summary = summaryAgg[0] || { totalOrders: 0, totalRevenue: 0 };
    const topSellingProduct = topSellingAgg[0]
      ? {
          productId: topSellingAgg[0]._id,
          name: topSellingAgg[0].name,
          quantitySold: topSellingAgg[0].quantitySold,
          revenue: topSellingAgg[0].revenue
        }
      : null;

    res.json({
      status: 'success',
      data: {
        totalOrders: summary.totalOrders || 0,
        totalRevenue: summary.totalRevenue || 0,
        newUsersThisMonth,
        topSellingProduct,
        monthlySales
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/orders/admin/:id/status
// @desc    Update order status (admin)
// @access  Private/Admin
router.put('/admin/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, note, trackingNumber, trackingUrl } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    }

    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      order.cancelledAt = new Date();
      // restore stock once when moving into cancelled
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    order.statusHistory.push({
      status,
      note: note || `Order status updated to ${status}`
    });

    await order.save();

    res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/orders/admin/:id/refund
// @desc    Mark order as refunded (admin)
// @access  Private/Admin
router.post('/admin/:id/refund', protect, admin, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.orderStatus === 'refunded') {
      return res.status(400).json({
        status: 'error',
        message: 'Order is already refunded'
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = 'refunded';
    order.paymentStatus = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      note: reason || 'Refund processed by admin'
    });

    // restore stock if not already cancelled/refunded previously
    if (!['cancelled', 'refunded'].includes(previousStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();

    res.json({
      status: 'success',
      message: 'Refund processed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
