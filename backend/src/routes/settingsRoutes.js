const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

const DEFAULT_SETTINGS = {
  general: {
    storeName: 'The Cotton Butterflies',
    email: 'thecottonbutterflieshelpline@gmail.com',
    phone: '',
    address: '',
    logoUrl: ''
  },
  payment: {
    onlinePaymentEnabled: true,
    codEnabled: true,
    razorpayKey: '',
    stripeKey: '',
    currency: 'INR',
    currencySymbol: '₹'
  },
  shipping: {
    deliveryCharges: 50,
    freeDeliveryAbove: 999,
    estimatedDeliveryTime: '3-5 days',
    serviceAreas: ['India']
  },
  product: {
    sizeSelectionEnabled: true,
    stockTrackingEnabled: true,
    lowStockAlertEnabled: true,
    lowStockThreshold: 10,
    defaultCategory: 'women'
  },
  review: {
    reviewsEnabled: true,
    starRatingEnabled: true,
    commentsEnabled: true,
    autoApproveReviews: true
  },
  support: {
    supportEmail: 'thecottonbutterflieshelpline@gmail.com',
    autoReplyMessage: 'Thank you for contacting Cotton Butterflies. We will respond within 24 hours.',
    contactFormEnabled: true
  },
  security: {
    twoStepVerificationEnabled: false,
    sessionTimeoutMinutes: 60
  },
  appearance: {
    primaryColor: 'pink',
    darkModeEnabled: false,
    fontStyle: 'serif'
  },
  social: {
    instagramUrl: '',
    whatsappNumber: '',
    facebookUrl: ''
  },
  aiFeatures: {
    virtualTryOnEnabled: true,
    view3dEnabled: true,
    recommendationsEnabled: true
  },
  analytics: {
    salesAnalyticsEnabled: true,
    userTrackingEnabled: true,
    topProductsEnabled: true
  },
  maintenance: {
    maintenanceModeEnabled: false,
    maintenanceMessage: 'Site under maintenance'
  }
};

const mergeSettings = (current = {}, incoming = {}) => {
  const merged = { ...current };

  Object.keys(incoming || {}).forEach((sectionKey) => {
    const incomingSection = incoming[sectionKey];
    if (incomingSection && typeof incomingSection === 'object' && !Array.isArray(incomingSection)) {
      merged[sectionKey] = {
        ...(current[sectionKey] || {}),
        ...incomingSection
      };
    } else {
      merged[sectionKey] = incomingSection;
    }
  });

  return merged;
};

const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne({});
  if (!settings) {
    settings = await SiteSettings.create(DEFAULT_SETTINGS);
  }
  return settings;
};

router.get('/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    res.json({
      status: 'success',
      data: {
        general: settings.general,
        payment: {
          onlinePaymentEnabled: settings.payment?.onlinePaymentEnabled,
          codEnabled: settings.payment?.codEnabled,
          currency: settings.payment?.currency,
          currencySymbol: settings.payment?.currencySymbol
        },
        shipping: settings.shipping,
        product: settings.product,
        review: settings.review,
        support: settings.support,
        appearance: settings.appearance,
        social: settings.social,
        aiFeatures: settings.aiFeatures,
        analytics: settings.analytics,
        maintenance: settings.maintenance
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load public settings',
      error: error.message
    });
  }
});

router.get('/admin', protect, admin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    res.json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load admin settings',
      error: error.message
    });
  }
});

router.put('/admin', protect, admin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const merged = mergeSettings(settings.toObject(), req.body || {});

    Object.keys(DEFAULT_SETTINGS).forEach((sectionKey) => {
      if (Object.prototype.hasOwnProperty.call(merged, sectionKey)) {
        settings[sectionKey] = merged[sectionKey];
      }
    });

    await settings.save();

    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

module.exports = router;
