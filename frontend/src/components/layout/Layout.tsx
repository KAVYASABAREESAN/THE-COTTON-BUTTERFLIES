import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { usePublicSettings } from '../../context/PublicSettingsContext';

const Layout: React.FC = () => {
  const { settings, loading } = usePublicSettings();
  const maintenanceModeEnabled = Boolean(settings.maintenance?.maintenanceModeEnabled);
  const maintenanceMessage = settings.maintenance?.maintenanceMessage || 'Site under maintenance';

  if (loading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (maintenanceModeEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-serif font-semibold text-gray-900">Site under maintenance</h1>
          <p className="mt-4 text-gray-600">{maintenanceMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Outlet /> {/* This is where pages will render */}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
