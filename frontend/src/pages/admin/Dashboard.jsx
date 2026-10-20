import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';

import {
  Users,
  Clock3,
  CheckCircle2,
  XCircle,
  Award,
  CalendarDays,
  Megaphone,
  ShieldCheck,
  ArrowRight,
  UserRound,
  FileText,
  BookOpen,
  RefreshCw,
  UserCog,
  Files,
  GraduationCap,
  ClipboardCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';

const OVERVIEW_CARDS = [
  {
    title: 'Total Applicants',
    key: 'total_applicants',
    description: 'Registered applicants',
    icon: Users,
    tone: 'blue',
  },
  {
    title: 'Total Staff',
    key: 'total_staff',
    description: 'Staff accounts',
    icon: UserCog,
    tone: 'indigo',
  },
  {
    title: 'Total Applications',
    key: 'total_applications',
    description: 'Admission applications',
    icon: FileText,
    tone: 'purple',
  },
  {
    title: 'Active Programs',
    key: 'active_programs',
    description: 'Available academic programs',
    icon: BookOpen,
    tone: 'teal',
  },
];

const APPLICATION_CARDS = [
  {
    title: 'Pending',
    key: 'pending_applications',
    description: 'Awaiting review',
    icon: Clock3,
    tone: 'amber',
  },
  {
    title: 'Approved',
    key: 'approved_applications',
    description: 'Successfully approved',
    icon: CheckCircle2,
    tone: 'emerald',
  },
  {
    title: 'Rejected',
    key: 'rejected_applications',
    description: 'Applications rejected',
    icon: XCircle,
    tone: 'red',
  },
];

const SYSTEM_CARDS = [
  {
    title: 'Total Documents',
    key: 'total_documents',
    description: 'Uploaded documents',
    icon: Files,
    tone: 'blue',
  },
  {
    title: 'Pending Documents',
    key: 'pending_documents',
    description: 'Waiting for verification',
    icon: Clock3,
    tone: 'amber',
  },
  {
    title: 'Verified Documents',
    key: 'verified_documents',
    description: 'Successfully verified',
    icon: ClipboardCheck,
    tone: 'emerald',
  },
  {
    title: 'Scholarship Applicants',
    key: 'scholarship_applicants',
    description: 'Scholarship applications',
    icon: Award,
    tone: 'purple',
  },
  {
    title: 'Active Scholarships',
    key: 'active_scholarships',
    description: 'Available scholarships',
    icon: GraduationCap,
    tone: 'indigo',
  },
  {
    title: 'Upcoming Exams',
    key: 'upcoming_exams',
    description: 'Scheduled examinations',
    icon: CalendarDays,
    tone: 'teal',
  },
  {
    title: 'Announcements',
    key: 'published_announcements',
    description: 'Published announcements',
    icon: Megaphone,
    tone: 'gold',
  },
  {
    title: 'System Status',
    key: 'system_status',
    description: 'EduPath system status',
    icon: ShieldCheck,
    tone: 'emerald',
    isStatus: true,
  },
];

const QUICK_ACTIONS = [
  {
    title: 'Manage Applicants',
    description: 'View and manage applicant records.',
    to: '/admin/applicants',
    icon: Users,
    tone: 'blue',
  },
  {
    title: 'Staff Management',
    description: 'Manage staff accounts and access.',
    to: '/admin/staff',
    icon: UserCog,
    tone: 'indigo',
  },
  {
    title: 'Academic Programs',
    description: 'Manage available academic programs.',
    to: '/admin/programs',
    icon: BookOpen,
    tone: 'teal',
  },
  {
    title: 'Documents',
    description: 'Review applicant documents.',
    to: '/admin/documents',
    icon: FileText,
    tone: 'gold',
  },
  {
    title: 'Scholarship Applications',
    description: 'Review scholarship applications.',
    to: '/admin/scholarship-applications',
    icon: Award,
    tone: 'purple',
  },
  {
    title: 'Entrance Exams',
    description: 'Manage entrance exam schedules.',
    to: '/admin/exams',
    icon: CalendarDays,
    tone: 'teal',
  },
  {
    title: 'Announcements',
    description: 'Manage school announcements.',
    to: '/admin/announcements',
    icon: Megaphone,
    tone: 'gold',
  },
];

const TONE_STYLES = {
  blue: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    bar: 'from-blue-500 to-cyan-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  indigo: {
    icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    bar: 'from-indigo-500 to-blue-400',
    value: 'text-indigo-700 dark:text-indigo-300',
  },
  purple: {
    icon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    bar: 'from-purple-500 to-fuchsia-400',
    value: 'text-purple-700 dark:text-purple-300',
  },
  teal: {
    icon: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    bar: 'from-[#123B5D] to-[#0F766E]',
    value: 'text-teal-700 dark:text-teal-300',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bar: 'from-amber-400 to-[#F4B400]',
    value: 'text-amber-700 dark:text-amber-300',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bar: 'from-emerald-500 to-teal-400',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  red: {
    icon: 'bg-red-500/10 text-red-600 dark:text-red-400',
    bar: 'from-red-500 to-rose-400',
    value: 'text-red-700 dark:text-red-300',
  },
  gold: {
    icon: 'bg-[#F4B400]/15 text-[#A77C00] dark:text-[#F4B400]',
    bar: 'from-[#0F766E] to-[#F4B400]',
    value: 'text-[#A77C00] dark:text-[#F4B400]',
  },
};

const formatDate = (date) => {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '—';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getApplicantName = (applicant) => {
  if (!applicant) return 'Unknown Applicant';

  const name = [
    applicant.first_name,
    applicant.middle_name,
    applicant.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  return name || applicant.user?.name || 'Unknown Applicant';
};

const getStatisticValue = (dashboard, key) => {
  if (key === 'system_status') return 'Active';
  return dashboard?.[key] ?? 0;
};

const SectionHeading = ({ eyebrow, title, description }) => (
  <div className="mb-5">
    {eyebrow && (
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F766E] dark:text-teal-400">
        {eyebrow}
      </p>
    )}

    <h2 className="text-lg font-extrabold tracking-tight text-[#123B5D] dark:text-slate-100 sm:text-xl">
      {title}
    </h2>

    {description && (
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    )}
  </div>
);

const StatCard = ({ card, value, index = 0, compact = false }) => {
  const Icon = card.icon;
  const tone = TONE_STYLES[card.tone] || TONE_STYLES.teal;
  const isStatus = Boolean(card.isStatus);
  const numericValue = Number(value);
  const barWidth = Number.isFinite(numericValue)
    ? Math.min(Math.max(numericValue * 10, 12), 100)
    : 100;

  return (
    <article
      className={`ep-card ep-hover-lift group relative overflow-hidden p-5 animate-fade-up ${
        compact ? 'sm:p-6' : ''
      }`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#123B5D] via-[#0F766E] to-[#F4B400] opacity-70" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {card.title}
          </p>

          <p
            className={`mt-3 text-3xl font-extrabold tracking-tight ${
              isStatus
                ? 'text-emerald-600 dark:text-emerald-400'
                : compact
                  ? tone.value
                  : 'text-[#123B5D] dark:text-slate-100'
            }`}
          >
            {value ?? 0}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {card.description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200  ${tone.icon}`}
        >
          <Icon size={21} strokeWidth={2.1} />
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-colors duration-200`}
          style={{ width: isStatus ? '100%' : `${barWidth}%` }}
        />
      </div>
    </article>
  );
};

const DashboardSkeleton = () => (
  <div className="page-transition space-y-8">
    <div className="ep-card overflow-hidden p-6 sm:p-8">
      <div className="ep-skeleton mb-4 h-3 w-28" />
      <div className="ep-skeleton mb-3 h-9 w-72 max-w-full" />
      <div className="ep-skeleton h-4 w-[440px] max-w-full" />
    </div>

    {[
      { title: 'System Overview', count: 4 },
      { title: 'Application Status', count: 3 },
      { title: 'System Activity', count: 8 },
    ].map((section) => (
      <section key={section.title}>
        <div className="ep-skeleton mb-3 h-6 w-44" />
        <div className="ep-skeleton mb-5 h-3 w-64 max-w-full" />

        <div
          className={`grid grid-cols-1 gap-5 ${
            section.count === 3
              ? 'md:grid-cols-3'
              : 'sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {Array.from({ length: section.count }).map((_, index) => (
            <div className="ep-card p-5" key={index}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="ep-skeleton mb-3 h-3 w-28" />
                  <div className="ep-skeleton mb-3 h-8 w-16" />
                  <div className="ep-skeleton h-3 w-36 max-w-full" />
                </div>
                <div className="ep-skeleton h-11 w-11 rounded-xl" />
              </div>
              <div className="ep-skeleton mt-5 h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    ))}

    <div className="ep-card p-6">
      <div className="ep-skeleton mb-3 h-6 w-44" />
      <div className="ep-skeleton mb-6 h-3 w-64 max-w-full" />

      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-t border-slate-100 py-5 dark:border-slate-800"
        >
          <div className="ep-skeleton h-12 w-12 rounded-xl" />
          <div className="flex-1">
            <div className="ep-skeleton mb-2 h-4 w-40 max-w-full" />
            <div className="ep-skeleton h-3 w-52 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const { token, user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const response = await api.get('/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        setDashboard(data.data || data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);

        setError(
          err.response?.data?.message ||
            'Failed to load dashboard data. Please try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );
  useAutoRefresh(() => {
    loadDashboard(true);
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadDashboard();
    });
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !dashboard) {
    return (
      <ErrorMessage message={error}><div className="page-transition flex min-h-[480px] items-center justify-center">
        <div className="ep-card w-full max-w-lg p-8 text-center animate-scale-in">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <AlertCircle size={30} />
          </div>

          <h2 className="text-xl font-extrabold text-[#123B5D] dark:text-slate-100">
            Unable to Load Dashboard
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#123B5D]/15 transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#071521]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div></ErrorMessage>
    );
  }

  return (
    <div className="page-transition space-y-8">
      {/* HERO */}
      <section className="ep-page-banner ep-brand-gradient relative overflow-hidden rounded-2xl p-6 shadow-lg shadow-[#123B5D]/10 sm:p-8 lg:p-9 animate-fade-up">
        <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full border border-white/10 bg-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-[#F4B400]/10 blur-sm" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-teal-300/[0.06] blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-50 backdrop-blur-sm">
              <ShieldCheck size={13} />
              EduPath Administration
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Welcome, {user?.name || 'Administrator'}!
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
              Your central workspace for managing Trinidad Municipal College
              admissions, scholarships, examinations, programs, staff, and
              applicant documents.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-blue-100">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                System overview
              </span>

              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2">
                <Activity size={14} />
                Admission management
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 lg:self-center"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            {refreshing ? 'Refreshing...' : 'Refresh Dashboard'}
          </button>
        </div>
      </section>

      {error && dashboard && (
        <ErrorMessage message={error}><div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Refresh unsuccessful</p>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="shrink-0 font-bold underline underline-offset-4"
          >
            Retry
          </button>
        </div></ErrorMessage>
      )}

      {/* SYSTEM OVERVIEW */}
      <section>
        <SectionHeading
          eyebrow="At a glance"
          title="System Overview"
          description="Key statistics across the EduPath admission and scholarship system."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {OVERVIEW_CARDS.map((card, index) => {
            const value =
              card.key === 'active_programs'
                ? dashboard?.active_programs ?? 0
                : getStatisticValue(dashboard, card.key);

            const description =
              card.key === 'active_programs'
                ? `${dashboard?.total_programs ?? 0} total programs`
                : card.description;

            return (
              <StatCard
                key={card.key}
                card={{ ...card, description }}
                value={value}
                index={index}
              />
            );
          })}
        </div>
      </section>

      {/* ADMISSION APPLICATIONS */}
      <section className="ep-card overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-teal-400/10 dark:text-teal-300">
              <FileText size={21} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-[#123B5D] dark:text-slate-100">
                Admission Applications
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review the current application status summary.
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-teal-500/15 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-700 dark:text-teal-300">
            <Files size={15} />
            {dashboard?.total_applications ?? 0} total applications
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-3 md:divide-x md:divide-y-0">
          {APPLICATION_CARDS.map((card, index) => (
            <StatCard
              key={card.key}
              card={card}
              value={getStatisticValue(dashboard, card.key)}
              index={index}
              compact
            />
          ))}
        </div>
      </section>

      {/* SYSTEM ACTIVITY */}
      <section>
        <SectionHeading
          eyebrow="Operations"
          title="System Activity"
          description="Track documents, scholarships, examinations, and announcements."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {SYSTEM_CARDS.map((card, index) => (
            <StatCard
              key={card.key}
              card={card}
              value={getStatisticValue(dashboard, card.key)}
              index={index}
            />
          ))}
        </div>
      </section>

      {/* RECENT APPLICANTS */}
      <section className="ep-card overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-teal-400/10 dark:text-teal-300">
              <Users size={21} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-[#123B5D] dark:text-slate-100">
                Recent Applicants
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Recently registered applicants across EduPath.
              </p>
            </div>
          </div>

          <Link
            to="/admin/applicants"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-500/15 dark:text-teal-300"
          >
            View All Applicants
            <ArrowRight size={15} />
          </Link>
        </div>

        {dashboard?.recent_applicants?.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dashboard.recent_applicants.map((applicant, index) => {
              const fullName = getApplicantName(applicant);

              return (
                <div
                  key={applicant.id}
                  className="group flex flex-col gap-4 p-5 transition-colors duration-200 hover:bg-slate-50/80 dark:hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:p-6 animate-fade-up"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] text-white shadow-sm transition-transform duration-200 ">
                      <UserRound size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-800 dark:text-slate-100">
                        {fullName}
                      </h3>

                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {applicant.user?.email || 'No email available'}
                      </p>

                      <span className="mt-2 inline-flex rounded-md border border-[#123B5D]/10 bg-[#123B5D]/5 px-2 py-1 text-[10px] font-bold text-[#123B5D] dark:border-teal-400/15 dark:bg-teal-400/10 dark:text-teal-300">
                        Applicant #{applicant.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                        Registered
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#123B5D] dark:text-slate-200">
                        {formatDate(applicant.created_at)}
                      </p>
                    </div>

                    <Link
                      to={`/admin/applicants/${applicant.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#123B5D] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#071521]"
                    >
                      View Details
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Users size={28} />
            </div>

            <h3 className="font-extrabold text-slate-800 dark:text-slate-100">
              No Recent Applicants
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Newly registered applicants will appear here once they register
              in EduPath.
            </p>
          </div>
        )}
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <SectionHeading
          eyebrow="Shortcuts"
          title="Quick Actions"
          description="Quickly access commonly used administration features."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action, index) => {
            const Icon = action.icon;
            const tone = TONE_STYLES[action.tone] || TONE_STYLES.teal;

            return (
              <Link
                key={action.to}
                to={action.to}
                className="ep-card ep-hover-lift group p-5 animate-fade-up"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200  ${tone.icon}`}
                  >
                    <Icon size={21} />
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-slate-300 transition-colors duration-200  group-hover:text-[#0F766E] dark:text-slate-600 dark:group-hover:text-teal-300"
                  />
                </div>

                <h3 className="mt-4 font-extrabold text-slate-800 transition-colors group-hover:text-[#0F766E] dark:text-slate-100 dark:group-hover:text-teal-300">
                  {action.title}
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
