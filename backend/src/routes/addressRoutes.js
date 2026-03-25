const express = require('express');
const router = express.Router();
const Address = require('../models/Address');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/addresses
// @desc    Get user's addresses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort('-isDefault');
    res.json({
      status: 'success',
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/addresses
// @desc    Add new address
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const address = await Address.create({
      user: req.user._id,
      ...req.body
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/addresses/:id
// @desc    Update address
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   DELETE /api/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Address deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   PUT /api/addresses/:id/default
// @desc    Set address as default
// @access  Private
router.put('/:id/default', protect, async (req, res) => {
  try {
    // Remove default from all addresses
    await Address.updateMany(
      { user: req.user._id },
      { isDefault: false }
    );

    // Set this address as default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Default address updated',
      data: address
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;