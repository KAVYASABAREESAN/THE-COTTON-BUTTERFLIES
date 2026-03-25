import React from 'react';
import SupportForm from '../components/support/SupportForm';
import { usePublicSettings } from '../context/PublicSettingsContext';

const ContactSupportPage: React.FC = () => {
  const { settings } = usePublicSettings();
  const supportEmail = settings.support.supportEmail || settings.general.email || 'thecottonbutterflieshelpline@gmail.com';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,207,232,0.35),_transparent_38%),linear-gradient(180deg,#fffaf6_0%,#ffffff_42%,#f8fbff_100%)] py-16">
      <div className="container-custom">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-pink-500">
              Customer Care
            </p>
            <h1 className="mt-4 font-serif text-4xl font-light text-gray-900">
              Contact Support
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Send your concern directly to our helpline team and we will respond as quickly as possible.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <SupportForm
              disabled={!settings.support.contactFormEnabled}
              disabledMessage="Contact form is disabled at the moment. Please use helpline email below."
            />

            <aside className="rounded-3xl border border-white/60 bg-white/85 p-8 shadow-xl">
              <h2 className="text-xl font-medium text-gray-900">Helpline details</h2>
              <div className="mt-6 space-y-5 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">Support email</p>
                  <p className="mt-1">{supportEmail}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Best for</p>
                  <p className="mt-1">Order issues, product questions, return support, and general help.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Response window</p>
                  <p className="mt-1">{settings.support.autoReplyMessage || 'We usually review new messages within 24 to 48 hours.'}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPage;
