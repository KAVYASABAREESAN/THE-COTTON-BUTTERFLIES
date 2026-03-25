const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/profile
// @desc    Get profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/profile
// @desc    Update profile
// @access  Private
router.put('/', protect, async (req, res) => {
  try {
    const { name, phone, bio, dateOfBirth, gender } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, bio, dateOfBirth, gender },
      { new: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Profile updated',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/profile/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;