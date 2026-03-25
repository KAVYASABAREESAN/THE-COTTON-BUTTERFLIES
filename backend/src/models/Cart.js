const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    default: 1
  },
  size: String,
  color: String,
  price: {
    type: Number,
    required: true
  },
  name: String,
  image: String
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  },
  itemCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;