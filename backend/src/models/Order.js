const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: String,
  color: String,
  image: String
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'India' },
    phone: { type: String, required: true },
    name: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 
      'shipped', 'out_for_delivery', 'delivered', 
      'cancelled', 'refunded'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  trackingNumber: String,
  trackingUrl: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderId = `ORD${year}${month}${day}${random}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
