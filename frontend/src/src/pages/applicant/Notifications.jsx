import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Clock3,
  RefreshCw,
  AlertCircle,
  Inbox,
  Loader2,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Notifications = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/applicant/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setNotifications(
        Array.isArray(data) ? data : data?.data || []
      );
    } catch (err) {
      console.error('Failed to load notifications:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load notifications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    loadNotifications();
  }, [token]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccess('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [success]);

  const markAsRead = async (notificationId) => {
    try {
      setError('');

      await api.put(
        `/applicant/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

      setSuccess('Notification marked as read.');
    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to mark notification as read.'
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      setError('');

      await api.put(
        '/applicant/notifications/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
          read_at:
            notification.read_at ||
            new Date().toISOString(),
        }))
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

      setSuccess('All notifications marked as read.');
    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to mark all notifications as read.'
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      setError('');

      await api.delete(
        `/applicant/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== notificationId
        )
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

      setSuccess('Notification deleted.');
    } catch (err) {
      console.error(
        'Failed to delete notification:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete notification.'
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Unknown date';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Unknown date';
    }

    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.is_read
      ).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto page-transition">
        {/* Hero Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 lg:p-8 mb-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-slate-800" />

            <div className="flex-1">
              <div className="h-3 w-28 bg-gray-200 dark:bg-slate-800 rounded mb-3" />
              <div className="h-8 w-52 bg-gray-200 dark:bg-slate-800 rounded mb-3" />
              <div className="h-4 w-80 max-w-full bg-gray-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-slate-800" />

                <div>
                  <div className="h-3 w-28 bg-gray-200 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-7 w-12 bg-gray-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notification Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-slate-800 shrink-0" />

                <div className="flex-1">
                  <div className="h-5 w-56 bg-gray-200 dark:bg-slate-800 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-800 rounded mb-4" />
                  <div className="h-3 w-40 bg-gray-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto page-transition pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#123B5D] rounded-2xl shadow-md mb-6">
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-28 right-28 w-64 h-64 rounded-full bg-[#F4B400]/10" />
        <div className="absolute top-10 right-10 w-20 h-20 rounded-full border border-white/5" />

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Bell
                  size={28}
                  className="text-[#F4B400]"
                />
              </div>

              <div>
                <p className="text-[#F4B400] text-xs sm:text-sm font-bold uppercase tracking-wider">
                  Stay Updated
                </p>

                <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                  Notifications
                </h1>

                <p className="text-white/70 mt-2 text-sm lg:text-base max-w-2xl leading-relaxed">
                  Stay updated with your admission,
                  scholarship, and examination activities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadNotifications(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing ? 'animate-spin' : ''
                  }
                />
                Refresh
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center justify-center gap-2 bg-[#F4B400] hover:bg-[#D9A900] text-[#123B5D] px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <CheckCheck size={17} />
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-2xl p-4 flex items-start gap-3 animate-fade-up">
          <CheckCircle2
            size={20}
            className="text-green-600 dark:text-green-400 mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold text-green-700 dark:text-green-300">
              Success
            </p>

            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 flex items-start gap-3 animate-fade-up">
          <AlertCircle
            size={20}
            className="text-red-600 dark:text-red-400 mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold text-red-700 dark:text-red-300">
              Something went wrong
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            aria-label="Dismiss error"
          >
            <span className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 ep-hover-lift">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-[#123B5D]/30 flex items-center justify-center">
              <Inbox
                size={21}
                className="text-[#123B5D] dark:text-blue-300"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Total Notifications
              </p>

              <p className="text-2xl font-bold text-[#123B5D] dark:text-white">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        {/* Unread */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 ep-hover-lift">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Bell
                size={21}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Unread
              </p>

              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        {/* Read */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 ep-hover-lift">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle2
                size={21}
                className="text-green-600 dark:text-green-400"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Read
              </p>

              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {readCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 lg:p-14 text-center animate-fade-up">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-[#123B5D]/10 dark:bg-[#123B5D]/30 flex items-center justify-center mb-5">
            <Bell
              size={36}
              className="text-[#123B5D] dark:text-blue-300"
            />
          </div>

          <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
            No Notifications
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            You don't have any notifications yet.
            We'll let you know when there are updates
            regarding your application.
          </p>

          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="mt-6 inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={17} />
            )}
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div>
              <h2 className="text-lg font-bold text-[#123B5D] dark:text-white">
                Recent Notifications
              </h2>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Your latest EduPath updates
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                {unreadCount} unread
              </span>

              <button
                type="button"
                onClick={() => loadNotifications(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 text-[#123B5D] dark:text-blue-300 hover:text-[#0F3553] dark:hover:text-blue-200 text-sm font-semibold transition disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing ? 'animate-spin' : ''
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </div>

          {/* Notification Cards */}
          {notifications.map((notification, index) => {
            const isUnread = !notification.is_read;

            return (
              <div
                key={notification.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200 hover:shadow-md ep-hover-lift animate-fade-up ${
                  isUnread
                    ? 'border-[#123B5D]/20 dark:border-blue-900/60'
                    : 'border-gray-100 dark:border-slate-800'
                }`}
                style={{
                  animationDelay: `${index * 60}ms`,
                }}
              >
                {/* Status Bar */}
                <div
                  className={`h-1 ${
                    isUnread
                      ? 'bg-[#F4B400]'
                      : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                />

                <div className="p-5 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    {/* Content */}
                    <div className="flex gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isUnread
                            ? 'bg-[#123B5D] text-[#F4B400]'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        <Bell size={20} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-lg ${
                              isUnread
                                ? 'font-bold text-[#123B5D] dark:text-white'
                                : 'font-semibold text-gray-700 dark:text-slate-200'
                            }`}
                          >
                            {notification.title ||
                              'Notification'}
                          </h3>

                          {isUnread && (
                            <span className="inline-flex items-center gap-1.5 bg-[#F4B400]/15 dark:bg-[#F4B400]/10 text-[#9A7300] dark:text-[#F4B400] text-xs font-bold px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B400]" />
                              New
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                          {notification.message ||
                            notification.body ||
                            'No message available.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-gray-400 dark:text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock3 size={15} />

                            <span>
                              {formatDate(
                                notification.created_at
                              )}
                            </span>
                          </div>

                          {notification.read_at && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle2 size={15} />

                              <span>
                                Read
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:pt-1">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() =>
                            markAsRead(notification.id)
                          }
                          className="flex items-center gap-2 bg-[#123B5D]/5 dark:bg-[#123B5D]/30 hover:bg-[#123B5D] text-[#123B5D] dark:text-blue-300 hover:text-white border border-[#123B5D]/10 dark:border-blue-900/50 hover:border-[#123B5D] px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          <CheckCheck size={16} />

                          <span className="hidden sm:inline">
                            Mark as Read
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          deleteNotification(
                            notification.id
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-950/30 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-100 dark:border-red-900/40 hover:border-red-600 rounded-xl transition-colors"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Back to Dashboard */}
      <button
        type="button"
        onClick={() =>
          navigate('/applicant/dashboard')
        }
        className="mt-8 inline-flex items-center gap-2 text-[#123B5D] dark:text-blue-300 hover:text-[#0F3553] dark:hover:text-blue-200 font-semibold text-sm transition"
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>
    </div>
  );
};

export default Notifications;