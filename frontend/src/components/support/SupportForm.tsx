import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { supportService } from '../../services/api';
import { showSuccessToast } from '../../utils/toast';

interface SupportFormProps {
  compact?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

const SupportForm: React.FC<SupportFormProps> = ({ compact = false, disabled = false, disabledMessage }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email
    }));
  }, [user]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all fields before sending your message.');
      return;
    }

    try {
      setSubmitting(true);
      await supportService.submitMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });
      showSuccessToast('Your message has been sent to support');
      setFormData((prev) => ({
        ...prev,
        subject: '',
        message: ''
      }));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send support message');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClassName =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100';

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${compact ? '' : 'rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl'}`}>
      {!user && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Log in before sending your message if you want the admin reply to appear as a notification in your account.
        </div>
      )}

      {disabled && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {disabledMessage || 'Support form is currently disabled by admin.'}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
          <input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={inputClassName}
            placeholder="Your name"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={inputClassName}
            placeholder="you@example.com"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
        <input
          value={formData.subject}
          onChange={(e) => updateField('subject', e.target.value)}
          className={inputClassName}
          placeholder="How can we help?"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Message</label>
        <textarea
          rows={6}
          value={formData.message}
          onChange={(e) => updateField('message', e.target.value)}
          className={inputClassName}
          placeholder="Tell us about the issue, order concern, or question you have."
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || disabled}
        className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Sending...' : 'Send to Support'}
      </button>
    </form>
  );
};

export default SupportForm;
