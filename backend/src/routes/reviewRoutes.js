const express = require('express');
const router = express.Router();
const { submitReview, getProductReviews, getOrderReviews } = require('../controllers/reviewController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.post('/reviews', protect, submitReview);
router.get('/reviews/order/:orderId', protect, getOrderReviews);
router.get('/reviews/:productId', optionalProtect, getProductReviews);

module.exports = router;
