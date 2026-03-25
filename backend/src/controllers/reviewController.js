const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const syncProductReviewSummary = async (productId) => {
  const objectId = new mongoose.Types.ObjectId(productId);
  const [summary] = await Review.aggregate([
    { $match: { productId: objectId } },
    {
      $group: {
        _id: '$productId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: summary ? Number(summary.averageRating.toFixed(1)) : 0,
    numReviews: summary ? summary.totalReviews : 0
  });

  return {
    averageRating: summary ? Number(summary.averageRating.toFixed(1)) : 0,
    totalReviews: summary ? summary.totalReviews : 0
  };
};

const getEligibleOrdersForProduct = async (userId, productId) => {
  const [deliveredOrders, existingReviews] = await Promise.all([
    Order.find({
      user: userId,
      orderStatus: 'delivered',
      'items.product': productId
    })
      .select('_id orderId deliveredAt items')
      .sort('-deliveredAt -createdAt'),
    Review.find({ userId, productId }).select('orderId')
  ]);

  const reviewedOrderIds = new Set(existingReviews.map((review) => review.orderId.toString()));

  return deliveredOrders
    .filter((order) => !reviewedOrderIds.has(order._id.toString()))
    .map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      deliveredAt: order.deliveredAt,
      items: order.items
        .filter((item) => item.product?.toString() === productId.toString())
        .map((item) => ({
          name: item.name,
          quantity: item.quantity,
          image: item.image || ''
        }))
    }));
};

const submitReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    if (!productId || !orderId || rating === undefined || !comment?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'productId, orderId, rating, and comment are required'
      });
    }

    if (!isValidObjectId(productId) || !isValidObjectId(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid productId or orderId'
      });
    }

    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be a number between 1 and 5'
      });
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment must be at least 3 characters long'
      });
    }

    const [product, order, existingReview] = await Promise.all([
      Product.findById(productId).select('_id name'),
      Order.findOne({
        _id: orderId,
        user: req.user._id,
        orderStatus: 'delivered',
        'items.product': productId
      }).select('_id orderId'),
      Review.findOne({
        userId: req.user._id,
        productId,
        orderId
      })
    ]);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    if (!order) {
      return res.status(403).json({
        status: 'error',
        message: 'You can review only products from your delivered orders'
      });
    }

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this product for the selected order'
      });
    }

    const review = await Review.create({
      userId: req.user._id,
      userName: req.user.name || 'Customer',
      productId,
      orderId,
      rating: numericRating,
      comment: trimmedComment
    });

    const summary = await syncProductReviewSummary(productId);
    const hydratedReview = await Review.findById(review._id).lean();

    return res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      data: {
        review: hydratedReview,
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews
      }
    });
  } catch (error) {
    console.error('submitReview error:', error);

    if (error?.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this product for the selected order'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid productId'
      });
    }

    const product = await Product.findById(productId).select('_id name rating numReviews');
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const reviews = await Review.find({ productId })
      .sort('-createdAt')
      .select('userId userName rating comment createdAt orderId')
      .lean();

    let eligibility = {
      canReview: false,
      eligibleOrders: [],
      message: 'Login to review this product after delivery.'
    };

    if (req.user?._id) {
      const eligibleOrders = await getEligibleOrdersForProduct(req.user._id, productId);
      eligibility = {
        canReview: eligibleOrders.length > 0,
        eligibleOrders,
        message:
          eligibleOrders.length > 0
            ? 'You can leave a review for your delivered order.'
            : 'Reviewing is available after this product is delivered.'
      };
    }

    return res.json({
      status: 'success',
      data: {
        averageRating: Number(product.rating || 0),
        totalReviews: Number(product.numReviews || reviews.length || 0),
        reviews,
        eligibility
      }
    });
  } catch (error) {
    console.error('getProductReviews error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

const getOrderReviews = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid orderId'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    }).select('_id orderId orderStatus items');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const productIds = (order.items || [])
      .map((item) => item.product?.toString())
      .filter(Boolean);

    const reviews = await Review.find({
      userId: req.user._id,
      orderId,
      productId: { $in: productIds }
    })
      .select('productId rating comment createdAt')
      .lean();

    const reviewMap = reviews.reduce((acc, review) => {
      acc[review.productId.toString()] = {
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      };
      return acc;
    }, {});

    return res.json({
      status: 'success',
      data: {
        orderId: order._id,
        orderStatus: order.orderStatus,
        reviews: reviewMap
      }
    });
  } catch (error) {
    console.error('getOrderReviews error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order reviews',
      error: error.message
    });
  }
};

module.exports = {
  submitReview,
  getProductReviews,
  getOrderReviews
};
