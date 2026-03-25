import React, { useEffect, useState } from 'react';
import { LifeBuoy, Mail, Search, Send } from 'lucide-react';
import { supportService } from '../../services/api';
import { showSuccessToast } from '../../utils/toast';

interface SupportMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'replied';
  replyViewedAt?: string | null;
  customer?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  adminReply?: {
    message?: string;
    repliedAt?: string;
    repliedBy?: {
      name?: string;
      email?: string;
    };
  };
}

const AdminSupportMessages: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);

  const fetchMessages = async (searchTerm = '') => {
    try {
      setLoading(true);
      const response = await supportService.getAdminMessages({
        page: 1,
        limit: 50,
        search: searchTerm || undefined
      });
      if (response.status === 'success') {
        setMessages(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async (messageId: string) => {
    const reply = draftReplies[messageId]?.trim();
    if (!reply) {
      return;
    }

    try {
      setSendingReplyId(messageId);
      const response = await supportService.replyToMessage(messageId, reply);
      if (response.status === 'success') {
        setMessages((current) =>
          current.map((item) => (item._id === messageId ? response.data : item))
        );
        setDraftReplies((current) => ({ ...current, [messageId]: '' }));
        showSuccessToast('Reply sent to customer');
      }
    } catch (error) {
      console.error('Error replying to support message:', error);
    } finally {
      setSendingReplyId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-light text-gray-900">Support Messages</h1>
          <p className="mt-2 text-sm text-gray-500">
            Review customer concerns sent to the helpline inbox.
          </p>
        </div>

        <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchMessages(search);
              }
            }}
            placeholder="Search by name, email, or subject"
            className="w-full bg-transparent text-sm text-gray-900 outline-none"
          />
          <button
            type="button"
            onClick={() => fetchMessages(search)}
            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white"
          >
            Search
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading support messages...</div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <LifeBuoy size={28} className="mx-auto mb-3 text-gray-300" />
            No support messages found.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <article key={message._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-medium text-gray-900">{message.subject}</h2>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-5">
                      <span>User: {message.name}</span>
                      <span className="inline-flex items-center gap-2">
                        <Mail size={14} />
                        {message.email}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${message.adminReply?.message ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {message.adminReply?.message ? (message.replyViewedAt ? 'Reply viewed' : 'Reply pending view') : 'Awaiting reply'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {message.message}
                </p>

                {message.adminReply?.message && (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Current admin reply
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-800">
                      {message.adminReply.message}
                    </p>
                    <p className="mt-3 text-xs text-emerald-800/80">
                      Sent {message.adminReply.repliedAt ? new Date(message.adminReply.repliedAt).toLocaleString('en-IN') : ''}
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Reply to this customer
                  </label>
                  <textarea
                    rows={4}
                    value={draftReplies[message._id] ?? message.adminReply?.message ?? ''}
                    onChange={(e) =>
                      setDraftReplies((current) => ({
                        ...current,
                        [message._id]: e.target.value
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    placeholder="Type the response that should reach this customer"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleReply(message._id)}
                      disabled={sendingReplyId === message._id}
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={15} />
                      {sendingReplyId === message._id ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportMessages;
