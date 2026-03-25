const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    general: {
      storeName: { type: String, default: 'The Cotton Butterflies' },
      email: { type: String, default: 'thecottonbutterflieshelpline@gmail.com' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      logoUrl: { type: String, default: '' }
    },
    payment: {
      onlinePaymentEnabled: { type: Boolean, default: true },
      codEnabled: { type: Boolean, default: true },
      razorpayKey: { type: String, default: '' },
      stripeKey: { type: String, default: '' },
      currency: { type: String, default: 'INR' },
      currencySymbol: { type: String, default: '₹' }
    },
    shipping: {
      deliveryCharges: { type: Number, default: 50, min: 0 },
      freeDeliveryAbove: { type: Number, default: 999, min: 0 },
      estimatedDeliveryTime: { type: String, default: '3-5 days' },
      serviceAreas: { type: [String], default: ['India'] }
    },
    product: {
      sizeSelectionEnabled: { type: Boolean, default: true },
      stockTrackingEnabled: { type: Boolean, default: true },
      lowStockAlertEnabled: { type: Boolean, default: true },
      lowStockThreshold: { type: Number, default: 10, min: 0 },
      defaultCategory: { type: String, default: 'women' }
    },
    review: {
      reviewsEnabled: { type: Boolean, default: true },
      starRatingEnabled: { type: Boolean, default: true },
      commentsEnabled: { type: Boolean, default: true },
      autoApproveReviews: { type: Boolean, default: true }
    },
    support: {
      supportEmail: { type: String, default: 'thecottonbutterflieshelpline@gmail.com' },
      autoReplyMessage: {
        type: String,
        default: 'Thank you for contacting Cotton Butterflies. We will respond within 24 hours.'
      },
      contactFormEnabled: { type: Boolean, default: true }
    },
    security: {
      twoStepVerificationEnabled: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 60, min: 5 }
    },
    appearance: {
      primaryColor: { type: String, default: 'pink' },
      darkModeEnabled: { type: Boolean, default: false },
      fontStyle: { type: String, default: 'serif' }
    },
    social: {
      instagramUrl: { type: String, default: '' },
      whatsappNumber: { type: String, default: '' },
      facebookUrl: { type: String, default: '' }
    },
    aiFeatures: {
      virtualTryOnEnabled: { type: Boolean, default: true },
      view3dEnabled: { type: Boolean, default: true },
      recommendationsEnabled: { type: Boolean, default: true }
    },
    analytics: {
      salesAnalyticsEnabled: { type: Boolean, default: true },
      userTrackingEnabled: { type: Boolean, default: true },
      topProductsEnabled: { type: Boolean, default: true }
    },
    maintenance: {
      maintenanceModeEnabled: { type: Boolean, default: false },
      maintenanceMessage: { type: String, default: 'Site under maintenance' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
