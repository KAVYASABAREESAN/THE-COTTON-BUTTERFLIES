import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export interface PublicSettings {
  general: {
    storeName: string;
    email: string;
    phone: string;
    address: string;
    logoUrl: string;
  };
  payment: {
    onlinePaymentEnabled: boolean;
    codEnabled: boolean;
    currency: string;
    currencySymbol: string;
  };
  shipping: {
    deliveryCharges: number;
    freeDeliveryAbove: number;
    estimatedDeliveryTime: string;
    serviceAreas: string[];
  };
  product: {
    sizeSelectionEnabled: boolean;
    stockTrackingEnabled: boolean;
    lowStockAlertEnabled: boolean;
    lowStockThreshold: number;
    defaultCategory: string;
  };
  review: {
    reviewsEnabled: boolean;
    starRatingEnabled: boolean;
    commentsEnabled: boolean;
    autoApproveReviews: boolean;
  };
  support: {
    supportEmail: string;
    autoReplyMessage: string;
    contactFormEnabled: boolean;
  };
  appearance: {
    primaryColor: string;
    darkModeEnabled: boolean;
    fontStyle: string;
  };
  social: {
    instagramUrl: string;
    whatsappNumber: string;
    facebookUrl: string;
  };
  aiFeatures: {
    virtualTryOnEnabled: boolean;
    view3dEnabled: boolean;
    recommendationsEnabled: boolean;
  };
  analytics: {
    salesAnalyticsEnabled: boolean;
    userTrackingEnabled: boolean;
    topProductsEnabled: boolean;
  };
  maintenance: {
    maintenanceModeEnabled: boolean;
    maintenanceMessage: string;
  };
}

const defaultSettings: PublicSettings = {
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

const resolveAssetUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  if (url.startsWith('uploads/')) return `${BACKEND_ORIGIN}/${url}`;
  return url;
};

const colorMap: Record<string, string> = {
  pink: '#ec4899',
  beige: '#d6b48f',
  blue: '#3b82f6',
  green: '#10b981'
};

type PublicSettingsContextValue = {
  settings: PublicSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  resolveAssetUrl: (url?: string) => string;
};

const PublicSettingsContext = createContext<PublicSettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  refresh: async () => {},
  resolveAssetUrl
});

export const PublicSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const response = await settingsService.getPublicSettings();
      if (response?.status === 'success' && response?.data) {
        setSettings((prev) => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch public settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refresh();
    }, 30000);

    const onFocus = () => {
      refresh();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    const primaryColor = colorMap[settings.appearance.primaryColor?.toLowerCase()] || settings.appearance.primaryColor || '#ec4899';
    document.documentElement.style.setProperty('--brand-primary', primaryColor);
    document.body.classList.toggle('theme-dark', Boolean(settings.appearance.darkModeEnabled));
    document.body.classList.toggle('font-serif-theme', settings.appearance.fontStyle?.toLowerCase() === 'serif');
    document.body.classList.toggle('font-sans-theme', settings.appearance.fontStyle?.toLowerCase() === 'sans');
  }, [settings.appearance.darkModeEnabled, settings.appearance.fontStyle, settings.appearance.primaryColor]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refresh,
      resolveAssetUrl
    }),
    [settings, loading]
  );

  return <PublicSettingsContext.Provider value={value}>{children}</PublicSettingsContext.Provider>;
};

export const usePublicSettings = () => useContext(PublicSettingsContext);
