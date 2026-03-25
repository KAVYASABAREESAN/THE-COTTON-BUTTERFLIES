const express = require('express');
const {
  submitSupportMessage,
  getSupportMessages,
  replyToSupportMessage,
  getMySupportMessages,
  markSupportReplyRead
} = require('../controllers/supportController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/support', optionalProtect, submitSupportMessage);
router.get('/support/my-messages', protect, getMySupportMessages);
router.put('/support/:id/read', protect, markSupportReplyRead);
router.get('/admin/support', protect, admin, getSupportMessages);
router.put('/admin/support/:id/reply', protect, admin, replyToSupportMessage);

module.exports = router;
