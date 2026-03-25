const mongoose = require('mongoose');

// ✅ MOVE reviewSchema to the top
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for review']
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// ✅ THEN define productSchema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['women', 'men', 'kids', 'accessories']
  },
  subcategory: {
    type: String,
    enum: ['earrings', 'chains', null],
    default: null,
    validate: {
      validator: function(value) {
        if (this.category === 'accessories') {
          return ['earrings', 'chains'].includes(value);
        }
        return value === null || value === undefined || value === '';
      },
      message: 'Accessories must have a subcategory of earrings or chains'
    }
  },
  type: {
    type: String,
    required: [true, 'Product type is required']
  },
  colors: [{
    type: String,
    required: [true, 'At least one color is required']
  }],
  sizes: [{
    type: String
  }],
  ageGroups: [{
    type: String
  }],
  images: [{
    type: String,
    required: [true, 'At least one product image is required']
  }],
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },

  // ✅ NOW this works
  reviews: [reviewSchema],

  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});


// calculate discount
productSchema.pre('save', function(next) {
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  next();
});

// calculate rating
productSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = (total / this.reviews.length).toFixed(1);
    this.numReviews = this.reviews.length;
  }
  return this.save();
};

// text index
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
