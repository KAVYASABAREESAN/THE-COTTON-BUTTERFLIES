const SupportMessage = require('../models/SupportMessage');
const { sendSupportMessageEmail } = require('../utils/emailService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const submitSupportMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, subject, and message are required'
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter a valid email address'
      });
    }

    const supportMessage = await SupportMessage.create({
      customer: req.user?._id || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    });

    let emailStatus = { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
    try {
      emailStatus = await sendSupportMessageEmail(supportMessage);
    } catch (mailError) {
      console.error('Support email send failed:', mailError);
      emailStatus = {
        sent: false,
        reason: 'SEND_FAILED',
        error: mailError.message
      };
    }

    return res.status(201).json({
      status: 'success',
      message: 'Support message submitted successfully',
      data: supportMessage,
      emailStatus
    });
  } catch (error) {
    console.error('submitSupportMessage error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit support message',
      error: error.message
    });
  }
};

const getSupportMessages = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
            { message: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [messages, total] = await Promise.all([
      SupportMessage.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('customer', 'name email')
        .populate('adminReply.repliedBy', 'name email')
        .lean(),
      SupportMessage.countDocuments(filter)
    ]);

    return res.json({
      status: 'success',
      data: messages,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('getSupportMessages error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch support messages',
      error: error.message
    });
  }
};

const replyToSupportMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Reply message is required'
      });
    }

    const supportMessage = await SupportMessage.findById(id);

    if (!supportMessage) {
      return res.status(404).json({
        status: 'error',
        message: 'Support message not found'
      });
    }

    supportMessage.status = 'replied';
    supportMessage.adminReply = {
      message: message.trim(),
      repliedAt: new Date(),
      repliedBy: req.user._id
    };
    supportMessage.replyViewedAt = null;

    await supportMessage.save();
    await supportMessage.populate('adminReply.repliedBy', 'name email');

    return res.json({
      status: 'success',
      message: 'Reply sent successfully',
      data: supportMessage
    });
  } catch (error) {
    console.error('replyToSupportMessage error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send support reply',
      error: error.message
    });
  }
};

const getMySupportMessages = async (req, res) => {
  try {
    const messages = await SupportMessage.find({ customer: req.user._id })
      .sort('-createdAt')
      .populate('adminReply.repliedBy', 'name email')
      .lean();

    const unreadReplies = messages.filter(
      (entry) => entry.adminReply?.message && !entry.replyViewedAt
    ).length;

    return res.json({
      status: 'success',
      data: messages,
      unreadReplies
    });
  } catch (error) {
    console.error('getMySupportMessages error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your support messages',
      error: error.message
    });
  }
};

const markSupportReplyRead = async (req, res) => {
  try {
    const { id } = req.params;

    const supportMessage = await SupportMessage.findOne({
      _id: id,
      customer: req.user._id
    });

    if (!supportMessage) {
      return res.status(404).json({
        status: 'error',
        message: 'Support message not found'
      });
    }

    if (!supportMessage.adminReply?.message) {
      return res.status(400).json({
        status: 'error',
        message: 'No admin reply exists for this support message'
      });
    }

    if (!supportMessage.replyViewedAt) {
      supportMessage.replyViewedAt = new Date();
      await supportMessage.save();
    }

    return res.json({
      status: 'success',
      message: 'Reply marked as read',
      data: supportMessage
    });
  } catch (error) {
    console.error('markSupportReplyRead error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update support notification',
      error: error.message
    });
  }
};

module.exports = {
  submitSupportMessage,
  getSupportMessages,
  replyToSupportMessage,
  getMySupportMessages,
  markSupportReplyRead
};
