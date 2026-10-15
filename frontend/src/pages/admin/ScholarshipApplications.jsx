import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock3,
  Eye,
  X,
  RefreshCw,
  Filter,
  User,
  Mail,
  BookOpen,
  CalendarDays,
  FileText,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-2 h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
  </div>
);

const SkeletonTable = () => (
  <div className="space-y-3 p-5">
    {[1, 2, 3, 4, 5].map((item) => (
      <div
        key={item}
        className="animate-pulse rounded-xl border border-slate-200 p-4 dark:border-slate-700"
      >
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-700" />

          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-56 rounded bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="hidden h-8 w-24 rounded bg-slate-200 dark:bg-slate-700 md:block" />
          <div className="hidden h-8 w-20 rounded bg-slate-200 dark:bg-slate-700 md:block" />
        </div>
      </div>
    ))}
  </div>
);

const AdminScholarshipApplications = () => {
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  const [updating, setUpdating] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchApplications = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get(
        '/admin/scholarship-applications',
        authConfig
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setApplications(data);
      } else if (Array.isArray(data?.data)) {
        setApplications(data.data);
      } else if (Array.isArray(data?.applications)) {
        setApplications(data.applications);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to load scholarship applications:', err);

      setApplications([]);

      if (err.response?.status === 401) {
        setError('Unauthorized access. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view scholarship applications.');
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to load scholarship applications.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchApplications();
    }
  }, [token]);

  const getApplicant = (application) => {
    return (
      application?.applicant ||
      application?.admission_application?.applicant ||
      application?.student ||
      {}
    );
  };

  const getUser = (application) => {
    const applicant = getApplicant(application);

    return applicant?.user || application?.user || {};
  };

  const getApplicantName = (application) => {
    const applicant = getApplicant(application);
    const user = getUser(application);

    if (applicant?.first_name || applicant?.last_name) {
      return [
        applicant?.first_name,
        applicant?.middle_name,
        applicant?.last_name,
      ]
        .filter(Boolean)
        .join(' ');
    }

    return (
      user?.name ||
      applicant?.name ||
      application?.applicant_name ||
      'Unknown Applicant'
    );
  };

  const getApplicantEmail = (application) => {
    const applicant = getApplicant(application);
    const user = getUser(application);

    return (
      user?.email ||
      applicant?.email ||
      application?.applicant_email ||
      'No email available'
    );
  };

  const getScholarship = (application) => {
    return application?.scholarship || {};
  };

  const getScholarshipName = (application) => {
    const scholarship = getScholarship(application);

    return (
      scholarship?.name ||
      scholarship?.title ||
      application?.scholarship_name ||
      'Scholarship'
    );
  };

  const getProgramName = (application) => {
    const applicant = getApplicant(application);
    const admission = application?.admission_application || {};

    return (
      applicant?.academic_program?.name ||
      admission?.academic_program?.name ||
      applicant?.program?.name ||
      application?.program?.name ||
      application?.program_name ||
      'Not specified'
    );
  };

  const getStatus = (application) => {
    return String(application?.status || 'pending').toLowerCase();
  };

  const formatStatus = (status) => {
    switch (String(status).toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
      case 'under review':
        return 'Under Review';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getStatusClasses = (status) => {
    switch (String(status).toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';

      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

      case 'under_review':
      case 'under review':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

      case 'pending':
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const applicantName = getApplicantName(application).toLowerCase();
      const applicantEmail = getApplicantEmail(application).toLowerCase();
      const scholarshipName = getScholarshipName(application).toLowerCase();
      const programName = getProgramName(application).toLowerCase();

      const matchesSearch =
        !query ||
        applicantName.includes(query) ||
        applicantEmail.includes(query) ||
        scholarshipName.includes(query) ||
        programName.includes(query);

      const status = getStatus(application);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const totalCount = applications.length;

  const pendingCount = applications.filter(
    (application) => getStatus(application) === 'pending'
  ).length;

  const approvedCount = applications.filter(
    (application) => getStatus(application) === 'approved'
  ).length;

  const rejectedCount = applications.filter(
    (application) => getStatus(application) === 'rejected'
  ).length;

  const underReviewCount = applications.filter((application) => {
    const status = getStatus(application);

    return status === 'under_review' || status === 'under review';
  }).length;

  const formatDate = (date) => {
    if (!date) return 'Not available';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openReviewModal = (application) => {
    setSelectedApplication(application);
    setNewStatus(getStatus(application));
    setRemarks(application?.remarks || '');
    setMessage('');
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (updating) return;

    setShowModal(false);
    setSelectedApplication(null);
    setNewStatus('');
    setRemarks('');
  };

  const updateApplication = async () => {
    if (!selectedApplication) return;

    try {
      setUpdating(true);
      setMessage('');
      setError('');

      const response = await api.put(
        `/admin/scholarship-applications/${selectedApplication.id}`,
        {
          status: newStatus,
          remarks: remarks || null,
        },
        authConfig
      );

      const updatedApplication =
        response.data?.data ||
        response.data?.application ||
        response.data;

      setApplications((previous) =>
        previous.map((application) =>
          application.id === selectedApplication.id
            ? {
                ...application,
                ...(updatedApplication || {}),
                status: newStatus,
                remarks: remarks || null,
              }
            : application
        )
      );

      setSelectedApplication((previous) =>
        previous
          ? {
              ...previous,
              ...(updatedApplication || {}),
              status: newStatus,
              remarks: remarks || null,
            }
          : previous
      );

      setMessage('Scholarship application updated successfully.');

      setTimeout(() => {
        setShowModal(false);
        setSelectedApplication(null);
        setMessage('');
      }, 1000);
    } catch (err) {
      console.error('Failed to update scholarship application:', err);

      if (err.response?.status === 401) {
        setError('Unauthorized access. Please log in again.');
      } else if (err.response?.status === 403) {
        setError(
          'You do not have permission to update this scholarship application.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to update scholarship application.'
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] px-4 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <section className="ep-brand-gradient overflow-hidden rounded-2xl bg-[#123B5D] shadow-lg">
          <div className="relative px-6 py-8 sm:px-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 right-24 h-48 w-48 rounded-full bg-white/5 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                  <GraduationCap size={30} />
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium text-white/70">
                    Admin Portal
                  </p>

                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    Scholarship Applications
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                    Review, manage, and update scholarship applications
                    submitted by applicants.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchApplications(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#123B5D] shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? 'animate-spin' : ''}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && !showModal && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="mt-0.5 shrink-0" size={19} />

            <div className="flex-1">
              <p className="font-semibold">Unable to load applications</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => fetchApplications()}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="ep-card ep-hover-lift rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Total Applications
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                    {totalCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <FileText size={21} />
                </div>
              </div>
            </div>

            <div className="ep-card ep-hover-lift rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Pending
                  </p>

                  <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {pendingCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Clock3 size={21} />
                </div>
              </div>
            </div>

            <div className="ep-card ep-hover-lift rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Under Review
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {underReviewCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <ShieldCheck size={21} />
                </div>
              </div>
            </div>

            <div className="ep-card ep-hover-lift rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Approved
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {approvedCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 size={21} />
                </div>
              </div>
            </div>

            <div className="ep-card ep-hover-lift rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Rejected
                  </p>

                  <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                    {rejectedCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <XCircle size={21} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant, email, scholarship, or program..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-[#123B5D] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filteredApplications.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {applications.length}
              </span>{' '}
              applications
            </span>

            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="font-semibold text-[#123B5D] hover:underline dark:text-blue-400"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* Applications */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <SkeletonTable />
          ) : filteredApplications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                <GraduationCap size={30} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-800 dark:text-white">
                No scholarship applications found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'There are currently no scholarship applications to review.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Applicant
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Scholarship
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Program
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredApplications.map((application) => {
                      const status = getStatus(application);

                      return (
                        <tr
                          key={application.id}
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-700/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-900/30 dark:text-blue-400">
                                <User size={18} />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800 dark:text-white">
                                  {getApplicantName(application)}
                                </p>

                                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <Mail size={12} />
                                  <span className="max-w-[180px] truncate">
                                    {getApplicantEmail(application)}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                <GraduationCap size={17} />
                              </div>

                              <span className="max-w-[190px] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                {getScholarshipName(application)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <BookOpen size={16} className="text-slate-400" />
                              <span className="max-w-[170px] truncate">
                                {getProgramName(application)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <CalendarDays
                                size={16}
                                className="text-slate-400"
                              />
                              {formatDate(
                                application.created_at ||
                                  application.applied_at ||
                                  application.application_date
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                status
                              )}`}
                            >
                              {formatStatus(status)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openReviewModal(application)}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#123B5D] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2f4b]"
                            >
                              <Eye size={16} />
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-700">
                {filteredApplications.map((application) => {
                  const status = getStatus(application);

                  return (
                    <div
                      key={application.id}
                      className="p-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-900/30 dark:text-blue-400">
                            <User size={19} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-slate-800 dark:text-white">
                              {getApplicantName(application)}
                            </h3>

                            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                              {getApplicantEmail(application)}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                            status
                          )}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Scholarship
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <GraduationCap
                              size={15}
                              className="shrink-0 text-indigo-500"
                            />
                            <span className="truncate">
                              {getScholarshipName(application)}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/60">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Program
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <BookOpen
                              size={15}
                              className="shrink-0 text-blue-500"
                            />
                            <span className="truncate">
                              {getProgramName(application)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <CalendarDays size={14} />
                          {formatDate(
                            application.created_at ||
                              application.applied_at ||
                              application.application_date
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => openReviewModal(application)}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#123B5D] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2f4b]"
                        >
                          <Eye size={16} />
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Review Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#123B5D] dark:text-blue-400">
                  Admin Review
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
                  Scholarship Application
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={updating}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Applicant Info */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-900/30 dark:text-blue-400">
                    <User size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">
                      {getApplicantName(selectedApplication)}
                    </h3>

                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Mail size={14} />
                      {getApplicantEmail(selectedApplication)}
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Program
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {getProgramName(selectedApplication)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Scholarship
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {getScholarshipName(selectedApplication)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <FileText size={17} className="text-[#123B5D] dark:text-blue-400" />
                  Application Details
                </h3>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Application ID
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        #{selectedApplication.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Submitted
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {formatDate(
                          selectedApplication.created_at ||
                            selectedApplication.applied_at ||
                            selectedApplication.application_date
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="application-status"
                  className="mb-2 block text-sm font-semibold text-slate-800 dark:text-white"
                >
                  Application Status
                </label>

                <select
                  id="application-status"
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  disabled={updating}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label
                  htmlFor="application-remarks"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"
                >
                  <MessageSquare size={16} />
                  Remarks
                </label>

                <textarea
                  id="application-remarks"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={updating}
                  rows={5}
                  placeholder="Enter remarks or notes about this application..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              {/* Modal Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Modal Success */}
              {message && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={updating}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={updateApplication}
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d2f4b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminScholarshipApplications;