import { useEffect, useState } from 'react';

import {
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  GraduationCap,
  CalendarDays,
  Megaphone,
  Clock,
  ArrowUpRight,
  BriefcaseBusiness,
  RefreshCw,
} from 'lucide-react';

import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { token, user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/staff/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Staff dashboard response:', response.data);

      const dashboardData =
        response.data?.data ||
        response.data ||
        {};

      setDashboard(dashboardData);
    } catch (err) {
      console.error('Staff dashboard error:', err);

      setDashboard(null);

      setError(
        err.response?.data?.message ||
          'Unable to load staff dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const statCards = dashboard
    ? [
        {
          title: 'Total Applicants',
          value: dashboard.total_applicants,
          icon: Users,
          description: 'Applicants in your programs',
          iconBg: 'bg-blue-50 dark:bg-blue-500/10',
          iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
          title: 'Pending Applications',
          value: dashboard.pending_applications,
          icon: Clock,
          description: 'Awaiting review',
          iconBg: 'bg-amber-50 dark:bg-amber-500/10',
          iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
          title: 'Approved Applications',
          value: dashboard.approved_applications,
          icon: CheckCircle2,
          description: 'Successfully approved',
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
          title: 'Rejected Applications',
          value: dashboard.rejected_applications,
          icon: XCircle,
          description: 'Applications rejected',
          iconBg: 'bg-red-50 dark:bg-red-500/10',
          iconColor: 'text-red-600 dark:text-red-400',
        },
        {
          title: 'Scholarship Applicants',
          value: dashboard.scholarship_applicants,
          icon: GraduationCap,
          description: 'Scholarship applications',
          iconBg: 'bg-purple-50 dark:bg-purple-500/10',
          iconColor: 'text-purple-600 dark:text-purple-400',
        },
        {
          title: 'Upcoming Exams',
          value: dashboard.upcoming_exams,
          icon: CalendarDays,
          description: 'Scheduled examinations',
          iconBg: 'bg-teal-50 dark:bg-teal-500/10',
          iconColor: 'text-teal-600 dark:text-teal-400',
        },
        {
          title: 'Announcements',
          value: dashboard.published_announcements,
          icon: Megaphone,
          description: 'Published announcements',
          iconBg: 'bg-yellow-50 dark:bg-yellow-500/10',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-8 page-transition">
        {/* Header Skeleton */}
        <div className="animate-fade-up">
          <div className="ep-skeleton h-3 w-28 mb-3" />
          <div className="ep-skeleton h-9 w-80 mb-3" />
          <div className="ep-skeleton h-4 w-[420px] max-w-full" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="ep-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="ep-skeleton h-3 w-28 mb-3" />
                  <div className="ep-skeleton h-8 w-16 mb-3" />
                  <div className="ep-skeleton h-3 w-32" />
                </div>

                <div className="ep-skeleton w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Applicants Skeleton */}
        <div className="ep-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="ep-skeleton h-6 w-44 mb-2" />
            <div className="ep-skeleton h-3 w-72 max-w-full" />
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="p-6 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="ep-skeleton w-11 h-11 rounded-full" />

                  <div>
                    <div className="ep-skeleton h-4 w-40 mb-2" />
                    <div className="ep-skeleton h-3 w-52" />
                  </div>
                </div>

                <div className="hidden sm:block">
                  <div className="ep-skeleton h-3 w-16 mb-2" />
                  <div className="ep-skeleton h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-transition min-h-[500px] flex items-center justify-center">
        <div className="ep-card max-w-lg w-full p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Dashboard
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>

          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="
              inline-flex
              items-center
              gap-2
              px-5
              py-2.5
              rounded-xl
              bg-[#123B5D]
              hover:bg-[#0F3553]
              text-white
              font-semibold
              shadow-md
              hover:shadow-lg
              transition-colors
            "
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">

      {/* =====================================================
          HERO / PAGE HEADER
      ===================================================== */}
      <section
        className="
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
        {/* Decorative Elements */}
        <div
          className="
            absolute
            -right-16
            -top-16
            w-48
            h-48
            rounded-full
            bg-white/5
            animate-float
          "
        />

        <div
          className="
            absolute
            right-20
            -bottom-20
            w-40
            h-40
            rounded-full
            bg-[#F4B400]/10
          "
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  px-3
                  py-1
                  rounded-full
                  bg-white/10
                  border
                  border-white/10
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-blue-100
                "
              >
                <BriefcaseBusiness size={13} />
                Staff Portal
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Welcome, {user?.name || 'Staff'}!
            </h1>

            <p className="text-blue-100 mt-2 max-w-2xl text-sm sm:text-base">
              Manage admission applications and applicant
              records assigned to your academic programs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="
              self-start
              lg:self-center
              inline-flex
              items-center
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
              shadow-sm
              transition-colors
              disabled:opacity-60
            "
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />

            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#123B5D] dark:text-sky-300">
              Overview
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current activity across your assigned programs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="
                  ep-card
                  ep-hover-lift
                  p-5
                  animate-fade-up
                "
                style={{
                  animationDelay: `${index * 45}ms`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {card.title}
                    </p>

                    <p className="text-3xl font-extrabold text-[#123B5D] dark:text-gray-100 mt-2">
                      {card.value ?? 0}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {card.description}
                    </p>
                  </div>

                  <div
                    className={`
                      w-12
                      h-12
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      shrink-0
                      ${card.iconBg}
                      transition-transform
                      duration-200
                      
                    `}
                  >
                    <Icon
                      className={`w-6 h-6 ${card.iconColor}`}
                      strokeWidth={2.2}
                    />
                  </div>
                </div>

                <div className="mt-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#123B5D] via-[#0F766E] to-[#F4B400]"
                    style={{
                      width: `${Math.min(
                        Math.max(Number(card.value || 0) * 10, 12),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          RECENT APPLICANTS
      ===================================================== */}
      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '180ms',
        }}
      >
        <div
          className="
            p-6
            border-b
            border-gray-100
            dark:border-gray-800
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-[#123B5D]/10
                dark:bg-sky-400/10
                flex
                items-center
                justify-center
              "
            >
              <FileText
                className="w-5 h-5 text-[#123B5D] dark:text-sky-300"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#123B5D] dark:text-sky-300">
                Recent Applicants
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Recently registered applicants under your assigned programs.
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex
              items-center
              gap-2
              text-xs
              font-semibold
              text-[#0F766E]
              dark:text-teal-300
              bg-[#0F766E]/10
              dark:bg-teal-400/10
              px-3
              py-2
              rounded-lg
            "
          >
            <Users size={14} />
            {dashboard?.recent_applicants?.length || 0} Recent
          </div>
        </div>

        {dashboard?.recent_applicants?.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {dashboard.recent_applicants.map(
              (applicant, index) => {
                const fullName = [
                  applicant.first_name,
                  applicant.middle_name,
                  applicant.last_name,
                ]
                  .filter(Boolean)
                  .join(' ');

                const applications =
                  applicant.admission_applications || [];

                const latestApplication =
                  applications.length > 0
                    ? applications[0]
                    : null;

                const status =
                  latestApplication?.status || 'pending';

                const statusConfig = {
                  pending: {
                    label: 'Pending',
                    className:
                      'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                  },
                  approved: {
                    label: 'Approved',
                    className:
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                  },
                  rejected: {
                    label: 'Rejected',
                    className:
                      'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
                  },
                };

                const currentStatus =
                  statusConfig[status] ||
                  statusConfig.pending;

                return (
                  <div
                    key={applicant.id}
                    className="
                      group
                      p-5
                      sm:p-6
                      flex
                      flex-col
                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                      gap-5
                      hover:bg-gray-50/80
                      dark:hover:bg-white/[0.025]
                      transition-colors
                      duration-200
                      animate-fade-up
                    "
                    style={{
                      animationDelay: `${220 + index * 50}ms`,
                    }}
                  >
                    {/* Applicant */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="
                          w-12
                          h-12
                          rounded-xl
                          bg-gradient-to-br
                          from-[#123B5D]
                          to-[#0F766E]
                          flex
                          items-center
                          justify-center
                          text-white
                          shadow-sm
                          shrink-0
                          transition-transform
                          duration-200
                          
                        "
                      >
                        <Users
                          size={20}
                          strokeWidth={2.2}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                          {fullName ||
                            applicant.user?.name ||
                            'Unnamed Applicant'}
                        </h3>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {applicant.user?.email ||
                            'No email'}
                        </p>
                      </div>
                    </div>

                    {/* Program */}
                    <div className="lg:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Program
                      </p>

                      <p className="font-semibold text-[#123B5D] dark:text-sky-300 mt-1">
                        {latestApplication?.academic_program
                          ?.name || 'Not available'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between lg:justify-end gap-4">
                      <span
                        className={`
                          inline-flex
                          items-center
                          px-3
                          py-1.5
                          rounded-full
                          text-xs
                          font-bold
                          ${currentStatus.className}
                        `}
                      >
                        {currentStatus.label}
                      </span>

                      <ArrowUpRight
                        size={18}
                        className="
                          text-gray-300
                          dark:text-gray-600
                          group-hover:text-[#0F766E]
                          dark:group-hover:text-teal-300
                          
                          
                          transition-colors
                        "
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
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
              <Users className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Recent Applicants
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              Applicants from your assigned programs will
              appear here once they submit their information.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;