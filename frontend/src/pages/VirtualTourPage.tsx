import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type ExperienceKey = 'tour' | 'video';

const experiences: Record<
  ExperienceKey,
  {
    badge: string;
    title: string;
    description: string;
    cta: string;
    url: string;
    previewImage: string;
    embedTitle: string;
    helperText: string;
  }
> = {
  tour: {
    badge: 'Boutique walk-through',
    title: 'Virtual Tour',
    description:
      'Step inside our showroom and explore the boutique with an immersive 360-degree experience.',
    cta: 'Open Full Tour',
    url: `${process.env.PUBLIC_URL}/virtual-tour/index.htm`,
    previewImage: `${process.env.PUBLIC_URL}/virtual-tour/thumbnail.png`,
    embedTitle: 'The Cotton Butterflies Virtual Tour',
    helperText: 'Move through the boutique with your mouse or finger and explore the shop at your own pace.'
  },
  video: {
    badge: 'Shop video experience',
    title: 'Virtual Video',
    description:
      'Watch the second 3DVista project featuring the shop video experience directly inside the website.',
    cta: 'Open Full Video',
    url: `${process.env.PUBLIC_URL}/virtual-video/index.htm`,
    previewImage: `${process.env.PUBLIC_URL}/virtual-video/thumbnail.png`,
    embedTitle: 'The Cotton Butterflies Virtual Video',
    helperText: 'Play the video-based 3DVista experience for a guided look through the shop.'
  }
};

const VirtualTourPage: React.FC = () => {
  const [activeExperience, setActiveExperience] = useState<ExperienceKey>('tour');
  const currentExperience = experiences[activeExperience];

  return (
    <div className="bg-stone-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.85),_transparent_45%)]" />
        <div className="container-custom relative py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm">
                Explore The Cotton Butterflies
              </span>
              <h1 className="mt-6 text-4xl font-serif font-light leading-tight text-gray-900 md:text-6xl">
                Choose how you want to experience the shop.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
                This section now includes two 3DVista experiences: a full virtual tour and a separate virtual video of the boutique.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveExperience('tour')}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    activeExperience === 'tour'
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  Virtual Tour
                </button>
                <button
                  type="button"
                  onClick={() => setActiveExperience('video')}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    activeExperience === 'video'
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  Virtual Video
                </button>
              </div>

              <div className="mt-8 rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-500">
                  {currentExperience.badge}
                </p>
                <h2 className="mt-3 text-3xl font-serif font-light text-gray-900">
                  {currentExperience.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-gray-600">
                  {currentExperience.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href={currentExperience.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    {currentExperience.cta}
                  </a>
                  <Link
                    to="/shop"
                    className="rounded-full border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
                  >
                    Shop The Collection
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-rose-200/70 blur-2xl" />
              <div className="absolute -bottom-8 right-8 h-28 w-28 rounded-full bg-sky-200/70 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur">
                <img
                  src={currentExperience.previewImage}
                  alt={`${currentExperience.title} preview`}
                  className="h-full w-full rounded-[1.4rem] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-custom py-8 md:py-12">
        <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl">
          <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-serif font-light text-gray-900">{currentExperience.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{currentExperience.helperText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveExperience('tour')}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  activeExperience === 'tour'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                Virtual Tour
              </button>
              <button
                type="button"
                onClick={() => setActiveExperience('video')}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  activeExperience === 'video'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                Virtual Video
              </button>
              <a
                href={currentExperience.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
              >
                Open in New Tab
              </a>
            </div>
          </div>

          <div className="bg-black">
            <iframe
              key={activeExperience}
              title={currentExperience.embedTitle}
              src={currentExperience.url}
              className="h-[70vh] min-h-[560px] w-full border-0"
              allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default VirtualTourPage;
