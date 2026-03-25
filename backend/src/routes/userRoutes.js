const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/users/admin/all
// @desc    Get all users with order summary (admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.status) {
      filter.isActive = req.query.status === 'active';
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role isActive createdAt phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    const userIds = users.map((u) => u._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          totalSpent: {
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

    const orderStatsMap = orderStats.reduce((acc, item) => {
      acc[item._id.toString()] = item;
      return acc;
    }, {});

    const data = users.map((user) => {
      const stats = orderStatsMap[user._id.toString()] || { orders: 0, totalSpent: 0 };
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        orders: stats.orders,
        totalSpent: stats.totalSpent
      };
    });

    res.json({
      status: 'success',
      data,
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

// @route   GET /api/users/admin/stats
// @desc    Get user stats (admin)
// @access  Private/Admin
router.get('/admin/stats', protect, admin, async (req, res) => {
  try {
    const [summary] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalCustomers: {
            $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] }
          },
          totalAdmins: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          blockedUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: {
        summary: summary || {
          totalUsers: 0,
          totalCustomers: 0,
          totalAdmins: 0,
          activeUsers: 0,
          blockedUsers: 0
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

// @route   PUT /api/users/admin/:id/role
// @desc    Update user role (admin)
// @access  Private/Admin
router.put('/admin/:id/role', protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('name email role isActive createdAt phone');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/users/admin/:id/status
// @desc    Block/unblock user (admin)
// @access  Private/Admin
router.put('/admin/:id/status', protect, admin, async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isActive must be boolean'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('name email role isActive createdAt phone');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
