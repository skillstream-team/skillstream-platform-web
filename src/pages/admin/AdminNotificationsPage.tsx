import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth';
import {
  sendAdminNotification,
  sendAdminNotificationToAll,
  sendPromotionalEmail,
  sendPromotionalEmailToAll
} from '../../services/api';
import { Megaphone, Mail, Users, AlertCircle } from 'lucide-react';

export const AdminNotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [notificationForm, setNotificationForm] = useState({
    userIds: '',
    userEmails: '',
    title: '',
    message: '',
    type: 'INFO',
    sendEmail: true,
    link: ''
  });
  const [promoForm, setPromoForm] = useState({
    userIds: '',
    userEmails: '',
    subject: '',
    content: '',
    ctaText: '',
    ctaLink: ''
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-gray-900">Access denied</h1>
          <p className="text-gray-600 text-sm">
            You must be an administrator to view this page.
          </p>
        </div>
      </div>
    );
  }

  const parseList = (value: string) =>
    value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

  const handleNotificationSubmit = async (e: React.FormEvent, sendToAll: boolean) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type || undefined,
        sendEmail: notificationForm.sendEmail,
        link: notificationForm.link || undefined
      };
      if (!sendToAll) {
        const userIds = parseList(notificationForm.userIds);
        const userEmails = parseList(notificationForm.userEmails);
        if (userIds.length) payload.userIds = userIds;
        if (userEmails.length) payload.userEmails = userEmails;
        await sendAdminNotification(payload);
      } else {
        await sendAdminNotificationToAll(payload);
      }
      setStatus('Notification sent successfully.');
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoSubmit = async (e: React.FormEvent, sendToAll: boolean) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: any = {
        subject: promoForm.subject,
        content: promoForm.content,
        ctaText: promoForm.ctaText || undefined,
        ctaLink: promoForm.ctaLink || undefined
      };
      if (!sendToAll) {
        const userIds = parseList(promoForm.userIds);
        const userEmails = parseList(promoForm.userEmails);
        if (userIds.length) payload.userIds = userIds;
        if (userEmails.length) payload.userEmails = userEmails;
        await sendPromotionalEmail(payload);
      } else {
        await sendPromotionalEmailToAll(payload);
      }
      setStatus('Promotional email sent successfully.');
    } catch (err) {
      console.error('Error sending promotional email:', err);
      setError('Failed to send promotional email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#00B5AD]" />
            Admin Communications
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Send in-app notifications and promotional emails to users across the platform.
          </p>
        </div>

        {(status || error) && (
          <div
            className={`mb-6 p-3 rounded-md text-sm ${
              status
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {status || error}
          </div>
        )}

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-[#00B5AD]" />
            <h2 className="text-lg font-semibold text-gray-900">System Notifications</h2>
          </div>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={(e) => handleNotificationSubmit(e, false)}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User IDs (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={notificationForm.userIds}
                  onChange={(e) =>
                    setNotificationForm(prev => ({ ...prev, userIds: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="e.g. user1,user2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User emails (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={notificationForm.userEmails}
                  onChange={(e) =>
                    setNotificationForm(prev => ({ ...prev, userEmails: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="e.g. a@example.com,b@example.com"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={notificationForm.title}
                  onChange={(e) =>
                    setNotificationForm(prev => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="Notification title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={notificationForm.message}
                  onChange={(e) =>
                    setNotificationForm(prev => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD] min-h-[80px]"
                  placeholder="Short message to display in-app"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="sendEmail"
                    type="checkbox"
                    checked={notificationForm.sendEmail}
                    onChange={(e) =>
                      setNotificationForm(prev => ({ ...prev, sendEmail: e.target.checked }))
                    }
                    className="h-4 w-4 text-[#00B5AD] border-gray-300 rounded"
                  />
                  <label htmlFor="sendEmail" className="text-sm text-gray-700">
                    Also send as email
                  </label>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleNotificationSubmit(e as any, true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
                >
                  Send to all users
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional deep link
                </label>
                <input
                  type="text"
                  value={notificationForm.link}
                  onChange={(e) =>
                    setNotificationForm(prev => ({ ...prev, link: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="/courses/123 or https://..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#00B5AD] hover:bg-[#009b94] disabled:opacity-60"
                >
                  Send notification
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Promotional Emails */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-[#00B5AD]" />
            <h2 className="text-lg font-semibold text-gray-900">Promotional Emails</h2>
          </div>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={(e) => handlePromoSubmit(e, false)}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User IDs (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={promoForm.userIds}
                  onChange={(e) =>
                    setPromoForm(prev => ({ ...prev, userIds: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="Targeted user IDs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User emails (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={promoForm.userEmails}
                  onChange={(e) =>
                    setPromoForm(prev => ({ ...prev, userEmails: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="Targeted email addresses"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={promoForm.subject}
                  onChange={(e) =>
                    setPromoForm(prev => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                  placeholder="Email subject line"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={promoForm.content}
                  onChange={(e) =>
                    setPromoForm(prev => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD] min-h-[80px]"
                  placeholder="Promotional email body"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Text (optional)
                  </label>
                  <input
                    type="text"
                    value={promoForm.ctaText}
                    onChange={(e) =>
                      setPromoForm(prev => ({ ...prev, ctaText: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                    placeholder="e.g. View course"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Link (optional)
                  </label>
                  <input
                    type="text"
                    value={promoForm.ctaLink}
                    onChange={(e) =>
                      setPromoForm(prev => ({ ...prev, ctaLink: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#00B5AD] focus:border-[#00B5AD]"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={(e) => handlePromoSubmit(e as any, true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
                >
                  Send to all users
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#00B5AD] hover:bg-[#009b94] disabled:opacity-60"
                >
                  Send promotional email
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


