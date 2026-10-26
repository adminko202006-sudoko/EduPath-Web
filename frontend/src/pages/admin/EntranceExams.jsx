import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  Award,
  Save,
  Unlock,
} from 'lucide-react';

import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import ExamAssignmentDialog from './ExamAssignmentDialog';
import ExamRosterPanel from '../../components/ExamRosterPanel';

const EntranceExams = ({ confirm }) => {
  const { token } = useAuth();

  const [exams, setExams] = useState([]);
  const loadVersion = useRef(0);

  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const [assigningExam, setAssigningExam] = useState(null);

  const [saving, setSaving] = useState(false);
  const [rosterFile, setRosterFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [savingAssignmentId, setSavingAssignmentId] = useState(null);
  const [releasingResults, setReleasingResults] = useState(false);

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

  const loadExams = useCallback(async (isRefresh = false) => {
    const version = ++loadVersion.current;
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

      const loadedExams = Array.isArray(data) ? data : data?.data || [];
      if (version !== loadVersion.current) return [];
      setExams(loadedExams);
      return loadedExams;
    } catch (err) {
      if (version !== loadVersion.current) return [];
      console.error('Failed to load exams:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load entrance exams.'
      );
      return [];
    } finally {
      if (version === loadVersion.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, [token]);
  useAutoRefresh(async () => {
    await loadExams(true);
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    queueMicrotask(() => {
      loadExams();
    });
  }, [token, loadExams]);

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
    setRosterFile(null);
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
    setRosterFile(null);
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
    if (saving) return;

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

      if (rosterFile) {
        const multipart = new FormData();
        Object.entries(payload).forEach(([key, value]) => multipart.append(key, value === null ? '' : typeof value === 'boolean' ? (value ? '1' : '0') : String(value)));
        multipart.append('roster_pdf', rosterFile);
        if (editingExam) multipart.append('_method', 'PUT');
        const response = await api.post(editingExam ? `/admin/exams/${editingExam.id}` : '/admin/exams', multipart);
        setSuccess(response.data?.message || 'Entrance exam and roster PDF saved.');
      } else if (editingExam) {
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
    setRosterFile(null);
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
  // EXAM RESULTS: SAVE SCORES AND OFFICIAL RELEASE
  // =========================================================

  const saveAssignmentResult = async (event, assignment) => {
    event.preventDefault();
    if (!viewingExam || !assignment?.id) return;

    const formData = new FormData(event.currentTarget);
    const rawScore = String(formData.get('score') ?? '').trim();
    const payload = {
      status: String(formData.get('status') || 'scheduled'),
      score: rawScore === '' ? null : Number(rawScore),
      remarks: String(formData.get('remarks') || '').trim() || null,
    };

    if (payload.score !== null && (!Number.isFinite(payload.score) || payload.score < 0 || payload.score > 100)) {
      setError('Score must be between 0 and 100.');
      return;
    }

    try {
      setSavingAssignmentId(assignment.id);
      setError('');
      setSuccess('');
      const response = await api.put(
        `/admin/exams/${viewingExam.id}/assignments/${assignment.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data?.message || 'Applicant result saved successfully.');
      const refreshed = await loadExams(true);
      const updatedExam = refreshed.find((exam) => Number(exam.id) === Number(viewingExam.id));
      if (updatedExam) setViewingExam(updatedExam);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save the applicant result.');
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const releaseExamResults = async () => {
    if (!viewingExam) return;
    const confirmed = await confirm({
      title: 'Release Exam Results',
      message: `Release the official results for "${viewingExam.title}"? Applicants will be able to view their scores and remarks.`,
      confirmLabel: 'Release Results',
      destructive: false,
    });
    if (!confirmed) return;

    try {
      setReleasingResults(true);
      setError('');
      setSuccess('');
      const response = await api.post(
        `/admin/exams/${viewingExam.id}/release-results`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSuccess(response.data?.message || 'Exam results released successfully.');
      const refreshed = await loadExams(true);
      const updatedExam = refreshed.find((exam) => Number(exam.id) === Number(viewingExam.id));
      if (updatedExam) setViewingExam(updatedExam);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release exam results.');
    } finally {
      setReleasingResults(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const deleteExam = async (exam) => {
    if (exam.results_released_at || exam.exam_assignments?.length) {
      setError('This examination has applicant records or released results. Deactivate it to preserve its history.');
      return;
    }
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

      const payload = { is_active: !exam.is_active };

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
          <div className="ep-page-banner ep-brand-gradient p-6 sm:p-8">
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

      <div className="ep-page-banner relative overflow-hidden rounded-2xl shadow-lg ep-brand-gradient">

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
        <ErrorMessage message={error}><div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-4 rounded-2xl animate-fade-up">

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

            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">100 questions, 100 points. Passing score: 40/100 (40%). FHE approval and awarding require an officially released passing result.</p>

            <div className="flex flex-wrap gap-2" aria-label="Session time presets">
              {[
                ['08:00', '10:00', '8:00 AM - 10:00 AM'],
                ['10:00', '12:00', '10:00 AM - 12:00 PM'],
                ['13:00', '14:00', '1:00 PM - 2:00 PM'],
                ['14:00', '16:00', '2:00 PM - 4:00 PM'],
              ].map(([start, end, label]) => <button key={start} type="button" onClick={() => setForm(previous => ({ ...previous, start_time: start, end_time: end }))} className={`min-h-11 rounded-lg border px-3 py-2 text-sm ${form.start_time === start && form.end_time === end ? 'border-[#123B5D] bg-[#123B5D] text-white' : 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200'}`}>{label}</button>)}
            </div>

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

            <label className="grid gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Prepared applicant roster (optional PDF, up to 10 MB)
              <input key={editingExam?.id ?? 'new'} type="file" accept=".pdf,application/pdf" disabled={saving} onChange={event => setRosterFile(event.target.files?.[0] || null)} className="w-full min-w-0 rounded-xl border border-gray-200 p-3 dark:border-gray-700" />
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Assign applicants after saving to generate a roster and make session PDFs available to them. Include names and schedule details only.</span>
            </label>

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

                          <button type="button" onClick={() => setAssigningExam(exam)} disabled={!exam.is_active || Boolean(exam.results_released_at)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#0B2941] disabled:cursor-not-allowed disabled:opacity-40"><Users size={17} />Assign Applicants</button>

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

                          {/* Assigned exams are retained; use Deactivate. */}

                          <button
                            type="button"
                            onClick={() =>
                              deleteExam(exam)
                            }
                            disabled={
                              deletingId ===
                              exam.id || Boolean(exam.results_released_at) || (exam.exam_assignments?.length || 0) > 0
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
                              : (exam.results_released_at || exam.exam_assignments?.length) ? 'History retained' : 'Delete'}

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
        <ModalPortal onEscape={() => setViewingExam(null)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Entrance Exam Details"
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">

            <div className="ep-brand-gradient sticky top-0 z-10 px-6 py-5">

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

              <ExamRosterPanel key={viewingExam.id} exam={viewingExam} onUpdated={updated => {
                setViewingExam(previous => ({ ...previous, ...updated }));
                setExams(previous => previous.map(exam => exam.id === updated.id ? { ...exam, ...updated } : exam));
              }} />

              <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                      <Award size={18} className="text-[#C99A00]" /> Applicant Results
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
                      100 questions / 100 points. Passing score: 40/100. Scores and remarks remain private until official release.
                    </p>
                  </div>
                  {viewingExam.results_released_at ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle size={15} /> Results Released
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={releaseExamResults}
                      disabled={releasingResults}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-[#0F3553] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {releasingResults ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                      {releasingResults ? 'Releasing…' : 'Release Results'}
                    </button>
                  )}
                </div>

                {error && (
                  <ErrorMessage message={error}><p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</p></ErrorMessage>
                )}
                {success && (
                  <p role="status" className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">{success}</p>
                )}

                {(() => {
                  const assignments = viewingExam.exam_assignments || viewingExam.examAssignments || [];
                  if (!assignments.length) {
                    return <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">No applicants are assigned to this exam yet. Results cannot be released until assignments exist.</p>;
                  }
                  return <div className="mt-4 space-y-3">{assignments.map((assignment) => {
                    const user = assignment.applicant?.user || {};
                    const applicantName = user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Applicant';
                    return (
                      <form key={assignment.id} onSubmit={(event) => saveAssignmentResult(event, assignment)} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/70">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold text-gray-900 dark:text-white">{applicantName}</p>

                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Attendance / Result Status
                            <select name="status" defaultValue={assignment.status || 'scheduled'} disabled={Boolean(viewingExam.results_released_at)} className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                              <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="absent">Absent</option>
                            </select>
                          </label>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Score out of 100 (passing: 40)
                            <input name="score" type="number" min="0" max="100" step="0.01" defaultValue={assignment.score ?? ''} disabled={Boolean(viewingExam.results_released_at)} placeholder="Score out of 100" className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                          </label>
                        </div>
                        <label className="mt-3 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                          Remarks
                          <textarea name="remarks" rows="2" maxLength="5000" defaultValue={assignment.remarks || ''} disabled={Boolean(viewingExam.results_released_at)} placeholder="Optional remarks for the applicant" className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                        </label>
                        {!viewingExam.results_released_at && <div className="mt-3 flex justify-end"><button type="submit" disabled={savingAssignmentId === assignment.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#123B5D] px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-[#0F3553] disabled:cursor-not-allowed disabled:opacity-60">{savingAssignmentId === assignment.id ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{savingAssignmentId === assignment.id ? 'Saving…' : 'Save Result'}</button></div>}
                      </form>
                    );
                  })}</div>;
                })()}
              </section>

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
        </ModalPortal>
      )}

      {assigningExam && <ExamAssignmentDialog exam={assigningExam} onClose={() => setAssigningExam(null)} onAssigned={(updatedExam, message) => {
        setExams((current) => current.map((item) => item.id === updatedExam.id ? updatedExam : item));
        setSuccess(message || 'Applicants assigned successfully.');
        setError('');
      }} />}

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

