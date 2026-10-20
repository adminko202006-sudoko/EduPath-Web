import { showErrorDialog } from '../../services/errorDialogs';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Megaphone,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  FileText,
  RefreshCw,
  Filter,
  ShieldCheck,
  CalendarDays,
  Clock3,
  Save,
  Send,
} from 'lucide-react';

import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { publicationTimeForInput, publicationTimeToUtc } from '../../services/publicationTime';
import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import { useAuth } from '../../context/useAuth';

const getStatusConfig = (status) => {
  if (status === 'published') {
    return {
      label: 'Published',
      icon: CheckCircle2,
      className:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    };
  }

  return {
    label: 'Draft',
    icon: FileText,
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  };
};

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1.5
        rounded-full
        text-xs
        font-bold
        ${config.className}
      `}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
};

const StaffAnnouncements = ({ confirm }) => {
  const { token } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState(null);

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'draft',
    published_at: '',
  });

  const fetchAnnouncements = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get(
        '/staff/announcements',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnnouncements(response.data?.data || []);
    } catch (err) {
      console.error(
        'Failed to load staff announcements:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load announcements.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  useAutoRefresh(() => {
    fetchAnnouncements(true);
  });

  useEffect(() => {
    if (token) {
      queueMicrotask(() => {
        fetchAnnouncements();
      });
    }
  }, [token, fetchAnnouncements]);

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      status: 'draft',
      published_at: '',
    });

    setEditingAnnouncement(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (announcement) => {
    setEditingAnnouncement(announcement);

    setForm({
      title: announcement.title || '',
      content: announcement.content || '',
      status: announcement.status || 'draft',
      published_at: publicationTimeForInput(announcement.published_at),
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveAnnouncement = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = {
        title: form.title,
        content: form.content,
        status: form.status,
        published_at: publicationTimeToUtc(form.published_at),
      };

      let response;

      if (editingAnnouncement) {
        response = await api.put(
          `/staff/announcements/${editingAnnouncement.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await api.post(
          '/staff/announcements',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      const savedAnnouncement = response.data?.data;

      if (editingAnnouncement) {
        setAnnouncements((current) =>
          current.map((announcement) =>
            announcement.id === editingAnnouncement.id
              ? savedAnnouncement || announcement
              : announcement
          )
        );
      } else if (savedAnnouncement) {
        setAnnouncements((current) => [
          savedAnnouncement,
          ...current,
        ]);
      }

      closeForm();
    } catch (err) {
      console.error(
        'Failed to save announcement:',
        err
      );

      showErrorDialog(
        err.response?.data?.message ||
          'Failed to save announcement.'
      );
    } finally {
      setSaving(false);
    }
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
      await api.delete(
        `/staff/announcements/${announcement.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnnouncements((current) =>
        current.filter(
          (item) => item.id !== announcement.id
        )
      );

      if (
        selectedAnnouncement?.id === announcement.id
      ) {
        setSelectedAnnouncement(null);
      }
    } catch (err) {
      console.error(
        'Failed to delete announcement:',
        err
      );

      showErrorDialog(
        err.response?.data?.message ||
          'Failed to delete announcement.'
      );
    }
  };

  const openAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
  };

  const closeAnnouncement = () => {
    setSelectedAnnouncement(null);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const formatPublishedDate = (date) => {
    if (!date) {
      return 'Not published';
    }

    return new Date(date).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const filteredAnnouncements =
    announcements.filter((announcement) => {
      const searchValue = search
        .toLowerCase()
        .trim();

      const title = (
        announcement.title || ''
      ).toLowerCase();

      const content = (
        announcement.content || ''
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        content.includes(searchValue);

      const matchesStatus =
        statusFilter === 'all' ||
        announcement.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const publishedCount =
    announcements.filter(
      (announcement) =>
        announcement.status === 'published'
    ).length;

  const draftCount =
    announcements.filter(
      (announcement) =>
        announcement.status === 'draft'
    ).length;

  return (
    <div className="space-y-7 page-transition">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section
        className="ep-page-banner
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
                Announcements
              </h1>

              <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
                Create and manage announcements that
                provide important information to applicants.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  fetchAnnouncements(true)
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
                <Plus size={17} />
                New Announcement
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
                Total Announcements
              </p>

              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                {announcements.length}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All announcements
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center">
              <Megaphone size={23} />
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
                Published
              </p>

              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {publishedCount}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Visible announcements
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={23} />
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
                Drafts
              </p>

              <p className="text-3xl font-extrabold text-gray-700 dark:text-gray-200 mt-2">
                {draftCount}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Unpublished announcements
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 flex items-center justify-center">
              <FileText size={23} />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <ErrorMessage message={error}><div
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
            <XCircleIcon />
          </div>

          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">
              Unable to load announcements
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div></ErrorMessage>
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
              Find announcements by title, content, or status.
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
              placeholder="Search announcements..."
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
              setStatusFilter(event.target.value)
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
              All Statuses
            </option>

            <option value="published">
              Published
            </option>

            <option value="draft">
              Draft
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
          ANNOUNCEMENT LIST
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
              <Megaphone
                size={21}
                className="text-[#0F766E] dark:text-teal-300"
              />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123B5D] dark:text-sky-300">
                Announcement Center
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredAnnouncements.length}{' '}
                announcement
                {filteredAnnouncements.length !== 1
                  ? 's'
                  : ''}{' '}
                displayed
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 text-xs font-bold">
            <ShieldCheck size={14} />
            Staff Managed
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-5 sm:p-6 space-y-4">
            {Array.from({ length: 4 }).map(
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
                      <div className="ep-skeleton h-4 w-56 mb-3" />
                      <div className="ep-skeleton h-3 w-full max-w-xl mb-2" />
                      <div className="ep-skeleton h-3 w-3/4 mb-3" />
                      <div className="ep-skeleton h-3 w-40" />
                    </div>

                    <div className="hidden sm:block ep-skeleton h-9 w-24 rounded-lg" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
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
              <Megaphone
                size={28}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Announcements Found
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {search ||
              statusFilter !== 'all'
                ? 'Try adjusting your search or filter settings.'
                : 'Create an announcement to share important information with applicants.'}
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
                <Plus size={16} />
                Create Announcement
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-3">
            {filteredAnnouncements.map(
              (announcement) => (
                <article
                  key={announcement.id}
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
                      <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
                        <Megaphone size={21} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {announcement.title}
                          </h3>

                          <StatusBadge
                            status={
                              announcement.status
                            }
                          />
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3 whitespace-pre-line leading-relaxed">
                          {announcement.content}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-400 dark:text-gray-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />

                            {announcement.status ===
                            'published'
                              ? formatPublishedDate(
                                  announcement.published_at
                                )
                              : 'Not published'}
                          </span>

                          {announcement.status ===
                            'published' && (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Send size={13} />
                              Visible to applicants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openAnnouncement(
                            announcement
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          px-3
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
                        <Eye size={15} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            announcement
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          px-3
                          py-2
                          rounded-lg
                          bg-[#123B5D]
                          text-white
                          text-sm
                          font-semibold
                          hover:bg-[#0F3553]
                          transition-colors
                        "
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteAnnouncement(
                            announcement
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          gap-2
                          px-3
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
          CREATE / EDIT MODAL
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
          aria-label={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
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
            {/* Modal Header */}
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
                  <Megaphone
                    size={17}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Staff Communications
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {editingAnnouncement
                    ? 'Edit Announcement'
                    : 'New Announcement'}
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {editingAnnouncement
                    ? 'Update the announcement information below.'
                    : 'Create an announcement for applicants.'}
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
              onSubmit={saveAnnouncement}
              className="p-5 sm:p-6 space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Announcement Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter announcement title"
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

              {/* Content */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Announcement Content
                </label>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  required
                  rows={8}
                  placeholder="Write the announcement for applicants..."
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

              {/* Status / Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
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
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="published">
                      Published
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Published At
                  </label>

                  <div className="relative">
                    <CalendarDays
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
                      type="datetime-local"
                      name="published_at"
                      value={
                        form.published_at
                      }
                      onChange={handleChange}
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
                </div>
              </div>

              {/* Publishing Notice */}
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
                    {form.status ===
                    'published' ? (
                      <Send
                        size={17}
                        className="text-[#0F766E] dark:text-teal-300"
                      />
                    ) : (
                      <Clock3
                        size={17}
                        className="text-[#0F766E] dark:text-teal-300"
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {form.status ===
                      'published'
                        ? 'This announcement will be published'
                        : 'This announcement will remain a draft'}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {form.status ===
                      'published'
                        ? 'Published announcements can be displayed to applicants through the applicant portal.'
                        : 'Draft announcements can be edited and published later.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
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

                      Saving...
                    </>
                  ) : editingAnnouncement ? (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Announcement
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
          VIEW MODAL
      ===================================================== */}
      {selectedAnnouncement && (
        <ModalPortal onEscape={closeAnnouncement}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Announcement Details"
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
              closeAnnouncement();
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
            {/* Header */}
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
                  <Megaphone
                    size={17}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Announcement
                  </span>

                  <StatusBadge
                    status={
                      selectedAnnouncement.status
                    }
                  />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                  {selectedAnnouncement.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} />

                    {selectedAnnouncement.status ===
                    'published'
                      ? formatPublishedDate(
                          selectedAnnouncement.published_at
                        )
                      : 'Not published'}
                  </span>

                  {selectedAnnouncement.status ===
                    'published' && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Send size={13} />
                      Visible to applicants
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeAnnouncement
                }
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

            {/* Content */}
            <div className="p-5 sm:p-6">
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
                  {selectedAnnouncement.content}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText size={15} />

                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      Status
                    </span>
                  </div>

                  <div className="mt-2">
                    <StatusBadge
                      status={
                        selectedAnnouncement.status
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock3 size={15} />

                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      Published At
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">
                    {selectedAnnouncement.status ===
                    'published'
                      ? formatPublishedDate(
                          selectedAnnouncement.published_at
                        )
                      : 'Not published'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="
                px-5
                sm:px-6
                py-5
                border-t
                border-gray-100
                dark:border-gray-800
                flex
                flex-col-reverse
                sm:flex-row
                sm:justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={
                  closeAnnouncement
                }
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
                "
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  closeAnnouncement();
                  openEditForm(
                    selectedAnnouncement
                  );
                }}
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
                  transition-colors
                "
              >
                <Pencil size={16} />
                Edit Announcement
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Small local icon component
|--------------------------------------------------------------------------
| Keeps the error UI self-contained without adding another import.
*/
const XCircleIcon = () => (
  <X
    size={19}
    className="text-red-500"
  />
);

const StaffAnnouncementsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <StaffAnnouncements confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default StaffAnnouncementsWrapper;
