import React, { useEffect, useState } from 'react';
import { profileService, settingsService, uploadService } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

type SettingsTab =
  | 'general'
  | 'payment'
  | 'shipping'
  | 'product'
  | 'review'
  | 'support'
  | 'security'
  | 'appearance'
  | 'social'
  | 'aiFeatures'
  | 'analytics'
  | 'maintenance';

interface SiteSettings {
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
    razorpayKey: string;
    stripeKey: string;
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
  security: {
    twoStepVerificationEnabled: boolean;
    sessionTimeoutMinutes: number;
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

const DEFAULT_SETTINGS: SiteSettings = {
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
    currencySymbol: 'Rs'
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

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'payment', label: 'Payments' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'product', label: 'Products' },
  { id: 'review', label: 'Reviews' },
  { id: 'support', label: 'Support' },
  { id: 'security', label: 'Security' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'social', label: 'Social' },
  { id: 'aiFeatures', label: 'AI Features' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'maintenance', label: 'Maintenance' }
];

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsService.getAdminSettings();
        if (response?.status === 'success' && response?.data) {
          setSettings((prev) => ({
            ...prev,
            ...response.data
          }));
        }
      } catch (error: any) {
        showErrorToast(error, 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSection = <K extends keyof SiteSettings>(
    section: K,
    key: keyof SiteSettings[K],
    value: SiteSettings[K][keyof SiteSettings[K]]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const response = await uploadService.uploadImages([file], { category: 'branding' });
      const uploadedUrl = response?.urls?.[0]?.url;
      if (!uploadedUrl) {
        throw new Error('Upload did not return a valid URL.');
      }
      updateSection('general', 'logoUrl', uploadedUrl);
      showSuccessToast('Logo uploaded successfully');
    } catch (error: any) {
      showErrorToast(error, 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await settingsService.updateAdminSettings(settings);
      if (response?.status === 'success') {
        showSuccessToast('Settings saved successfully');
      }
    } catch (error: any) {
      showErrorToast(error, 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showErrorToast(new Error('Please fill all password fields.'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showErrorToast(new Error('New password and confirm password do not match.'));
      return;
    }

    try {
      await profileService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showSuccessToast('Password changed successfully');
    } catch (error: any) {
      showErrorToast(error, 'Failed to change password');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading settings...</div>;
  }

  const renderGeneral = () => (
    <div className="space-y-4">
      <Input label="Store Name" value={settings.general.storeName} onChange={(v) => updateSection('general', 'storeName', v)} />
      <Input label="Email" value={settings.general.email} onChange={(v) => updateSection('general', 'email', v)} />
      <Input label="Phone Number" value={settings.general.phone} onChange={(v) => updateSection('general', 'phone', v)} />
      <Input label="Address" value={settings.general.address} onChange={(v) => updateSection('general', 'address', v)} />
      <Input label="Logo URL" value={settings.general.logoUrl} onChange={(v) => updateSection('general', 'logoUrl', v)} />
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Logo Upload</label>
        <input type="file" accept="image/*" onChange={handleLogoUpload} />
        {uploadingLogo && <p className="mt-2 text-xs text-gray-500">Uploading logo...</p>}
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-4">
      <Toggle label="Enable Online Payment" checked={settings.payment.onlinePaymentEnabled} onChange={(v) => updateSection('payment', 'onlinePaymentEnabled', v)} />
      <Toggle label="Enable Cash on Delivery" checked={settings.payment.codEnabled} onChange={(v) => updateSection('payment', 'codEnabled', v)} />
      <Input label="Razorpay API Key" value={settings.payment.razorpayKey} onChange={(v) => updateSection('payment', 'razorpayKey', v)} />
      <Input label="Stripe API Key" value={settings.payment.stripeKey} onChange={(v) => updateSection('payment', 'stripeKey', v)} />
      <Input label="Currency" value={settings.payment.currency} onChange={(v) => updateSection('payment', 'currency', v)} />
      <Input label="Currency Symbol" value={settings.payment.currencySymbol} onChange={(v) => updateSection('payment', 'currencySymbol', v)} />
    </div>
  );

  const renderShipping = () => (
    <div className="space-y-4">
      <NumberInput label="Delivery Charges" value={settings.shipping.deliveryCharges} onChange={(v) => updateSection('shipping', 'deliveryCharges', v)} />
      <NumberInput label="Free Delivery Above" value={settings.shipping.freeDeliveryAbove} onChange={(v) => updateSection('shipping', 'freeDeliveryAbove', v)} />
      <Input label="Estimated Delivery Time" value={settings.shipping.estimatedDeliveryTime} onChange={(v) => updateSection('shipping', 'estimatedDeliveryTime', v)} />
      <Input
        label="Service Areas (comma separated)"
        value={settings.shipping.serviceAreas.join(', ')}
        onChange={(v) => updateSection('shipping', 'serviceAreas', v.split(',').map((area) => area.trim()).filter(Boolean))}
      />
    </div>
  );

  const renderProduct = () => (
    <div className="space-y-4">
      <Toggle label="Enable Size Selection" checked={settings.product.sizeSelectionEnabled} onChange={(v) => updateSection('product', 'sizeSelectionEnabled', v)} />
      <Toggle label="Enable Stock Tracking" checked={settings.product.stockTrackingEnabled} onChange={(v) => updateSection('product', 'stockTrackingEnabled', v)} />
      <Toggle label="Low Stock Alert" checked={settings.product.lowStockAlertEnabled} onChange={(v) => updateSection('product', 'lowStockAlertEnabled', v)} />
      <NumberInput label="Low Stock Threshold" value={settings.product.lowStockThreshold} onChange={(v) => updateSection('product', 'lowStockThreshold', v)} />
      <Input label="Default Category" value={settings.product.defaultCategory} onChange={(v) => updateSection('product', 'defaultCategory', v)} />
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <Toggle label="Enable Reviews" checked={settings.review.reviewsEnabled} onChange={(v) => updateSection('review', 'reviewsEnabled', v)} />
      <Toggle label="Allow Star Rating" checked={settings.review.starRatingEnabled} onChange={(v) => updateSection('review', 'starRatingEnabled', v)} />
      <Toggle label="Allow Comments" checked={settings.review.commentsEnabled} onChange={(v) => updateSection('review', 'commentsEnabled', v)} />
      <Toggle label="Auto-approve Reviews" checked={settings.review.autoApproveReviews} onChange={(v) => updateSection('review', 'autoApproveReviews', v)} />
    </div>
  );

  const renderSupport = () => (
    <div className="space-y-4">
      <Input label="Support Email" value={settings.support.supportEmail} onChange={(v) => updateSection('support', 'supportEmail', v)} />
      <TextArea label="Auto Reply Message" value={settings.support.autoReplyMessage} onChange={(v) => updateSection('support', 'autoReplyMessage', v)} />
      <Toggle label="Enable Contact Form" checked={settings.support.contactFormEnabled} onChange={(v) => updateSection('support', 'contactFormEnabled', v)} />
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <Toggle
        label="Enable 2-Step Verification"
        checked={settings.security.twoStepVerificationEnabled}
        onChange={(v) => updateSection('security', 'twoStepVerificationEnabled', v)}
      />
      <NumberInput
        label="Session Timeout (minutes)"
        value={settings.security.sessionTimeoutMinutes}
        onChange={(v) => updateSection('security', 'sessionTimeoutMinutes', v)}
      />
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">Change Password</p>
        <div className="space-y-3">
          <PasswordInput
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
          />
          <PasswordInput
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
          />
          <PasswordInput
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
          />
          <button
            type="button"
            onClick={changePassword}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-4">
      <Input label="Primary Color" value={settings.appearance.primaryColor} onChange={(v) => updateSection('appearance', 'primaryColor', v)} />
      <Toggle label="Enable Dark Mode" checked={settings.appearance.darkModeEnabled} onChange={(v) => updateSection('appearance', 'darkModeEnabled', v)} />
      <Input label="Font Style" value={settings.appearance.fontStyle} onChange={(v) => updateSection('appearance', 'fontStyle', v)} />
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-4">
      <Input label="Instagram Link" value={settings.social.instagramUrl} onChange={(v) => updateSection('social', 'instagramUrl', v)} />
      <Input label="WhatsApp Number" value={settings.social.whatsappNumber} onChange={(v) => updateSection('social', 'whatsappNumber', v)} />
      <Input label="Facebook Page" value={settings.social.facebookUrl} onChange={(v) => updateSection('social', 'facebookUrl', v)} />
    </div>
  );

  const renderAi = () => (
    <div className="space-y-4">
      <Toggle label="Enable Virtual Try-On" checked={settings.aiFeatures.virtualTryOnEnabled} onChange={(v) => updateSection('aiFeatures', 'virtualTryOnEnabled', v)} />
      <Toggle label="Enable 3D View" checked={settings.aiFeatures.view3dEnabled} onChange={(v) => updateSection('aiFeatures', 'view3dEnabled', v)} />
      <Toggle label="Enable Recommendations" checked={settings.aiFeatures.recommendationsEnabled} onChange={(v) => updateSection('aiFeatures', 'recommendationsEnabled', v)} />
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      <Toggle label="Enable Sales Analytics" checked={settings.analytics.salesAnalyticsEnabled} onChange={(v) => updateSection('analytics', 'salesAnalyticsEnabled', v)} />
      <Toggle label="Enable User Tracking" checked={settings.analytics.userTrackingEnabled} onChange={(v) => updateSection('analytics', 'userTrackingEnabled', v)} />
      <Toggle label="Enable Top Products Display" checked={settings.analytics.topProductsEnabled} onChange={(v) => updateSection('analytics', 'topProductsEnabled', v)} />
    </div>
  );

  const renderMaintenance = () => (
    <div className="space-y-4">
      <Toggle
        label="Enable Maintenance Mode"
        checked={settings.maintenance.maintenanceModeEnabled}
        onChange={(v) => updateSection('maintenance', 'maintenanceModeEnabled', v)}
      />
      <TextArea
        label="Maintenance Message"
        value={settings.maintenance.maintenanceMessage}
        onChange={(v) => updateSection('maintenance', 'maintenanceMessage', v)}
      />
    </div>
  );

  const sectionRenderer: Record<SettingsTab, React.ReactNode> = {
    general: renderGeneral(),
    payment: renderPayment(),
    shipping: renderShipping(),
    product: renderProduct(),
    review: renderReview(),
    support: renderSupport(),
    security: renderSecurity(),
    appearance: renderAppearance(),
    social: renderSocial(),
    aiFeatures: renderAi(),
    analytics: renderAnalytics(),
    maintenance: renderMaintenance()
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
          <p className="text-sm text-gray-600">Control center of the business</p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                activeTab === tab.id ? 'bg-pink-50 text-pink-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">{sectionRenderer[activeTab]}</div>
      </div>
    </div>
  );
};

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-500 focus:outline-none"
    />
  </label>
);

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-500 focus:outline-none"
    />
  </label>
);

const PasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    <input
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-500 focus:outline-none"
    />
  </label>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
  </label>
);

const TextArea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-500 focus:outline-none"
    />
  </label>
);

export default AdminSettings;
