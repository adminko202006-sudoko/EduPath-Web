import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  XCircle,
  AlertCircle,
  Banknote,
  MessageSquare,
  Eye,
  Target,
  Gift,
  BookOpen,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}


export default function ScholarshipApplication() {
  
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedApplication, setSelectedApplication] = useState(null);

  const loadApplications = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await api.get(
        '/applicant/scholarship-applications',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplications(response.data?.data || response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load your scholarship applications.'
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

          <div className="ep-card rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-40" />
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
                    Applicant Portal
                  </p>

                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    My Scholarship Applications
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm text-white/80">
                    Track the scholarships you have applied for and monitor
                    their application status.
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
            icon={ClipboardList}
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
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Applications */}
        <section>
          {applications.length === 0 ? (
            <div className="ep-card rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Award
                size={50}
                className="mx-auto mb-4 text-slate-300 dark:text-slate-700"
              />

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                No scholarship applications yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                When you apply for a scholarship, your application will
                appear here so you can track its progress.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {applications.map((application, index) => {
                const scholarship = application.scholarship;

                return (
                  <article
                    key={application.id}
                    className="ep-card ep-hover-lift animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
                    style={{
                      animationDelay: `${index * 60}ms`,
                    }}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-500/10 dark:text-blue-300">
                          <Award size={23} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                              {scholarship?.name || 'Scholarship'}
                            </h2>

                            <StatusBadge status={application.status} />
                          </div>

                          {scholarship?.provider && (
                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                              {scholarship.provider}
                            </p>
                          )}

                          {scholarship?.description && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                              {scholarship.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedApplication(application)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Eye size={17} />
                        View Details
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoItem
                        icon={Banknote}
                        label="Scholarship Amount"
                        value={formatAmount(scholarship?.amount)}
                      />

                      <InfoItem
                        icon={CalendarDays}
                        label="Submitted"
                        value={formatDate(application.submitted_at)}
                      />

                      <InfoItem
                        icon={FileText}
                        label="Application ID"
                        value={`#${application.id}`}
                      />

                      <InfoItem
                        icon={ClipboardList}
                        label="Program Type"
                        value={
                          scholarship?.program_type ||
                          'Not specified'
                        }
                      />
                    </div>

                    {application.remarks && (
                      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          <MessageSquare size={16} />
                          Application Remarks
                        </div>

                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {application.remarks}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Scholarship Details
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Application #{selectedApplication.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-100px)] overflow-y-auto p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedApplication.scholarship?.name ||
                    'Scholarship'}
                </h3>

                <StatusBadge status={selectedApplication.status} />
              </div>

              {selectedApplication.scholarship?.provider && (
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Provider: {selectedApplication.scholarship.provider}
                </p>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={Banknote}
                  label="Amount"
                  value={formatAmount(
                    selectedApplication.scholarship?.amount
                  )}
                />

                <DetailCard
                  icon={CalendarDays}
                  label="Submitted"
                  value={formatDate(
                    selectedApplication.submitted_at
                  )}
                />

                <DetailCard
                  icon={ClipboardList}
                  label="Program Type"
                  value={
                    selectedApplication.scholarship?.program_type ||
                    'Not specified'
                  }
                />

                <DetailCard
                  icon={FileText}
                  label="Application ID"
                  value={`#${selectedApplication.id}`}
                />
              </div>

              <div className="mt-5 space-y-4">
                <ScholarshipSection
                  icon={BookOpen}
                  title="Description"
                  value={
                    selectedApplication.scholarship?.description
                  }
                />

                <ScholarshipSection
                  icon={Target}
                  title="Objectives"
                  value={
                    selectedApplication.scholarship?.objectives
                  }
                />

                <ScholarshipSection
                  icon={Target}
                  title="Goals"
                  value={
                    selectedApplication.scholarship?.goals
                  }
                />

                <ScholarshipSection
                  icon={Gift}
                  title="Benefits"
                  value={
                    selectedApplication.scholarship?.benefits
                  }
                />

                <ScholarshipSection
                  icon={FileText}
                  title="Eligibility"
                  value={
                    selectedApplication.scholarship?.eligibility
                  }
                />

                <ScholarshipSection
                  icon={FileText}
                  title="Requirements"
                  value={
                    selectedApplication.scholarship?.requirements
                  }
                />

                <ScholarshipSection
                  icon={BookOpen}
                  title="Covered Expenses"
                  value={
                    selectedApplication.scholarship?.covered_expenses
                  }
                />

                <ScholarshipSection
                  icon={UserIcon}
                  title="Target Beneficiaries"
                  value={
                    selectedApplication.scholarship?.target_beneficiaries
                  }
                />

                {selectedApplication.scholarship
                  ?.official_reference && (
                  <a
                    href={
                      selectedApplication.scholarship
                        .official_reference
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] hover:underline dark:text-blue-300"
                  >
                    <ExternalLink size={16} />
                    View Official Reference
                  </a>
                )}

                {selectedApplication.remarks && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                      <MessageSquare size={17} />
                      Application Remarks
                    </div>

                    <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {selectedApplication.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-slate-400"
      />

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
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

function UserIcon(props) {
  return <ClipboardList {...props} />;
}