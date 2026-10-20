import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  X,
  Pencil,
  Trash2,
  CalendarDays,
  CheckCircle,
  FileText,
  RefreshCw,
  AlertCircle,
  Send,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';

import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { publicationTimeForInput, publicationTimeToUtc } from '../../services/publicationTime';

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
  progressClass,
  delay = '',
}) => (
  <div
    className={`ep-card ep-hover-lift animate-fade-up rounded-2xl p-5 relative overflow-hidden ${delay}`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <p className="text-3xl font-extrabold text-[#123B5D] dark:text-white mt-2">
          {value}
        </p>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {description}
        </p>
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <Icon size={22} className={iconClass} />
      </div>
    </div>

    <div
      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${progressClass}`}
    />
  </div>
);

const SkeletonStat = () => (
  <div className="ep-card rounded-2xl p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-3 flex-1">
        <div className="ep-skeleton h-4 w-28 rounded" />
        <div className="ep-skeleton h-9 w-16 rounded" />
        <div className="ep-skeleton h-3 w-36 rounded" />
      </div>

      <div className="ep-skeleton w-12 h-12 rounded-xl shrink-0" />
    </div>
  </div>
);

const Announcements = ({ confirm }) => {
  const { token } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'draft',
    published_at: '',
  });

  const loadAnnouncements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/admin/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setAnnouncements(
        Array.isArray(data) ? data : data.data || []
      );
    } catch (err) {
      console.error('Failed to load announcements:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load announcements.'
      );
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [token]);
  useAutoRefresh(() => {
    loadAnnouncements(true);
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    queueMicrotask(() => {
      loadAnnouncements();
    });
  }, [token, loadAnnouncements]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      status: 'draft',
      published_at: '',
    });

    setEditingAnnouncement(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        title: form.title,
        content: form.content,
        status: form.status,
        published_at: publicationTimeToUtc(form.published_at),
      };

      if (editingAnnouncement) {
        const response = await api.put(
          `/admin/announcements/${editingAnnouncement.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            'Announcement updated successfully.'
        );
      } else {
        const response = await api.post(
          '/admin/announcements',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            'Announcement created successfully.'
        );
      }

      resetForm();
      await loadAnnouncements(true);
    } catch (err) {
      console.error('Failed to save announcement:', err);

      const validationErrors =
        err.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)[0]?.[0];

        setError(
          firstError ||
            'Please check the form fields.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to save announcement.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const editAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);

    setForm({
      title: announcement.title || '',
      content: announcement.content || '',
      status: announcement.status || 'draft',
      published_at: publicationTimeForInput(announcement.published_at),
    });

    setShowForm(true);
    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deleteAnnouncement = async (announcement) => {
    const confirmed = await confirm({
      title: 'Delete Announcement',
      message: `Are you sure you want to delete "${announcement.title}"?`,
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await api.delete(
        `/admin/announcements/${announcement.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          'Announcement deleted successfully.'
      );

      await loadAnnouncements(true);
    } catch (err) {
      console.error(
        'Failed to delete announcement:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete announcement.'
      );
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Not published';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not published';
    }

    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const publishedCount = announcements.filter(
    (announcement) =>
      announcement.status === 'published'
  ).length;

  const draftCount = announcements.filter(
    (announcement) =>
      announcement.status === 'draft'
  ).length;

  const scheduledCount = announcements.filter(
    (announcement) =>
      announcement.published_at &&
      new Date(announcement.published_at) > new Date()
  ).length;

  if (loading) {
    return (
      <div className="space-y-8 page-transition">
        {/* Hero Skeleton */}
        <div className="ep-card rounded-2xl overflow-hidden">
          <div className="ep-page-banner ep-brand-gradient p-6 sm:p-8">
            <div className="space-y-5">
              <div className="ep-skeleton bg-white/20 h-7 w-32 rounded-full" />

              <div className="ep-skeleton bg-white/20 h-10 w-72 rounded-lg" />

              <div className="space-y-2">
                <div className="ep-skeleton bg-white/20 h-4 w-full max-w-2xl rounded" />
                <div className="ep-skeleton bg-white/20 h-4 w-3/4 max-w-xl rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>

        {/* Content Skeleton */}
        <div className="ep-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="ep-skeleton h-6 w-48 rounded" />
              <div className="ep-skeleton h-4 w-64 rounded" />
            </div>

            <div className="ep-skeleton h-10 w-28 rounded-xl" />
          </div>

          <div className="space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="ep-skeleton w-12 h-12 rounded-xl shrink-0" />

                  <div className="flex-1 space-y-3">
                    <div className="ep-skeleton h-5 w-2/3 rounded" />
                    <div className="ep-skeleton h-4 w-full rounded" />
                    <div className="ep-skeleton h-4 w-4/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 pb-4">
          <Loader2
            size={18}
            className="animate-spin text-[#123B5D] dark:text-[#F4B400]"
          />
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Hero */}
      <div className="ep-page-banner relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 right-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-10 left-1/2 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold">
                <ShieldCheck size={14} />
                Administration
              </span>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4">
                Announcements
              </h1>

              <p className="text-blue-100 mt-2 max-w-2xl leading-6">
                Create and manage important announcements
                to keep Trinidad Municipal College applicants
                informed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadAnnouncements(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white font-semibold transition"
              >
                <RefreshCw
                  size={17}
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
                onClick={() => {
                  if (showForm) {
                    resetForm();
                  } else {
                    setEditingAnnouncement(null);
                    setShowForm(true);
                    setError('');
                    setSuccess('');
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F4B400] hover:bg-[#dca300] text-[#123B5D] font-bold shadow-md hover:shadow-lg transition"
              >
                {showForm ? (
                  <>
                    <X size={18} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Announcement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <ErrorMessage message={error}><div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-4 rounded-2xl">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div></ErrorMessage>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 px-4 py-4 rounded-2xl">
          <CheckCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Success
            </p>

            <p className="text-sm mt-1">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Announcements"
          value={announcements.length}
          description="All announcements"
          icon={Megaphone}
          iconClass="text-[#123B5D] dark:text-blue-300"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          progressClass="from-[#123B5D] to-blue-400"
          delay="delay-0"
        />

        <StatCard
          title="Published"
          value={publishedCount}
          description="Visible to applicants"
          icon={Send}
          iconClass="text-green-600 dark:text-green-300"
          iconBg="bg-green-50 dark:bg-green-950/40"
          progressClass="from-green-500 to-emerald-400"
          delay="delay-75"
        />

        <StatCard
          title="Drafts"
          value={draftCount}
          description="Unpublished announcements"
          icon={FileText}
          iconClass="text-[#C99A00] dark:text-yellow-300"
          iconBg="bg-yellow-50 dark:bg-yellow-950/40"
          progressClass="from-yellow-500 to-amber-400"
          delay="delay-150"
        />

        <StatCard
          title="Scheduled"
          value={scheduledCount}
          description="Future publication dates"
          icon={Clock}
          iconClass="text-purple-600 dark:text-purple-300"
          iconBg="bg-purple-50 dark:bg-purple-950/40"
          progressClass="from-purple-500 to-violet-400"
          delay="delay-200"
        />
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">
          <div className="ep-brand-gradient px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                {editingAnnouncement ? (
                  <Pencil
                    size={20}
                    className="text-[#F4B400]"
                  />
                ) : (
                  <Plus
                    size={20}
                    className="text-[#F4B400]"
                  />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingAnnouncement
                    ? 'Edit Announcement'
                    : 'Create Announcement'}
                </h2>

                <p className="text-sm text-blue-100 mt-0.5">
                  {editingAnnouncement
                    ? 'Update the selected announcement.'
                    : 'Create a new announcement for applicants.'}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-7"
          >
            {/* Basic Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Megaphone
                  size={18}
                  className="text-[#123B5D] dark:text-[#F4B400]"
                />

                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Announcement Information
                </h3>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Announcement Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/60 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    placeholder="Enter announcement title"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Announcement Content
                  </label>

                  <textarea
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    required
                    rows="7"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/60 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition resize-none"
                    placeholder="Write the announcement content here..."
                  />

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Provide clear and useful information
                    for applicants.
                  </p>
                </div>
              </div>
            </div>

            {/* Publication Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays
                  size={18}
                  className="text-[#123B5D] dark:text-[#F4B400]"
                />

                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Publication Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Publication Status
                  </label>

                  <div className="relative">
                    <Send
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      required
                      className="w-full appearance-none border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/60 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    >
                      <option value="draft">
                        Draft
                      </option>

                      <option value="published">
                        Published
                      </option>
                    </select>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Drafts remain unpublished until
                    published.
                  </p>
                </div>

                {/* Published At */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Published At
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="datetime-local"
                      name="published_at"
                      value={form.published_at}
                      onChange={handleChange}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/60 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    />
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Uses your device’s local time. Leave blank to publish immediately when status is Published.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-800/60">
              <div className="flex items-center gap-3">
                {form.status === 'published' ? (
                  <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-950/50 flex items-center justify-center shrink-0">
                    <CheckCircle
                      size={21}
                      className="text-green-600 dark:text-green-300"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-yellow-100 dark:bg-yellow-950/50 flex items-center justify-center shrink-0">
                    <Clock
                      size={21}
                      className="text-[#C99A00] dark:text-yellow-300"
                    />
                  </div>
                )}

                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {form.status === 'published'
                      ? 'Ready to Publish'
                      : 'Saved as Draft'}
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {form.status === 'published'
                      ? 'Applicants will be able to see this announcement.'
                      : 'This announcement will remain unpublished.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : editingAnnouncement ? (
                  <>
                    <Pencil size={18} />
                    Update Announcement
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Announcement
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl font-semibold transition"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {announcements.length === 0 ? (
        <div className="ep-card rounded-2xl p-10 sm:p-12 text-center animate-fade-up">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-5 animate-float">
            <Megaphone
              size={34}
              className="text-[#123B5D] dark:text-blue-300"
            />
          </div>

          <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
            No Announcements
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto leading-6">
            There are currently no announcements.
            Create one to keep applicants informed.
          </p>

          {!showForm && (
            <button
              type="button"
              onClick={() => {
                setEditingAnnouncement(null);
                setShowForm(true);
                setError('');
                setSuccess('');
              }}
              className="inline-flex items-center gap-2 mt-6 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition"
            >
              <Plus size={18} />
              Add Announcement
            </button>
          )}
        </div>
      ) : (
        /* Announcement List */
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
                Announcement List
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage announcements and publication
                status.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <Megaphone size={16} />
              {announcements.length}{' '}
              {announcements.length === 1
                ? 'announcement'
                : 'announcements'}
            </div>
          </div>

          {announcements.map(
            (announcement, index) => (
              <div
                key={announcement.id}
                className="ep-card ep-hover-lift animate-fade-up rounded-2xl overflow-hidden"
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
              >
                {/* Top Accent */}
                <div
                  className={`h-1 ${
                    announcement.status ===
                    'published'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : 'bg-gradient-to-r from-yellow-500 to-amber-400'
                  }`}
                />

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-[#123B5D] dark:bg-blue-950/70 flex items-center justify-center">
                        <Megaphone
                          size={22}
                          className="text-[#F4B400]"
                        />
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide font-bold text-[#C99A00] dark:text-yellow-400">
                          TMC Announcement
                        </p>

                        <h2 className="text-xl font-bold text-[#123B5D] dark:text-white mt-1">
                          {announcement.title}
                        </h2>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Announcement #
                          {announcement.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 w-fit px-3.5 py-2 rounded-full text-xs font-semibold border ${
                        announcement.status ===
                        'published'
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-100 dark:border-green-900/50'
                          : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-900/50'
                      }`}
                    >
                      {announcement.status ===
                      'published' ? (
                        <CheckCircle size={14} />
                      ) : (
                        <Clock size={14} />
                      )}

                      {announcement.status
                        ? announcement.status
                            .charAt(0)
                            .toUpperCase() +
                          announcement.status.slice(1)
                        : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                        <FileText
                          size={18}
                          className="text-[#123B5D] dark:text-blue-300"
                        />
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 leading-7 whitespace-pre-line">
                        {announcement.content}
                      </p>
                    </div>
                  </div>

                  {/* Publication Info */}
                  <div className="mt-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                        <CalendarDays
                          size={18}
                          className="text-[#123B5D] dark:text-blue-300"
                        />
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Published
                        </p>

                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
                          {formatDate(
                            announcement.published_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          editAnnouncement(
                            announcement
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition"
                      >
                        <Pencil size={17} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteAnnouncement(
                            announcement
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition"
                      >
                        <Trash2 size={17} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

const AnnouncementsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <Announcements confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default AnnouncementsWrapper;
