import { useEffect, useMemo, useState } from 'react';

import {
  ClipboardList,
  Plus,
  X,
  Pencil,
  Trash2,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  Loader2,
  Search,
  Filter,
  Eye,
  Power,
  Timer,
  CalendarCheck,
  CalendarX,
} from 'lucide-react';

import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EntranceExams = ({ confirm }) => {
  const { token } = useAuth();

  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    capacity: '',
    is_active: true,
  });

  // =========================================================
  // LOAD EXAMS
  // =========================================================

  const loadExams = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/admin/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setExams(
        Array.isArray(data)
          ? data
          : data?.data || []
      );
    } catch (err) {
      console.error('Failed to load exams:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load entrance exams.'
      );
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    loadExams();
  }, [token]);

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));

    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      venue: '',
      capacity: '',
      is_active: true,
    });

    setEditingExam(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingExam(null);

    setForm({
      title: '',
      description: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      venue: '',
      capacity: '',
      is_active: true,
    });

    setError('');
    setSuccess('');
    setShowForm(true);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 50);
  };

  // =========================================================
  // FORM VALIDATION
  // =========================================================

  const validateForm = () => {
    if (!form.title.trim()) {
      return 'Exam title is required.';
    }

    if (!form.exam_date) {
      return 'Exam date is required.';
    }

    if (!form.start_time) {
      return 'Start time is required.';
    }

    if (!form.end_time) {
      return 'End time is required.';
    }

    if (!form.venue.trim()) {
      return 'Exam venue is required.';
    }

    if (
      form.start_time &&
      form.end_time &&
      form.end_time <= form.start_time
    ) {
      return 'End time must be later than the start time.';
    }

    if (
      !editingExam &&
      form.exam_date
    ) {
      const selectedDate =
        new Date(`${form.exam_date}T00:00:00`);

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return 'Exam date cannot be in the past.';
      }
    }

    if (
      form.capacity !== '' &&
      Number(form.capacity) < 1
    ) {
      return 'Capacity must be at least 1.';
    }

    return '';
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        exam_date: form.exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue.trim(),
        capacity:
          form.capacity !== ''
            ? Number(form.capacity)
            : null,
        is_active: Boolean(form.is_active),
      };

      if (editingExam) {
        const response = await api.put(
          `/admin/exams/${editingExam.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            'Entrance exam updated successfully.'
        );
      } else {
        const response = await api.post(
          '/admin/exams',
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            'Entrance exam created successfully.'
        );
      }

      resetForm();

      await loadExams();
    } catch (err) {
      console.error(
        'Failed to save exam:',
        err
      );

      const validationErrors =
        err.response?.data?.errors;

      if (validationErrors) {
        const messages =
          Object.values(validationErrors)
            .flat();

        setError(
          messages.join(' ') ||
            'Please check the form fields.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to save entrance exam.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const editExam = (exam) => {
    setEditingExam(exam);

    setForm({
      title: exam.title || '',
      description: exam.description || '',

      exam_date: exam.exam_date
        ? exam.exam_date.substring(0, 10)
        : '',

      start_time: exam.start_time
        ? exam.start_time.substring(0, 5)
        : '',

      end_time: exam.end_time
        ? exam.end_time.substring(0, 5)
        : '',

      venue: exam.venue || '',
      capacity:
        exam.capacity !== null &&
        exam.capacity !== undefined
          ? exam.capacity
          : '',

      is_active:
        Boolean(exam.is_active),
    });

    setShowForm(true);
    setViewingExam(null);

    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteExam = async (exam) => {
    const confirmed = await confirm({
      title: 'Delete Examination',
      message: `Are you sure you want to delete "${exam.title}"?`,
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(exam.id);
      setError('');
      setSuccess('');

      const response = await api.delete(
        `/admin/exams/${exam.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          'Entrance exam deleted successfully.'
      );

      await loadExams();
    } catch (err) {
      console.error(
        'Failed to delete exam:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete entrance exam.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // TOGGLE STATUS
  // =========================================================

  const toggleExamStatus = async (exam) => {
    try {
      setTogglingId(exam.id);
      setError('');
      setSuccess('');

      const payload = {
        title: exam.title,
        description: exam.description || null,
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        venue: exam.venue,
        capacity:
          exam.capacity !== null &&
          exam.capacity !== undefined
            ? Number(exam.capacity)
            : null,
        is_active: !exam.is_active,
      };

      const response = await api.put(
        `/admin/exams/${exam.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          `Exam ${
            exam.is_active
              ? 'deactivated'
              : 'activated'
          } successfully.`
      );

      await loadExams();
    } catch (err) {
      console.error(
        'Failed to toggle exam status:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to update exam status.'
      );
    } finally {
      setTogglingId(null);
    }
  };

  // =========================================================
  // DATE / TIME HELPERS
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return 'Not available';
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return 'Not available';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  const formatTime = (time) => {
    if (!time) {
      return 'Not available';
    }

    const [hours, minutes] =
      time.substring(0, 5).split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  const getExamDateStatus = (exam) => {
    if (!exam.exam_date) {
      return 'unknown';
    }

    const examDate =
      new Date(
        `${exam.exam_date.substring(
          0,
          10
        )}T00:00:00`
      );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (examDate.getTime() === today.getTime()) {
      return 'today';
    }

    if (examDate > today) {
      return 'upcoming';
    }

    return 'past';
  };

  const getExamDateLabel = (exam) => {
    const status =
      getExamDateStatus(exam);

    switch (status) {
      case 'today':
        return 'Today';

      case 'upcoming':
        return 'Upcoming';

      case 'past':
        return 'Past';

      default:
        return 'Unknown';
    }
  };

  const getExamDateStyle = (exam) => {
    const status =
      getExamDateStatus(exam);

    switch (status) {
      case 'today':
        return {
          container:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
          icon: CalendarCheck,
        };

      case 'upcoming':
        return {
          container:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20',
          icon: CalendarDays,
        };

      case 'past':
        return {
          container:
            'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
          icon: CalendarX,
        };

      default:
        return {
          container:
            'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
          icon: CalendarDays,
        };
    }
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const active =
      exams.filter(
        (exam) =>
          Boolean(exam.is_active)
      ).length;

    const inactive =
      exams.filter(
        (exam) =>
          !exam.is_active
      ).length;

    const upcoming =
      exams.filter(
        (exam) =>
          getExamDateStatus(exam) ===
          'upcoming'
      ).length;

    const today =
      exams.filter(
        (exam) =>
          getExamDateStatus(exam) ===
          'today'
      ).length;

    const past =
      exams.filter(
        (exam) =>
          getExamDateStatus(exam) ===
          'past'
      ).length;

    return {
      total: exams.length,
      active,
      inactive,
      upcoming,
      today,
      past,
    };
  }, [exams]);

  // =========================================================
  // FILTERED EXAMS
  // =========================================================

  const filteredExams = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return exams
      .filter((exam) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          exam.title,
          exam.description,
          exam.venue,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch)
          );
      })
      .filter((exam) => {
        switch (statusFilter) {
          case 'active':
            return Boolean(exam.is_active);

          case 'inactive':
            return !exam.is_active;

          case 'upcoming':
            return (
              getExamDateStatus(exam) ===
              'upcoming'
            );

          case 'today':
            return (
              getExamDateStatus(exam) ===
              'today'
            );

          case 'past':
            return (
              getExamDateStatus(exam) ===
              'past'
            );

          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (
          !a.exam_date ||
          !b.exam_date
        ) {
          return 0;
        }

        return (
          new Date(a.exam_date) -
          new Date(b.exam_date)
        );
      });
  }, [
    exams,
    searchTerm,
    statusFilter,
  ]);

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="page-transition space-y-8">

        <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-900">
          <div className="ep-brand-gradient p-6 sm:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-44 rounded-lg bg-white/20" />
              <div className="h-10 w-64 rounded-lg bg-white/20" />
              <div className="h-5 w-full max-w-2xl rounded-lg bg-white/10" />
              <div className="h-5 w-2/3 max-w-xl rounded-lg bg-white/10" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="ep-card rounded-2xl shadow-md p-5 overflow-hidden"
            >
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="ep-card rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="animate-pulse space-y-3">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          <div className="p-6 space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5"
              >
                <div className="animate-pulse space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-2">
                      <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((box) => (
                      <div
                        key={box}
                        className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800"
                      />
                    ))}
                  </div>

                  <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <Loader2
            size={28}
            className="text-[#123B5D] dark:text-blue-300 animate-spin"
          />

          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-3">
            Loading entrance exams...
          </p>
        </div>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page-transition space-y-8">

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="relative overflow-hidden rounded-2xl shadow-lg ep-brand-gradient">

        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-[#F4B400]/10" />

        <div className="relative p-6 sm:p-8">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

            <div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-4">
                <ShieldCheck size={15} />
                Administration
              </div>

              <div className="flex items-center gap-3 mb-3">

                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <ClipboardList
                    size={25}
                    className="text-[#F4B400]"
                  />
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Entrance Exams
                </h1>

              </div>

              <p className="text-blue-100 max-w-2xl leading-7">
                Create, schedule, and manage entrance examinations for Trinidad Municipal College applicants.
              </p>

            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">

              <button
                type="button"
                onClick={() =>
                  loadExams(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 disabled:opacity-60 transition"
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
                    openCreateForm();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#F4B400] hover:bg-[#DDA300] text-[#123B5D] px-5 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition"
              >
                {showForm ? (
                  <>
                    <X size={18} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Add Entrance Exam
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-4 rounded-2xl animate-fade-up">

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

        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-4 rounded-2xl animate-fade-up">

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

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Total */}

        <div className="ep-card ep-hover-lift animate-fade-up rounded-2xl shadow-md p-5 overflow-hidden relative">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Exams
              </p>

              <p className="text-3xl font-extrabold text-[#123B5D] dark:text-white mt-2">
                {statistics.total}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                All exam schedules
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <ClipboardList
                size={22}
                className="text-[#123B5D] dark:text-blue-300"
              />
            </div>

          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#123B5D] to-blue-300" />

        </div>

        {/* Active */}

        <div className="ep-card ep-hover-lift animate-fade-up rounded-2xl shadow-md p-5 overflow-hidden relative">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Exams
              </p>

              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-2">
                {statistics.active}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Currently enabled
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle
                size={22}
                className="text-green-600 dark:text-green-400"
              />
            </div>

          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-200" />

        </div>

        {/* Upcoming */}

        <div className="ep-card ep-hover-lift animate-fade-up rounded-2xl shadow-md p-5 overflow-hidden relative">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Upcoming
              </p>

              <p className="text-3xl font-extrabold text-[#C99A00] dark:text-[#F4B400] mt-2">
                {statistics.upcoming}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Future schedules
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
              <CalendarDays
                size={22}
                className="text-[#C99A00] dark:text-[#F4B400]"
              />
            </div>

          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-200" />

        </div>

        {/* Today / Inactive */}

        <div className="ep-card ep-hover-lift animate-fade-up rounded-2xl shadow-md p-5 overflow-hidden relative">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Today
              </p>

              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
                {statistics.today}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Exams scheduled today
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <CalendarCheck
                size={22}
                className="text-blue-600 dark:text-blue-400"
              />
            </div>

          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-200" />

        </div>

      </div>

      {/* =====================================================
          CREATE / EDIT FORM
      ===================================================== */}

      {showForm && (
        <div className="ep-card rounded-2xl shadow-md overflow-hidden animate-fade-up">

          <div className="ep-brand-gradient px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">

                {editingExam ? (
                  <Pencil
                    size={21}
                    className="text-[#F4B400]"
                  />
                ) : (
                  <Plus
                    size={21}
                    className="text-[#F4B400]"
                  />
                )}

              </div>

              <div>

                <h2 className="text-xl font-bold text-white">
                  {editingExam
                    ? 'Edit Entrance Exam'
                    : 'Create Entrance Exam'}
                </h2>

                <p className="text-sm text-blue-100 mt-0.5">
                  {editingExam
                    ? 'Update the selected examination schedule.'
                    : 'Add a new entrance examination schedule.'}
                </p>

              </div>

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >

            {/* TITLE */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Exam Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                placeholder="e.g. TMC Entrance Examination 2026"
              />

            </div>

            {/* DESCRIPTION */}

            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition resize-none"
                placeholder="Enter exam description..."
              />

            </div>

            {/* SCHEDULE */}

            <div>

              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Examination Schedule
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* DATE */}

                <div>

                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Exam Date
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      name="exam_date"
                      value={form.exam_date}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    />

                  </div>

                </div>

                {/* START */}

                <div>

                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Start Time
                  </label>

                  <div className="relative">

                    <Clock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="time"
                      name="start_time"
                      value={form.start_time}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    />

                  </div>

                </div>

                {/* END */}

                <div>

                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    End Time
                  </label>

                  <div className="relative">

                    <Clock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="time"
                      name="end_time"
                      value={form.end_time}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* VENUE + CAPACITY */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Venue
                </label>

                <div className="relative">

                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    placeholder="e.g. TMC Computer Laboratory"
                  />

                </div>

              </div>

              <div>

                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Capacity
                </label>

                <div className="relative">

                  <Users
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    min="1"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition"
                    placeholder="e.g. 50"
                  />

                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  Leave blank for unlimited capacity.
                </p>

              </div>

            </div>

            {/* STATUS */}

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/60">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Exam Status
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Make this entrance exam available to applicants.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      is_active:
                        !previous.is_active,
                    }))
                  }
                  className={`relative w-12 h-7 rounded-full transition ${
                    form.is_active
                      ? 'bg-[#123B5D]'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label="Toggle exam status"
                >

                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition ${
                      form.is_active
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />

                </button>

              </div>

              <div className="mt-3 flex items-center gap-2">

                {form.is_active ? (
                  <>
                    <CheckCircle
                      size={16}
                      className="text-green-600 dark:text-green-400"
                    />

                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle
                      size={16}
                      className="text-gray-500 dark:text-gray-400"
                    />

                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Inactive
                    </span>
                  </>
                )}

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 dark:disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >

                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : editingExam ? (
                  <>
                    <Pencil size={18} />
                    Update Exam
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Exam
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

      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      {exams.length > 0 && (
        <div className="ep-card rounded-2xl shadow-md p-5 animate-fade-up">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Filter
                    size={18}
                    className="text-[#123B5D] dark:text-blue-300"
                  />
                </div>

                <div>

                  <h2 className="font-bold text-[#123B5D] dark:text-white">
                    Find Exam Schedule
                  </h2>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Search and filter your entrance examinations.
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">

              <div className="relative flex-1 sm:min-w-[280px]">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search title or venue..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 transition"
                />

              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
              >

                <option value="all">
                  All Exams
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="upcoming">
                  Upcoming
                </option>

                <option value="today">
                  Today
                </option>

                <option value="past">
                  Past
                </option>

              </select>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {exams.length === 0 ? (
        <div className="ep-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-12 text-center animate-fade-up">

          <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-5">

            <ClipboardList
              size={34}
              className="text-[#123B5D] dark:text-blue-300"
            />

          </div>

          <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
            No Entrance Exams
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto leading-6">
            There are currently no entrance examinations. Create an exam schedule to get started.
          </p>

          {!showForm && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 mt-6 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <Plus size={18} />
              Add Entrance Exam
            </button>
          )}

        </div>
      ) : filteredExams.length === 0 ? (

        <div className="ep-card rounded-2xl shadow-md p-12 text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">

            <Search
              size={28}
              className="text-gray-400"
            />

          </div>

          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
            No matching exams
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Try changing your search or filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B5D] text-white font-semibold"
          >
            Clear Filters
          </button>

        </div>

      ) : (

        /* =====================================================
           EXAM LIST
        ===================================================== */

        <div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 animate-fade-up">

            <div>

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">

                  <ClipboardList
                    size={18}
                    className="text-[#123B5D] dark:text-blue-300"
                  />

                </div>

                <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
                  Exam Schedules
                </h2>

              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Manage scheduled entrance examinations.
              </p>

            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#123B5D] dark:text-blue-300 text-sm font-semibold w-fit">

              <FileText size={15} />

              {filteredExams.length} of {exams.length}{' '}
              {exams.length === 1
                ? 'Exam'
                : 'Exams'}

            </div>

          </div>

          <div className="space-y-5">

            {filteredExams.map(
              (exam, index) => {

                const dateStyle =
                  getExamDateStyle(exam);

                const DateStatusIcon =
                  dateStyle.icon;

                const dateStatus =
                  getExamDateLabel(exam);

                return (
                  <div
                    key={exam.id}
                    className="ep-card ep-hover-lift rounded-2xl shadow-md overflow-hidden animate-fade-up"
                    style={{
                      animationDelay: `${index * 70}ms`,
                    }}
                  >

                    {/* HEADER */}

                    <div className="px-5 sm:px-6 py-5 border-b border-gray-100 dark:border-gray-800">

                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                        <div className="flex items-start gap-4">

                          <div className="w-12 h-12 shrink-0 rounded-xl bg-[#123B5D] dark:bg-blue-900/50 flex items-center justify-center">

                            <ClipboardList
                              size={22}
                              className="text-[#F4B400]"
                            />

                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="text-xs uppercase tracking-wide font-semibold text-[#C99A00] dark:text-[#F4B400]">
                                Entrance Examination
                              </p>

                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${dateStyle.container}`}
                              >

                                <DateStatusIcon
                                  size={12}
                                />

                                {dateStatus}

                              </span>

                            </div>

                            <h2 className="text-xl font-bold text-[#123B5D] dark:text-white mt-2 break-words">
                              {exam.title}
                            </h2>

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Exam #{exam.id}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 w-fit px-3.5 py-2 rounded-full text-xs font-semibold border ${
                            exam.is_active
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                          }`}
                        >

                          {exam.is_active ? (
                            <CheckCircle size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}

                          {exam.is_active
                            ? 'Active'
                            : 'Inactive'}

                        </span>

                      </div>

                    </div>

                    {/* DETAILS */}

                    <div className="p-5 sm:p-6">

                      {exam.description && (
                        <div className="flex items-start gap-3 mb-5 rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4">

                          <FileText
                            size={18}
                            className="text-[#123B5D] dark:text-blue-300 mt-0.5 shrink-0"
                          />

                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-6">
                            {exam.description}
                          </p>

                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* DATE */}

                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">

                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">

                            <CalendarDays size={16} />

                            <span className="text-xs font-medium">
                              Exam Date
                            </span>

                          </div>

                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {formatDate(
                              exam.exam_date
                            )}
                          </p>

                        </div>

                        {/* TIME */}

                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">

                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">

                            <Clock size={16} />

                            <span className="text-xs font-medium">
                              Time
                            </span>

                          </div>

                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {formatTime(
                              exam.start_time
                            )}{' '}
                            -{' '}
                            {formatTime(
                              exam.end_time
                            )}
                          </p>

                        </div>

                        {/* VENUE */}

                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">

                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">

                            <MapPin size={16} />

                            <span className="text-xs font-medium">
                              Venue
                            </span>

                          </div>

                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {exam.venue ||
                              'Not specified'}
                          </p>

                        </div>

                        {/* CAPACITY */}

                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 p-4">

                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">

                            <Users size={16} />

                            <span className="text-xs font-medium">
                              Capacity
                            </span>

                          </div>

                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {exam.capacity
                              ? `${exam.capacity} applicants`
                              : 'Unlimited'}
                          </p>

                        </div>

                      </div>

                      {/* QUICK INFORMATION */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">

                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">

                          <Timer
                            size={18}
                            className="text-[#123B5D] dark:text-blue-300"
                          />

                          <div>

                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Schedule
                            </p>

                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {formatDate(
                                exam.exam_date
                              )}{' '}
                              •{' '}
                              {formatTime(
                                exam.start_time
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">

                          <Users
                            size={18}
                            className="text-[#C99A00] dark:text-[#F4B400]"
                          />

                          <div>

                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Applicant Capacity
                            </p>

                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                              {exam.capacity
                                ? `${exam.capacity} available slots`
                                : 'No capacity limit'}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">

                          <CalendarDays size={16} />

                          <span>
                            Scheduled for{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                              {formatDate(
                                exam.exam_date
                              )}
                            </span>
                          </span>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              setViewingExam(
                                exam
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-[#123B5D] dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 px-4 py-2.5 rounded-xl font-semibold transition"
                          >
                            <Eye size={17} />
                            View
                          </button>

                          {/* TOGGLE */}

                          <button
                            type="button"
                            onClick={() =>
                              toggleExamStatus(
                                exam
                              )
                            }
                            disabled={
                              togglingId ===
                              exam.id
                            }
                            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition border ${
                              exam.is_active
                                ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                                : 'bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/20'
                            }`}
                          >

                            {togglingId ===
                            exam.id ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Power
                                size={17}
                              />
                            )}

                            {exam.is_active
                              ? 'Deactivate'
                              : 'Activate'}

                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              editExam(exam)
                            }
                            className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-4 py-2.5 rounded-xl font-semibold transition shadow-sm"
                          >
                            <Pencil
                              size={17}
                            />
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              deleteExam(exam)
                            }
                            disabled={
                              deletingId ===
                              exam.id
                            }
                            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2.5 rounded-xl font-semibold transition shadow-sm"
                          >

                            {deletingId ===
                            exam.id ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={17}
                              />
                            )}

                            {deletingId ===
                            exam.id
                              ? 'Deleting...'
                              : 'Delete'}

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>
      )}

      {/* =====================================================
          VIEW DETAILS MODAL
      ===================================================== */}

      {viewingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">

            <div className="ep-brand-gradient px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">

                    <ClipboardList
                      size={21}
                      className="text-[#F4B400]"
                    />

                  </div>

                  <div>

                    <p className="text-xs uppercase tracking-wide text-blue-100 font-semibold">
                      Entrance Examination
                    </p>

                    <h2 className="text-xl font-bold text-white mt-1">
                      {viewingExam.title}
                    </h2>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewingExam(null)
                  }
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <X size={19} />
                </button>

              </div>

            </div>

            <div className="p-6 space-y-5">

              {viewingExam.description && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-[#123B5D] dark:text-blue-300 mb-2">
                    Description
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-6">
                    {viewingExam.description}
                  </p>

                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">

                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <CalendarDays size={17} />
                    <span className="text-xs font-medium">
                      Exam Date
                    </span>
                  </div>

                  <p className="font-bold text-gray-800 dark:text-white">
                    {formatDate(
                      viewingExam.exam_date
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">

                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Clock size={17} />
                    <span className="text-xs font-medium">
                      Time
                    </span>
                  </div>

                  <p className="font-bold text-gray-800 dark:text-white">
                    {formatTime(
                      viewingExam.start_time
                    )}{' '}
                    -{' '}
                    {formatTime(
                      viewingExam.end_time
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">

                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <MapPin size={17} />
                    <span className="text-xs font-medium">
                      Venue
                    </span>
                  </div>

                  <p className="font-bold text-gray-800 dark:text-white">
                    {viewingExam.venue ||
                      'Not specified'}
                  </p>

                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">

                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users size={17} />
                    <span className="text-xs font-medium">
                      Capacity
                    </span>
                  </div>

                  <p className="font-bold text-gray-800 dark:text-white">
                    {viewingExam.capacity
                      ? `${viewingExam.capacity} applicants`
                      : 'Unlimited'}
                  </p>

                </div>

              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Examination Status
                    </p>

                    <p className="font-semibold text-gray-800 dark:text-white mt-1">
                      {viewingExam.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </p>

                  </div>

                  {viewingExam.is_active ? (
                    <CheckCircle
                      size={24}
                      className="text-green-500"
                    />
                  ) : (
                    <XCircle
                      size={24}
                      className="text-gray-400"
                    />
                  )}

                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setViewingExam(null);
                    editExam(
                      viewingExam
                    );
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-3 rounded-xl font-semibold transition"
                >
                  <Pencil size={17} />
                  Edit Exam
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewingExam(null)
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-3 rounded-xl font-semibold transition"
                >
                  <X size={17} />
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

const EntranceExamsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <EntranceExams confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default EntranceExamsWrapper;

