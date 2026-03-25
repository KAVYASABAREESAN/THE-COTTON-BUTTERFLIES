import React, { useEffect, useState } from 'react';
import { BellRing, LifeBuoy, MessageSquareText } from 'lucide-react';
import { supportService } from '../../services/api';

interface SupportMessage {
  _id: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'pending' | 'replied';
  replyViewedAt?: string | null;
  adminReply?: {
    message?: string;
    repliedAt?: string;
    repliedBy?: {
      name?: string;
      email?: string;
    };
  };
}

interface SupportInboxProps {
  onUnreadCountChange?: (count: number) => void;
}

const SupportInbox: React.FC<SupportInboxProps> = ({ onUnreadCountChange }) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = messages.filter((item) => item.adminReply?.message && !item.replyViewedAt).length;

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await supportService.getMyMessages();
      if (response.status === 'success') {
        setMessages(response.data || []);
        onUnreadCountChange?.(response.unreadReplies || 0);
      }
    } catch (error) {
      console.error('Error fetching customer support messages:', error);
      onUnreadCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const openMessage = async (message: SupportMessage) => {
    setExpandedId((current) => (current === message._id ? null : message._id));

    if (message.adminReply?.message && !message.replyViewedAt) {
      try {
        await supportService.markReplyRead(message._id);
        setMessages((current) =>
          current.map((item) =>
            item._id === message._id
              ? { ...item, replyViewedAt: new Date().toISOString() }
              : item
          )
        );
      } catch (error) {
        console.error('Error marking support reply as read:', error);
      }
    }
  };

  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-light text-gray-900">Support Notifications</h2>
          <p className="mt-2 text-sm text-gray-500">
            See your helpline requests and open the full reply from the admin team.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700">
          <BellRing size={16} />
          {unreadCount} unread reply{unreadCount === 1 ? '' : 'ies'}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading your support messages...</div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <LifeBuoy size={30} className="mx-auto mb-4 text-gray-300" />
          <p className="text-base font-medium text-gray-900">No support conversations yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Use the helpline form to send a concern and this section will show admin replies for your account.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const hasReply = Boolean(message.adminReply?.message);
            const isUnread = hasReply && !message.replyViewedAt;
            const isOpen = expandedId === message._id;

            return (
              <article key={message._id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <button
                  type="button"
                  onClick={() => openMessage(message)}
                  className="w-full text-left"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{message.subject}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${hasReply ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {hasReply ? 'Replied' : 'Waiting for admin'}
                        </span>
                        {isUnread && (
                          <span className="rounded-full bg-pink-600 px-3 py-1 text-xs font-medium text-white">
                            New reply
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-gray-500">
                        Sent on {new Date(message.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                      <MessageSquareText size={16} />
                      {isOpen ? 'Hide details' : 'View details'}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-5 space-y-5 border-t border-gray-200 pt-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Your concern
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                        {message.message}
                      </p>
                    </div>

                    {hasReply ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Admin response
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-800">
                          {message.adminReply?.message}
                        </p>
                        <p className="mt-3 text-xs text-emerald-800/80">
                          Replied on {message.adminReply?.repliedAt ? new Date(message.adminReply.repliedAt).toLocaleString('en-IN') : 'just now'}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                        Your request has reached the admin team. A reply will show up here as a notification for your account.
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportInbox;
