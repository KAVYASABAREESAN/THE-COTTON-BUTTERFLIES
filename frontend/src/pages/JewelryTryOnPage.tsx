import React from 'react';
import JewelryTryOn from '../components/tryon/JewelryTryOn';
import { usePublicSettings } from '../context/PublicSettingsContext';

const JewelryTryOnPage: React.FC = () => {
  const { settings } = usePublicSettings();

  if (!settings.aiFeatures.virtualTryOnEnabled) {
    return (
      <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
          Virtual try-on is currently disabled by admin.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,188,0.35),_transparent_45%),linear-gradient(180deg,_#fff9f5_0%,_#fff_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-600">Virtual Try-On</p>
          <h1 className="mt-4 text-4xl font-serif font-light text-stone-900 sm:text-5xl">
            Try Earrings and Necklaces Live
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-stone-600">
            Open your camera, pick a design, and preview how each jewelry piece moves with your face in real time.
          </p>
        </div>

        <JewelryTryOn />
      </div>
    </div>
  );
};

export default JewelryTryOnPage;
