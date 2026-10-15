import { useEffect, useState } from 'react';

import {
  Search,
  Bell,
  Send,
  Trash2,
  X,
  CheckCircle2,
  User,
  RefreshCw,
  Filter,
  ShieldCheck,
  Mail,
  Clock3,
  AlertCircle,
} from 'lucide-react';

import api from '../../services/api';
import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import { useAuth } from '../../context/AuthContext';

const StatusBadge = ({ isRead }) => {
  if (isRead) {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          px-3
          py-1.5
          rounded-full
          text-xs
          font-bold
          bg-emerald-50
          text-emerald-700
          dark:bg-emerald-500/10
          dark:text-emerald-300
        "
      >
        <CheckCircle2 size={13} />
        Read
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1.5
        rounded-full
        text-xs
        font-bold
        bg-blue-50
        text-blue-700
        dark:bg-blue-500/10
        dark:text-blue-300
      "
    >
      <Bell size={13} />
      Unread
    </span>
  );
};

const StaffNotifications = ({ confirm }) => {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState(null);

  const [form, setForm] = useState({
    applicant_id: '',
    title: '',
    message: '',
  });

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/staff/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(response.data?.data || []);
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
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // =====================================================
  // FORM
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      applicant_id: '',
      title: '',
      message: '',
    });
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  // =====================================================
  // SEND NOTIFICATION
  // =====================================================

  const sendNotification = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const response = await api.post(
        '/staff/notifications',
        {
          applicant_id: Number(form.applicant_id),
          title: form.title,
          message: form.message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newNotification = response.data?.data;

      if (newNotification) {
        setNotifications((current) => [
          newNotification,
          ...current,
        ]);
      }

      closeForm();

      alert('Notification sent successfully.');
    } catch (err) {
      console.error('Failed to send notification:', err);

      alert(
        err.response?.data?.message ||
          'Failed to send notification.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const deleteNotification = async (notification) => {
    const confirmed = await confirm({
      title: 'Delete Notification',
      message: 'Are you sure you want to delete this notification?',
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/staff/notifications/${notification.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.filter(
          (item) => item.id !== notification.id
        )
      );

      if (
        selectedNotification?.id ===
        notification.id
      ) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error(
        'Failed to delete notification:',
        err
      );

      alert(
        err.response?.data?.message ||
          'Failed to delete notification.'
      );
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getApplicantName = (notification) => {
    const applicant = notification.user?.applicant;

    if (!applicant) {
      return (
        notification.user?.name ||
        'Applicant'
      );
    }

    return [
      applicant.first_name,
      applicant.middle_name,
      applicant.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getApplicantEmail = (notification) => {
    return (
      notification.user?.email ||
      'No email available'
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Unknown date';
    }

    return new Date(date).toLocaleString(
      undefined,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  // =====================================================
  // FILTERING
  // =====================================================

  const filteredNotifications =
    notifications.filter((notification) => {
      const searchValue = search
        .toLowerCase()
        .trim();

      const title = (
        notification.title || ''
      ).toLowerCase();

      const message = (
        notification.message || ''
      ).toLowerCase();

      const applicantName =
        getApplicantName(
          notification
        ).toLowerCase();

      const applicantEmail =
        getApplicantEmail(
          notification
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        message.includes(searchValue) ||
        applicantName.includes(
          searchValue
        ) ||
        applicantEmail.includes(
          searchValue
        );

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' &&
          notification.is_read) ||
        (statusFilter === 'unread' &&
          !notification.is_read);

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  const readCount =
    notifications.filter(
      (notification) =>
        notification.is_read
    ).length;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const openNotification = (
    notification
  ) => {
    setSelectedNotification(
      notification
    );
  };

  const closeNotification = () => {
    setSelectedNotification(null);
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-7 page-transition">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-2xl
          ep-brand-gradient
          shadow-lg
          p-6
          sm:p-8
          animate-fade-up
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-20
            w-56
            h-56
            rounded-full
            bg-white/5
            animate-float
          "
        />

        <div
          className="
            absolute
            right-32
            -bottom-28
            w-48
            h-48
            rounded-full
            bg-[#F4B400]/10
          "
        />

        <div className="relative z-10">
          <div
            className="
              inline-flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              bg-white/10
              border
              border-white/10
              text-blue-100
              text-[10px]
              font-bold
              uppercase
              tracking-[0.16em]
              mb-4
            "
          >
            <ShieldCheck size={13} />
            Staff Communications
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Notifications
              </h1>

              <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
                Send important messages and updates
                to applicants in your assigned programs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  fetchNotifications(true)
                }
                disabled={refreshing}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-white/10
                  hover:bg-white/20
                  border
                  border-white/10
                  text-white
                  text-sm
                  font-semibold
                  backdrop-blur-sm
                  transition-colors
                  disabled:opacity-60
                "
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>

              <button
                type="button"
                onClick={openCreateForm}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-[#F4B400]
                  hover:bg-[#E0A500]
                  text-[#123B5D]
                  text-sm
                  font-extrabold
                  shadow-md
                  transition-colors
                "
              >
                <Send size={17} />
                Send Notification
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '40ms',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Total Sent
              </p>

              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                {notifications.length}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Notifications sent
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center">
              <Send size={22} />
            </div>
          </div>
        </div>

        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '80ms',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Unread
              </p>

              <p className="text-3xl font-extrabold text-[#123B5D] dark:text-sky-300 mt-2">
                {unreadCount}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Awaiting applicant reading
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center">
              <Bell size={23} />
            </div>
          </div>
        </div>

        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '120ms',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Read
              </p>

              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {readCount}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Read by applicants
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={23} />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="
            ep-card
            border-red-200
            dark:border-red-900/50
            p-4
            flex
            items-start
            gap-3
            animate-scale-in
          "
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertCircle
              size={19}
              className="text-red-500"
            />
          </div>

          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">
              Unable to load notifications
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SEARCH / FILTER
      ===================================================== */}

      <section
        className="
          ep-card
          p-4
          sm:p-5
          animate-fade-up
        "
        style={{
          animationDelay: '160ms',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter
            size={17}
            className="text-[#0F766E] dark:text-teal-400"
          />

          <div>
            <h2 className="font-bold text-gray-800 dark:text-gray-100">
              Search & Filter
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Find notifications by applicant, title, or message.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={19}
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search applicant, title, message, or email..."
              className="
                w-full
                pl-11
                pr-4
                py-3
                border
                border-gray-200
                dark:border-gray-700
                rounded-xl
                bg-gray-50
                dark:bg-[#142738]
                text-gray-800
                dark:text-gray-100
                text-sm
                outline-none
                focus:border-[#0F766E]
                dark:focus:border-teal-400
                focus:ring-4
                focus:ring-[#0F766E]/10
              "
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="
              lg:w-48
              px-4
              py-3
              border
              border-gray-200
              dark:border-gray-700
              rounded-xl
              bg-gray-50
              dark:bg-[#142738]
              text-gray-800
              dark:text-gray-100
              text-sm
              outline-none
              focus:border-[#0F766E]
              dark:focus:border-teal-400
              focus:ring-4
              focus:ring-[#0F766E]/10
            "
          >
            <option value="all">
              All Notifications
            </option>

            <option value="unread">
              Unread
            </option>

            <option value="read">
              Read
            </option>
          </select>

          {(search ||
            statusFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                border
                border-gray-200
                dark:border-gray-700
                text-gray-600
                dark:text-gray-300
                text-sm
                font-semibold
                hover:bg-gray-50
                dark:hover:bg-gray-800
                transition-colors
              "
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* =====================================================
          NOTIFICATION LIST
      ===================================================== */}

      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '200ms',
        }}
      >
        <div
          className="
            p-5
            sm:p-6
            border-b
            border-gray-100
            dark:border-gray-800
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
          "
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0F766E]/10 dark:bg-teal-400/10 flex items-center justify-center">
              <Bell
                size={21}
                className="text-[#0F766E] dark:text-teal-300"
              />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123B5D] dark:text-sky-300">
                Notification Center
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredNotifications.length}{' '}
                notification
                {filteredNotifications.length !== 1
                  ? 's'
                  : ''}{' '}
                displayed
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 text-xs font-bold">
            <ShieldCheck size={14} />
            Program Scoped
          </div>
        </div>

        {loading ? (
          <div className="p-5 sm:p-6 space-y-4">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    border
                    border-gray-100
                    dark:border-gray-800
                    rounded-2xl
                    p-5
                  "
                >
                  <div className="flex items-start gap-4">
                    <div className="ep-skeleton w-11 h-11 rounded-xl shrink-0" />

                    <div className="flex-1">
                      <div className="ep-skeleton h-4 w-48 mb-3" />
                      <div className="ep-skeleton h-3 w-36 mb-3" />
                      <div className="ep-skeleton h-3 w-full max-w-xl mb-2" />
                      <div className="ep-skeleton h-3 w-3/4 mb-3" />
                      <div className="ep-skeleton h-3 w-28" />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 sm:p-14 text-center">
            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-gray-100
                dark:bg-gray-800
                flex
                items-center
                justify-center
                mx-auto
                mb-4
                animate-float
              "
            >
              <Bell
                size={28}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Notifications Found
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {search ||
              statusFilter !== 'all'
                ? 'Try adjusting your search or filter settings.'
                : 'Notifications sent to applicants will appear here.'}
            </p>

            {search ||
            statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-[#0F766E]
                  dark:text-teal-300
                  hover:underline
                "
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateForm}
                className="
                  mt-5
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-[#123B5D]
                  text-white
                  text-sm
                  font-bold
                  hover:bg-[#0F3553]
                  transition-colors
                "
              >
                <Send size={16} />
                Send Notification
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-3">
            {filteredNotifications.map(
              (notification) => (
                <article
                  key={notification.id}
                  className="
                    border
                    border-gray-100
                    dark:border-gray-800
                    rounded-2xl
                    p-4
                    sm:p-5
                    hover:border-[#0F766E]/30
                    dark:hover:border-teal-400/30
                    hover:shadow-md
                    transition-colors
                  "
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex gap-4 min-w-0">
                      <div
                        className={`
                          w-11
                          h-11
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          shrink-0
                          ${
                            notification.is_read
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              : 'bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300'
                          }
                        `}
                      >
                        <Bell size={21} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </h3>

                          <StatusBadge
                            isRead={
                              notification.is_read
                            }
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1.5">
                            <User size={15} />

                            To:{' '}

                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {getApplicantName(
                                notification
                              )}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Mail size={14} />

                            {getApplicantEmail(
                              notification
                            )}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 whitespace-pre-line leading-6 line-clamp-3">
                          {notification.message}
                        </p>

                        <p className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-3">
                          <Clock3 size={13} />

                          Sent{' '}

                          {formatDate(
                            notification.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openNotification(
                            notification
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          px-3.5
                          py-2
                          rounded-lg
                          border
                          border-gray-200
                          dark:border-gray-700
                          text-gray-700
                          dark:text-gray-300
                          text-sm
                          font-semibold
                          hover:bg-gray-50
                          dark:hover:bg-gray-800
                          transition-colors
                        "
                      >
                        <Bell size={15} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteNotification(
                            notification
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          px-3.5
                          py-2
                          rounded-lg
                          bg-red-50
                          dark:bg-red-500/10
                          text-red-700
                          dark:text-red-300
                          text-sm
                          font-semibold
                          hover:bg-red-100
                          dark:hover:bg-red-500/20
                          transition-colors
                        "
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          SEND NOTIFICATION MODAL
      ===================================================== */}

      {showForm && (
        <ModalPortal
          onEscape={() => {
            if (!saving) closeForm();
          }}
        >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Send Notification"
          tabIndex={-1}
          className="
            fixed
            inset-0
            z-[100]
            bg-black/60
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
            animate-scale-in
          "
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="
              bg-white
              dark:bg-[#0F1F2D]
              w-full
              max-w-xl
              max-h-[92vh]
              overflow-y-auto
              rounded-2xl
              shadow-2xl
              border
              border-gray-200
              dark:border-gray-700
            "
          >
            <div
              className="
                sticky
                top-0
                z-10
                px-5
                sm:px-6
                py-5
                bg-white
                dark:bg-[#0F1F2D]
                border-b
                border-gray-100
                dark:border-gray-800
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Send
                    size={17}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Staff Communication
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Send Notification
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Send an important message to an applicant.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:text-gray-700
                  dark:hover:text-gray-200
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition-colors
                  disabled:opacity-50
                "
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={sendNotification}
              className="p-5 sm:p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Applicant ID
                </label>

                <div className="relative">
                  <User
                    size={17}
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="number"
                    name="applicant_id"
                    value={
                      form.applicant_id
                    }
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Enter applicant ID"
                    className="
                      w-full
                      pl-10
                      pr-4
                      py-3
                      border
                      border-gray-200
                      dark:border-gray-700
                      rounded-xl
                      bg-gray-50
                      dark:bg-[#142738]
                      text-gray-800
                      dark:text-gray-100
                      outline-none
                      focus:border-[#0F766E]
                      dark:focus:border-teal-400
                      focus:ring-4
                      focus:ring-[#0F766E]/10
                    "
                  />
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Only applicants belonging to your assigned programs can be notified.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Notification Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter notification title"
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    bg-gray-50
                    dark:bg-[#142738]
                    text-gray-800
                    dark:text-gray-100
                    outline-none
                    focus:border-[#0F766E]
                    dark:focus:border-teal-400
                    focus:ring-4
                    focus:ring-[#0F766E]/10
                  "
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={7}
                  placeholder="Write your notification..."
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    bg-gray-50
                    dark:bg-[#142738]
                    text-gray-800
                    dark:text-gray-100
                    resize-none
                    outline-none
                    leading-relaxed
                    focus:border-[#0F766E]
                    dark:focus:border-teal-400
                    focus:ring-4
                    focus:ring-[#0F766E]/10
                  "
                />
              </div>

              <div
                className="
                  rounded-xl
                  border
                  border-[#0F766E]/20
                  dark:border-teal-400/20
                  bg-[#0F766E]/5
                  dark:bg-teal-400/5
                  p-4
                "
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0F766E]/10 dark:bg-teal-400/10 flex items-center justify-center shrink-0">
                    <ShieldCheck
                      size={17}
                      className="text-[#0F766E] dark:text-teal-300"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      Program-scoped notification
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      The backend will verify that the selected applicant belongs to one of your assigned academic programs.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  sm:justify-end
                  gap-3
                  pt-2
                "
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="
                    px-5
                    py-2.5
                    rounded-xl
                    border
                    border-gray-200
                    dark:border-gray-700
                    text-gray-700
                    dark:text-gray-300
                    font-semibold
                    text-sm
                    hover:bg-gray-50
                    dark:hover:bg-gray-800
                    transition-colors
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-5
                    py-2.5
                    rounded-xl
                    bg-[#123B5D]
                    hover:bg-[#0F3553]
                    text-white
                    font-bold
                    text-sm
                    shadow-md
                    transition-colors
                    disabled:opacity-60
                  "
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* =====================================================
          VIEW NOTIFICATION MODAL
      ===================================================== */}

      {selectedNotification && (
        <ModalPortal onEscape={closeNotification}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notification Details"
          tabIndex={-1}
          className="
            fixed
            inset-0
            z-[100]
            bg-black/60
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
            animate-scale-in
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeNotification();
            }
          }}
        >
          <div
            className="
              bg-white
              dark:bg-[#0F1F2D]
              w-full
              max-w-2xl
              max-h-[92vh]
              overflow-y-auto
              rounded-2xl
              shadow-2xl
              border
              border-gray-200
              dark:border-gray-700
            "
          >
            <div
              className="
                sticky
                top-0
                z-10
                px-5
                sm:px-6
                py-5
                bg-white
                dark:bg-[#0F1F2D]
                border-b
                border-gray-100
                dark:border-gray-800
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Bell
                    size={17}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Notification Details
                  </span>

                  <StatusBadge
                    isRead={
                      selectedNotification.is_read
                    }
                  />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                  {selectedNotification.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeNotification}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:text-gray-700
                  dark:hover:text-gray-200
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition-colors
                  shrink-0
                "
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div
                className="
                  rounded-2xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-5
                "
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
                    <User size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      Recipient
                    </p>

                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {getApplicantName(
                        selectedNotification
                      )}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Mail size={14} />

                      <span className="truncate">
                        {getApplicantEmail(
                          selectedNotification
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  Message
                </p>

                <div
                  className="
                    rounded-2xl
                    bg-gray-50
                    dark:bg-[#142738]
                    border
                    border-gray-100
                    dark:border-gray-800
                    p-5
                    sm:p-6
                  "
                >
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-line leading-7">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock3 size={15} />

                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      Sent At
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">
                    {formatDate(
                      selectedNotification.created_at
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Bell size={15} />

                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      Status
                    </span>
                  </div>

                  <div className="mt-2">
                    <StatusBadge
                      isRead={
                        selectedNotification.is_read
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="
                px-5
                sm:px-6
                py-5
                border-t
                border-gray-100
                dark:border-gray-800
                flex
                justify-end
              "
            >
              <button
                type="button"
                onClick={closeNotification}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-gray-100
                  dark:bg-gray-800
                  text-gray-700
                  dark:text-gray-300
                  font-semibold
                  text-sm
                  hover:bg-gray-200
                  dark:hover:bg-gray-700
                  transition-colors
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

const StaffNotificationsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <StaffNotifications confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default StaffNotificationsWrapper;