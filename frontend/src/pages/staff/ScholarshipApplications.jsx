import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  GraduationCap,
  UserRound,
  Award,
  RefreshCw,
  Filter,
  X,
  Save,
  ShieldCheck,
  Mail,
  BookOpen,
  AlertCircle,
  Target,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ModalPortal from '../../components/ui/ModalPortal';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock3,
    classes:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    classes:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    classes:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  },
};

function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      icon: AlertCircle,
      classes:
        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
    }
  );
}

function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.classes}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return 'Not specified';
  }

  return `₱${Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getApplicantName(application) {
  const applicant = application?.applicant;

  if (!applicant) return 'Applicant';

  const firstName =
    applicant.first_name ||
    applicant.user?.first_name ||
    applicant.user?.name ||
    '';

  const middleName = applicant.middle_name || '';

  const lastName =
    applicant.last_name ||
    applicant.user?.last_name ||
    '';

  return [firstName, middleName, lastName]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Applicant';
}

function getApplicantEmail(application) {
  return (
    application?.applicant?.user?.email ||
    application?.applicant?.email ||
    'No email available'
  );
}

function getPrograms(application) {
  const admissionApplications =
    application?.applicant?.admission_applications || [];

  const programs = admissionApplications
    .map((item) => item?.academic_program)
    .filter(Boolean);

  const unique = [];
  const seen = new Set();

  programs.forEach((program) => {
    const key = program.id || program.code || program.name;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(program);
    }
  });

  return unique;
}

function getPrimaryProgram(application) {
  return getPrograms(application)[0] || null;
}

function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}

export default function ScholarshipApplications() {
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState('pending');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadApplications = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get('/staff/scholarship-applications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApplications(response.data?.data || response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load scholarship applications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadApplications();
    }
  }, [token]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const applicantName = getApplicantName(application).toLowerCase();
      const email = getApplicantEmail(application).toLowerCase();

      const scholarship =
        application?.scholarship?.name?.toLowerCase() || '';

      const programText = getPrograms(application)
        .map((program) => `${program.name || ''} ${program.code || ''}`)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        applicantName.includes(query) ||
        email.includes(query) ||
        scholarship.includes(query) ||
        programText.includes(query) ||
        String(application?.id || '').includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        application?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((item) => item.status === 'pending')
        .length,
      under_review: applications.filter(
        (item) => item.status === 'under_review'
      ).length,
      approved: applications.filter((item) => item.status === 'approved')
        .length,
      rejected: applications.filter((item) => item.status === 'rejected')
        .length,
    }),
    [applications]
  );

  const openReview = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status || 'pending');
    setRemarks(application.remarks || '');
  };

  const closeReview = () => {
    if (updating) return;

    setSelectedApplication(null);
    setRemarks('');
    setNewStatus('pending');
  };

  const updateApplication = async () => {
    if (!selectedApplication) return;

    setUpdating(true);
    setError('');

    try {
      const response = await api.put(
        `/staff/scholarship-applications/${selectedApplication.id}`,
        {
          status: newStatus,
          remarks: remarks.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updated =
        response.data?.data ||
        response.data?.application ||
        null;

      setApplications((current) =>
        current.map((application) =>
          application.id === selectedApplication.id
            ? {
                ...application,
                ...(updated || {}),
                status: newStatus,
                remarks: remarks.trim() || null,
              }
            : application
        )
      );

      closeReview();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update scholarship application.'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="ep-card rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-4">
              <Skeleton className="h-14 w-14" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-28" />
            ))}
          </div>

          <Skeleton className="h-20" />

          <div className="ep-card rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-28" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition min-h-screen bg-[#f4f7fa] px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <section className="ep-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="ep-brand-gradient p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Award size={30} />
                </div>

                <div>
                  <p className="text-sm text-white/75">
                    Staff Portal
                  </p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Scholarship Applications
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-white/80">
                    Review scholarship applications assigned to your
                    programs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadApplications(true)}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/25 disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Award}
            label="Total"
            value={counts.total}
          />
          <StatCard
            icon={Clock3}
            label="Pending"
            value={counts.pending}
          />
          <StatCard
            icon={Eye}
            label="Under Review"
            value={counts.under_review}
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={counts.approved}
          />
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={counts.rejected}
          />
        </section>

        {error && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <section className="ep-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant, email, scholarship, program, or ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="relative lg:w-56">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </section>

        {/* Applications */}
        <section className="ep-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <Award
                size={48}
                className="mx-auto mb-4 text-slate-300 dark:text-slate-700"
              />
              <h3 className="font-bold text-slate-900 dark:text-white">
                No scholarship applications found
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Program
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Scholarship
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredApplications.map((application) => {
                      const program = getPrimaryProgram(application);

                      return (
                        <tr
                          key={application.id}
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-500/10 dark:text-blue-300">
                                <UserRound size={19} />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                  {getApplicantName(application)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {getApplicantEmail(application)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <GraduationCap
                                size={17}
                                className="text-slate-400"
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  {program?.name || 'No program'}
                                </p>
                                {program?.code && (
                                  <p className="text-xs text-slate-500">
                                    {program.code}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="max-w-xs truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {application.scholarship?.name ||
                                'Scholarship'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatAmount(
                                application.scholarship?.amount
                              )}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge status={application.status} />
                          </td>

                          <td className="px-6 py-5 text-right">
                            <button
                              type="button"
                              onClick={() => openReview(application)}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0e2f4a] dark:bg-blue-600 dark:hover:bg-blue-700"
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

              {/* Mobile */}
              <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
                {filteredApplications.map((application) => {
                  const program = getPrimaryProgram(application);

                  return (
                    <div key={application.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {getApplicantName(application)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getApplicantEmail(application)}
                          </p>
                        </div>

                        <StatusBadge status={application.status} />
                      </div>

                      <div className="mt-4 space-y-3">
                        <InfoRow
                          icon={Award}
                          label="Scholarship"
                          value={
                            application.scholarship?.name ||
                            'Scholarship'
                          }
                        />

                        <InfoRow
                          icon={GraduationCap}
                          label="Program"
                          value={
                            program?.name ||
                            'No program information'
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => openReview(application)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white dark:bg-blue-600"
                      >
                        <Eye size={16} />
                        Review Application
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Review Modal */}
      {selectedApplication && (
        <ModalPortal onEscape={closeReview}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review Scholarship Application"
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Review Scholarship Application
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Application #{selectedApplication.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={UserRound}
                  label="Applicant"
                  value={getApplicantName(selectedApplication)}
                />

                <DetailCard
                  icon={Mail}
                  label="Email"
                  value={getApplicantEmail(selectedApplication)}
                />

                <DetailCard
                  icon={GraduationCap}
                  label="Program"
                  value={
                    getPrimaryProgram(selectedApplication)?.name ||
                    'No program'
                  }
                />

                <DetailCard
                  icon={Award}
                  label="Scholarship"
                  value={
                    selectedApplication.scholarship?.name ||
                    'Scholarship'
                  }
                />
              </div>

              <div className="mt-5 space-y-4">
                <ScholarshipSection
                  icon={BookOpen}
                  title="Description"
                  value={selectedApplication.scholarship?.description}
                />

                <ScholarshipSection
                  icon={Target}
                  title="Objectives"
                  value={selectedApplication.scholarship?.objectives}
                />

                <ScholarshipSection
                  icon={Gift}
                  title="Benefits"
                  value={selectedApplication.scholarship?.benefits}
                />

                <ScholarshipSection
                  icon={BookOpen}
                  title="Eligibility"
                  value={selectedApplication.scholarship?.eligibility}
                />

                <ScholarshipSection
                  icon={ShieldCheck}
                  title="Requirements"
                  value={selectedApplication.scholarship?.requirements}
                />

                {selectedApplication.scholarship?.official_reference && (
                  <a
                    href={selectedApplication.scholarship.official_reference}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] hover:underline dark:text-blue-300"
                  >
                    <ExternalLink size={16} />
                    View Official Reference
                  </a>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck
                    size={19}
                    className="text-[#123B5D] dark:text-blue-300"
                  />

                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Application Review
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Status
                    </label>

                    <select
                      value={newStatus}
                      onChange={(event) => setNewStatus(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="under_review">
                        Under Review
                      </option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Remarks
                    </label>

                    <textarea
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      rows={4}
                      placeholder="Add review remarks..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
              <button
                type="button"
                onClick={closeReview}
                disabled={updating}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateApplication}
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0e2f4a] disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {updating ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="ep-card ep-hover-lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-500/10 dark:text-blue-300">
          <Icon size={21} />
        </div>

        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={17} className="text-slate-400" />

      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={15} />
        {label}
      </div>

      <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value || '—'}
      </p>
    </div>
  );
}

function ScholarshipSection({ icon: Icon, title, value }) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
        <Icon size={17} />
        {title}
      </div>

      <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
        {value}
      </p>
    </div>
  );
}