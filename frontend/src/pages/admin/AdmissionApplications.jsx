import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  Filter,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdmissionApplications = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // ==========================================
  // LOAD APPLICATIONS
  // ==========================================

  const loadApplications = async (showRefresh = false) => {
    try {
      setError('');

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        '/admin/admission-applications',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setApplications(
        Array.isArray(data)
          ? data
          : data.data || []
      );
    } catch (err) {
      console.error(
        'Failed to load admission applications:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load admission applications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    if (!token) {
      return;
    }

    loadApplications();
  }, [token]);

  // ==========================================
  // FORMAT NAME
  // ==========================================

  const formatName = (applicant) => {
    if (!applicant) {
      return 'Applicant';
    }

    return (
      [
        applicant.first_name,
        applicant.middle_name,
        applicant.last_name,
      ]
        .filter(Boolean)
        .join(' ') || 'Applicant'
    );
  };

  // ==========================================
  // GET INITIALS
  // ==========================================

  const getInitials = (applicant) => {
    const name = formatName(applicant);

    const parts = name
      .split(' ')
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return 'Not provided';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not provided';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  // ==========================================
  // FILTER APPLICATIONS
  // ==========================================

  const filteredApplications =
    applications.filter((application) => {
      const applicant =
        application.applicant;

      const fullName =
        formatName(applicant).toLowerCase();

      const email =
        applicant?.user?.email?.toLowerCase() ||
        '';

      const program =
        application.academic_program?.name?.toLowerCase() ||
        '';

      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        fullName.includes(searchValue) ||
        email.includes(searchValue) ||
        program.includes(searchValue);

      const matchesStatus =
        status === 'all' ||
        application.status === status;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const getStatusConfig = (
    applicationStatus
  ) => {
    switch (applicationStatus) {
      case 'approved':
        return {
          label: 'Approved',
          className:
            'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300',
          icon: CheckCircle,
        };

      case 'rejected':
        return {
          label: 'Rejected',
          className:
            'border-red-100 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300',
          icon: XCircle,
        };

      case 'pending':
      default:
        return {
          label: 'Pending',
          className:
            'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
          icon: Clock,
        };
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalApplications =
    applications.length;

  const pendingApplications =
    applications.filter(
      (application) =>
        application.status === 'pending'
    ).length;

  const approvedApplications =
    applications.filter(
      (application) =>
        application.status === 'approved'
    ).length;

  const rejectedApplications =
    applications.filter(
      (application) =>
        application.status === 'rejected'
    ).length;

  // ==========================================
  // INITIAL LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6 page-transition">

        {/* ==========================================
            HERO SKELETON
        ========================================== */}

        <section className="ep-skeleton relative overflow-hidden rounded-2xl p-6 shadow-lg sm:p-8">

          <div className="relative">

            <div className="h-6 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />

            <div className="mt-4 h-9 w-80 rounded-lg bg-gray-200 dark:bg-gray-700" />

            <div className="mt-3 h-4 w-full max-w-2xl rounded bg-gray-200 dark:bg-gray-700" />

            <div className="mt-2 h-4 w-2/3 max-w-xl rounded bg-gray-200 dark:bg-gray-700" />

          </div>

        </section>

        {/* ==========================================
            STAT SKELETONS
        ========================================== */}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="ep-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">

                <div className="space-y-3">

                  <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />

                  <div className="h-9 w-16 rounded bg-gray-200 dark:bg-gray-700" />

                  <div className="h-3 w-36 rounded bg-gray-200 dark:bg-gray-700" />

                </div>

                <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />

              </div>

              <div className="mt-5 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />

            </div>
          ))}

        </section>

        {/* ==========================================
            SEARCH SKELETON
        ========================================== */}

        <section className="ep-card rounded-2xl p-5 sm:p-6">

          <div className="flex items-center gap-3">

            <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-2">

              <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700" />

              <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">

            <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />

            <div className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />

          </div>

        </section>

        {/* ==========================================
            TABLE SKELETON
        ========================================== */}

        <section className="ep-card overflow-hidden rounded-2xl">

          <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">

            <div className="flex items-center gap-3">

              <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">

                <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />

                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />

              </div>

            </div>

          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="p-5 sm:p-6"
              >
                <div className="flex items-center gap-4">

                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />

                  <div className="flex-1 space-y-3">

                    <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />

                    <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />

                  </div>

                  <div className="hidden h-8 w-24 rounded-full bg-gray-200 dark:bg-gray-700 sm:block" />

                  <div className="hidden h-9 w-20 rounded-xl bg-gray-200 dark:bg-gray-700 lg:block" />

                </div>
              </div>
            ))}

          </div>

        </section>

        {/* ==========================================
            LOADING MESSAGE
        ========================================== */}

        <div className="flex items-center justify-center py-2">

          <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />

          <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            Loading admission applications...
          </span>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">

      {/* ==========================================
          HERO
      ========================================== */}

      <section className="ep-brand-gradient relative overflow-hidden rounded-2xl p-6 shadow-lg sm:p-8">

        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl" />

        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-amber-300/10 blur-2xl" />

        <div className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-white/5 blur-xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="animate-fade-up">

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">

              <ShieldCheck className="h-4 w-4 text-amber-300" />

              Administration

            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Admission Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Review, monitor, and manage student admission applications for Trinidad Municipal College.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadApplications(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold text-white shadow-lg ring-1 ring-white/20 transition-colors duration-200  hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <RefreshCw
              className={`h-5 w-5 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh Applications'}

          </button>

        </div>

      </section>

      {/* ==========================================
          ALERT
      ========================================== */}

      {error && (
        <div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50">

            <AlertCircle className="h-5 w-5" />

          </div>

          <div className="min-w-0">

            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm leading-5">
              {error}
            </p>

          </div>

        </div>
      )}

      {/* ==========================================
          STATISTICS
      ========================================== */}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total Applications"
          value={totalApplications}
          icon={FileText}
          iconClass="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          description="All submitted applications"
          delay="0ms"
        />

        <StatCard
          label="Pending Review"
          value={pendingApplications}
          icon={Clock}
          iconClass="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          description="Awaiting decision"
          delay="80ms"
        />

        <StatCard
          label="Approved"
          value={approvedApplications}
          icon={CheckCircle}
          iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          description="Approved applications"
          delay="160ms"
        />

        <StatCard
          label="Rejected"
          value={rejectedApplications}
          icon={XCircle}
          iconClass="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
          description="Rejected applications"
          delay="240ms"
        />

      </section>

      {/* ==========================================
          SEARCH & FILTER
      ========================================== */}

      <section className="ep-card animate-fade-up rounded-2xl p-5 sm:p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">

              <Filter className="h-5 w-5" />

            </div>

            <div>

              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Search & Filter
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Find admission applications quickly.
              </p>

            </div>

          </div>

          {(search || status !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('all');
              }}
              className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-semibold text-[#123B5D] transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 sm:self-auto"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}

        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">

          {/* SEARCH */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Search Applications
            </label>

            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search applicant, email, or program..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />

            </div>

          </div>

          {/* STATUS */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Application Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >

              <option value="all">
                All Applications
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>

            </select>

          </div>

        </div>

      </section>

      {/* ==========================================
          RESULTS
      ========================================== */}

      <section className="ep-card animate-fade-up overflow-hidden rounded-2xl">

        {/* RESULTS HEADER */}

        <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">

                <ClipboardList className="h-5 w-5" />

              </div>

              <div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Admission Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filteredApplications.length}{' '}
                  application
                  {filteredApplications.length !== 1
                    ? 's'
                    : ''}{' '}
                  displayed
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">

                <FileText className="h-3.5 w-3.5" />

                {applications.length} Total

              </span>

            </div>

          </div>

        </div>

        {/* ==========================================
            EMPTY STATE
        ========================================== */}

        {filteredApplications.length === 0 ? (

          <div className="p-10 text-center sm:p-12">

            <div className="animate-float mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300">

              <FileText className="h-8 w-8" />

            </div>

            <h3 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
              No Applications Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
              There are currently no admission applications matching your search or selected filter.
            </p>

            {(search || status !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 font-semibold text-white shadow-md transition-colors duration-200  hover:bg-[#0F3553]"
              >

                <X className="h-4 w-4" />

                Clear Filters

              </button>
            )}

          </div>

        ) : (

          /* ==========================================
             TABLE
          ========================================== */

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead>

                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Applicant
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Program
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Submitted
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                {filteredApplications.map(
                  (application) => {

                    const applicant =
                      application.applicant;

                    const statusConfig =
                      getStatusConfig(
                        application.status
                      );

                    const StatusIcon =
                      statusConfig.icon;

                    return (
                      <tr
                        key={application.id}
                        className="group transition-colors duration-200 hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                      >

                        {/* APPLICANT */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] text-xs font-bold text-white transition-transform duration-200 ">

                              {getInitials(
                                applicant
                              )}

                            </div>

                            <div className="min-w-0">

                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatName(
                                  applicant
                                )}
                              </p>

                              <p className="mt-0.5 max-w-[240px] truncate text-xs text-gray-500 dark:text-gray-400">
                                {applicant?.user?.email ||
                                  'No email'}
                              </p>

                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                Application #
                                {application.id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* PROGRAM */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">

                              <GraduationCap className="h-5 w-5" />

                            </div>

                            <div className="min-w-0">

                              <p className="font-semibold text-gray-800 dark:text-gray-200">

                                {application
                                  .academic_program
                                  ?.name ||
                                  'Program not specified'}

                              </p>

                              {application
                                .academic_program
                                ?.code && (
                                <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">

                                  {
                                    application
                                      .academic_program
                                      .code
                                  }

                                </p>
                              )}

                            </div>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusConfig.className}`}
                          >

                            <StatusIcon className="h-3.5 w-3.5" />

                            {statusConfig.label}

                          </span>

                        </td>

                        {/* SUBMITTED */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                            <CalendarDays className="h-4 w-4 text-gray-400 dark:text-gray-500" />

                            {formatDate(
                              application.submitted_at
                            )}

                          </div>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">

                          <div className="flex justify-end">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/admin/admission-applications/${application.id}`
                                )
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200  hover:bg-[#0F3553] hover:shadow-md"
                            >

                              <Eye className="h-4 w-4" />

                              View

                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* ==========================================
          FOOTER
      ========================================== */}

      {filteredApplications.length > 0 && (
        <div className="flex flex-col gap-2 px-1 text-xs text-gray-400 dark:text-gray-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            EduPath • Trinidad Municipal College
          </p>

          <p>
            {filteredApplications.length} displayed
          </p>

        </div>
      )}

    </div>
  );
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClass,
  description,
  delay,
}) => {
  return (
    <div
      className="ep-card ep-hover-lift animate-fade-up rounded-2xl p-5"
      style={{
        animationDelay: delay,
      }}
    >

      <div className="flex items-center justify-between">

        <div className="min-w-0">

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>

        </div>

        <div
          className={`shrink-0 rounded-xl p-3 ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>

      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">

        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#123B5D] to-[#0F766E]" />

      </div>

    </div>
  );
};

export default AdmissionApplications;