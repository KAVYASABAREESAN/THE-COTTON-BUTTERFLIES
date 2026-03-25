const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ['pending', 'replied'],
      default: 'pending'
    },
    adminReply: {
      message: {
        type: String,
        trim: true,
        maxlength: 5000
      },
      repliedAt: Date,
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    },
    replyViewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

supportMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
