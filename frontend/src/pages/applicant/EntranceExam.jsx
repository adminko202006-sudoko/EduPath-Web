import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardCheck,
  CalendarDays,
  Clock3,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Award,
  Info,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EntranceExam = () => {
  const { token } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ==========================================
  // LOAD ASSIGNED ENTRANCE EXAMS
  // ==========================================

  const loadExams = useCallback(async (isRefresh = false) => {
    if (!token) {
      setExams([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get('/applicant/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = response.data;

      // Laravel normally returns { success, message, data: [...] }.
      const examData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      setExams(examData);
    } catch (err) {
      console.error('Failed to load entrance exams:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load entrance examination information. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // ==========================================
  // FORMAT DATE WITHOUT DATE-ONLY TIMEZONE SHIFT
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'Not scheduled';
    }

    // Laravel date columns may serialize as YYYY-MM-DD or ISO timestamps.
    const datePart = String(dateValue).slice(0, 10);
    const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      const parsedDate = new Date(dateValue);

      if (Number.isNaN(parsedDate.getTime())) {
        return 'Not scheduled';
      }

      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const [, year, month, day] = match;
    const localDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return 'Not scheduled';
    }

    const match = String(timeValue).match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
      return 'Not scheduled';
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return 'Not scheduled';
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          className:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20',
          icon: ClipboardCheck,
          iconClass: 'text-blue-600 dark:text-blue-300',
        };

      case 'completed':
        return {
          label: 'Completed',
          className:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-400/20',
          icon: CheckCircle2,
          iconClass: 'text-green-600 dark:text-green-300',
        };

      case 'absent':
        return {
          label: 'Absent',
          className:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/20',
          icon: XCircle,
          iconClass: 'text-red-600 dark:text-red-300',
        };

      case 'cancelled':
        return {
          label: 'Cancelled',
          className:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/20',
          icon: XCircle,
          iconClass: 'text-red-600 dark:text-red-300',
        };

      case 'pending':
        return {
          label: 'Pending',
          className:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20',
          icon: Clock3,
          iconClass: 'text-amber-600 dark:text-amber-300',
        };

      default:
        return {
          label: status || 'Pending',
          className:
            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10',
          icon: AlertCircle,
          iconClass: 'text-gray-500 dark:text-gray-400',
        };
    }
  };

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const scheduledCount = exams.filter(
    (assignment) => assignment.status?.toLowerCase() === 'scheduled'
  ).length;

  const completedCount = exams.filter(
    (assignment) => assignment.status?.toLowerCase() === 'completed'
  ).length;

  const summaryCards = [
    {
      label: 'Assigned Exams',
      count: exams.length,
      icon: FileText,
      iconClass: 'text-[#123B5D] dark:text-blue-300',
      iconBackground: 'bg-[#123B5D]/10 dark:bg-blue-400/10',
      countClass: 'text-[#123B5D] dark:text-white',
    },
    {
      label: 'Scheduled',
      count: scheduledCount,
      icon: Clock3,
      iconClass: 'text-blue-600 dark:text-blue-300',
      iconBackground: 'bg-blue-50 dark:bg-blue-400/10',
      countClass: 'text-blue-600 dark:text-blue-300',
    },
    {
      label: 'Completed',
      count: completedCount,
      icon: CheckCircle2,
      iconClass: 'text-green-600 dark:text-green-300',
      iconBackground: 'bg-green-50 dark:bg-green-400/10',
      countClass: 'text-green-600 dark:text-green-300',
    },
  ];

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-white/10" />

            <div className="flex-1 space-y-2">
              <div className="h-6 w-64 max-w-full rounded-lg bg-gray-200 dark:bg-white/10" />
              <div className="h-4 w-80 max-w-full rounded-lg bg-gray-100 dark:bg-white/5" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-[#10263A]"
              />
            ))}
          </div>

          <div className="h-64 rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-[#10263A]" />
        </div>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Loading entrance examination information...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#123B5D] shadow-sm">
            <ClipboardCheck size={23} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#123B5D] dark:text-white sm:text-3xl">
              Entrance Examination
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
              View your assigned examination schedules and results.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadExams(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#123B5D] shadow-sm transition-colors duration-200 ease-in-out hover:border-[#123B5D]/30 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#10263A] dark:text-blue-200 dark:hover:bg-white/5"
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'animate-spin' : ''}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Unable to load examination information
            </p>

            <p className="mt-1 text-sm">{error}</p>

            <button
              type="button"
              onClick={() => loadExams(true)}
              disabled={refreshing}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-75 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {exams.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md dark:border-white/10 dark:bg-[#10263A]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {card.label}
                    </p>

                    <p className={`mt-2 text-3xl font-bold ${card.countClass}`}>
                      {card.count}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBackground}`}
                  >
                    <Icon size={21} className={card.iconClass} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EMPTY STATE */}
      {exams.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm dark:border-white/10 dark:bg-[#10263A] sm:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#123B5D]/10 dark:bg-blue-400/10">
            <ClipboardCheck
              size={38}
              className="text-[#123B5D] dark:text-blue-300"
            />
          </div>

          <h2 className="mt-6 text-xl font-bold text-[#123B5D] dark:text-white">
            No Entrance Exams Available
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
            Your entrance examination schedule will appear here when you
            qualify for an active upcoming exam with available capacity.
            Please check again later for updates.
          </p>

          <button
            type="button"
            onClick={() => loadExams(true)}
            disabled={refreshing}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-in-out hover:bg-[#0f3553] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            {refreshing ? 'Checking...' : 'Check for Exams'}
          </button>
        </div>
      ) : (
        /* EXAM LIST */
        <div className="space-y-6">
          {exams.map((assignment) => {
            // Laravel normally serializes entranceExam as entrance_exam.
            const exam =
              assignment.entrance_exam ?? assignment.entranceExam;

            const status = getStatusConfig(assignment.status);
            const StatusIcon = status.icon;

            return (
              <article
                key={assignment.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md dark:border-white/10 dark:bg-[#10263A]"
              >
                {/* EXAM HEADER */}
                <div className="bg-[#123B5D] px-5 py-6 dark:bg-gradient-to-r dark:from-[#10263A] dark:to-[#123B5D] sm:px-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                        <ClipboardCheck size={24} className="text-white" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-xl font-bold text-white sm:text-2xl">
                          {exam?.title || 'Entrance Examination'}
                        </h2>

                        {exam?.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                            {exam.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold ${status.className}`}
                    >
                      <StatusIcon
                        size={16}
                        className={status.iconClass}
                      />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* EXAM DETAILS */}
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* DATE */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <CalendarDays size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Exam Date
                        </p>
                      </div>

                      <p className="mt-2 font-bold text-[#123B5D] dark:text-white">
                        {formatDate(exam?.exam_date)}
                      </p>
                    </div>

                    {/* TIME */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock3 size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Exam Time
                        </p>
                      </div>

                      <p className="mt-2 font-bold text-[#123B5D] dark:text-white">
                        {formatTime(exam?.start_time)}
                        {' - '}
                        {formatTime(exam?.end_time)}
                      </p>
                    </div>

                    {/* VENUE */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <MapPin size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Venue
                        </p>
                      </div>

                      <p className="mt-2 break-words font-bold text-gray-800 dark:text-gray-200">
                        {exam?.venue || 'Not specified'}
                      </p>
                    </div>

                    {/* ASSIGNMENT REFERENCE */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <FileText size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Assignment Reference
                        </p>
                      </div>

                      <p className="mt-2 font-bold text-[#123B5D] dark:text-white">
                        #{assignment.id}
                      </p>
                    </div>
                  </div>

                  {/* IMPORTANT INFORMATION */}
                  <div className="mt-6 rounded-2xl border border-[#123B5D]/10 bg-[#123B5D]/5 p-5 dark:border-blue-400/15 dark:bg-blue-400/5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#123B5D] dark:bg-blue-500">
                        <Info size={18} className="text-white" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-[#123B5D] dark:text-blue-200">
                          Examination Information
                        </h3>

                        <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-[#C99A00]">
                              •
                            </span>
                            <span>
                              Arrive at the venue before your scheduled
                              examination time.
                            </span>
                          </li>

                          <li className="flex items-start gap-2">
                            <span className="font-bold text-[#C99A00]">
                              •
                            </span>
                            <span>
                              Bring a valid identification document.
                            </span>
                          </li>

                          <li className="flex items-start gap-2">
                            <span className="font-bold text-[#C99A00]">
                              •
                            </span>
                            <span>
                              Follow all instructions provided by the
                              examination personnel.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* EXAM RESULT */}
                  {(assignment.score !== null &&
                    assignment.score !== undefined) ||
                  assignment.remarks ? (
                    <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/60 p-5 dark:border-green-400/15 dark:bg-green-500/5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600">
                          <Award size={18} className="text-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-green-800 dark:text-green-300">
                            Examination Result
                          </h3>

                          <div className="mt-4 space-y-3">
                            {assignment.score !== null &&
                              assignment.score !== undefined && (
                                <div className="flex items-center justify-between gap-4 rounded-xl border border-green-100 bg-white px-4 py-3 dark:border-green-400/10 dark:bg-[#10263A]">
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Score
                                  </span>

                                  <span className="text-lg font-bold text-green-700 dark:text-green-300">
                                    {assignment.score}
                                  </span>
                                </div>
                              )}

                            {assignment.remarks && (
                              <div className="rounded-xl border border-green-100 bg-white px-4 py-3 dark:border-green-400/10 dark:bg-[#10263A]">
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  Remarks
                                </p>

                                <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                                  {assignment.remarks}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* FOOTER */}
                  <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <StatusIcon
                        size={16}
                        className={status.iconClass}
                      />

                      <span>
                        Status:{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {status.label}
                        </span>
                      </span>
                    </div>

                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      EduPath · Trinidad Municipal College
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EntranceExam;
