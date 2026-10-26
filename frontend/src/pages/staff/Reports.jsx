import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from 'react';
import { FileCheck, Users, Clock3, CheckCircle2, XCircle, Award, CalendarDays, BarChart3, ShieldCheck, ClipboardList, AlertCircle } from 'lucide-react';

import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from '../../context/useAuth';

const StaffReports = () => {
  const { token } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get(
        '/staff/reports',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReport(
        response.data?.data || null
      );
    } catch (err) {
      console.error(
        'Failed to load staff reports:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load staff reports.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  useAutoRefresh(async () => {
    await fetchReports(true);
  });

  useEffect(() => {
    if (token) {
      queueMicrotask(() => {
        fetchReports();
      });
    }
  }, [token, fetchReports]);

  const summary = report?.summary || {};

  const programs = report?.programs || [];

  const recentApplications =
    report?.recent_applications || [];

  const statCards = [
    {
      label: 'Total Applicants',
      value: summary.total_applicants ?? 0,
      description: 'Applicants in assigned programs',
      icon: Users,
      iconClass:
        'bg-blue-50 text-[#123B5D] dark:bg-sky-400/10 dark:text-sky-300',
    },
    {
      label: 'Pending Applications',
      value: summary.pending_applications ?? 0,
      description: 'Awaiting review',
      icon: Clock3,
      iconClass:
        'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
    },
    {
      label: 'Approved Applications',
      value: summary.approved_applications ?? 0,
      description: 'Approved admissions',
      icon: CheckCircle2,
      iconClass:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    },
    {
      label: 'Rejected Applications',
      value: summary.rejected_applications ?? 0,
      description: 'Rejected admissions',
      icon: XCircle,
      iconClass:
        'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300',
    },
    {
      label: 'Scholarship Applicants',
      value: summary.scholarship_applicants ?? 0,
      description: 'Scholarship applications',
      icon: Award,
      iconClass:
        'bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300',
    },
    {
      label: 'Exam Assignments',
      value: summary.total_exam_assignments ?? 0,
      description: 'Entrance exam assignments',
      icon: CalendarDays,
      iconClass:
        'bg-teal-50 text-[#0F766E] dark:bg-teal-400/10 dark:text-teal-300',
    },
  ];

  const formatDate = (date) => {
    if (!date) {
      return 'Unknown date';
    }

    return new Date(date).toLocaleDateString(
      undefined,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const getApplicantName = (application) => {
    const applicant =
      application?.applicant;

    if (!applicant) {
      return (
        application?.applicant?.user?.name ||
        'Applicant'
      );
    }

    const name = [
      applicant.first_name,
      applicant.middle_name,
      applicant.last_name,
    ]
      .filter(Boolean)
      .join(' ');

    return name || 'Applicant';
  };

  const getStatusClasses = (status) => {
    if (status === 'approved') {
      return `
        bg-emerald-50
        text-emerald-700
        dark:bg-emerald-400/10
        dark:text-emerald-300
      `;
    }

    if (status === 'rejected') {
      return `
        bg-red-50
        text-red-700
        dark:bg-red-400/10
        dark:text-red-300
      `;
    }

    return `
      bg-amber-50
      text-amber-700
      dark:bg-amber-400/10
      dark:text-amber-300
    `;
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') {
      return <CheckCircle2 size={13} />;
    }

    if (status === 'rejected') {
      return <XCircle size={13} />;
    }

    return <Clock3 size={13} />;
  };

  const getStatusLabel = (status) => {
    if (!status) {
      return 'Pending';
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  };

  if (loading) {
    return (
      <div className="space-y-7 page-transition">
        <section
          className="ep-page-banner 
            relative
            overflow-hidden
            rounded-2xl
            ep-brand-gradient
            shadow-lg
            p-6
            sm:p-8
          "
        >
          <div className="animate-pulse">
            <div className="h-5 w-32 bg-white/10 rounded-full mb-4" />
            <div className="h-9 w-48 bg-white/10 rounded-lg" />
            <div className="h-4 w-full max-w-xl bg-white/10 rounded mt-3" />
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="ep-card p-5"
              >
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <div className="ep-skeleton h-3 w-28 mb-4" />
                    <div className="ep-skeleton h-8 w-16 mb-3" />
                    <div className="ep-skeleton h-3 w-40" />
                  </div>

                  <div className="ep-skeleton w-12 h-12 rounded-xl" />
                </div>
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map(
            (_, index) => (
              <div
                key={index}
                className="ep-card p-6"
              >
                <div className="ep-skeleton h-5 w-56 mb-3" />
                <div className="ep-skeleton h-3 w-72 mb-6" />

                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map(
                    (_, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="ep-skeleton h-24 rounded-xl"
                      />
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

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
            -right-20
            -top-24
            w-64
            h-64
            rounded-full
            bg-white/5
            animate-float
          "
        />

        <div
          className="
            absolute
            right-24
            -bottom-32
            w-56
            h-56
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
            <BarChart3 size={13} />
            Staff Analytics
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Reports
              </h1>

              <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
                Monitor admission, scholarship,
                examination, and program statistics
                for your assigned programs.
              </p>
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
            <AlertCircle
              size={19}
              className="text-red-500"
            />
          </div>

          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">
              Unable to load reports
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div></ErrorMessage>
      )}

      {/* =====================================================
          OVERVIEW STATISTICS
      ===================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="
                ep-card
                ep-hover-lift
                p-5
                animate-fade-up
              "
              style={{
                animationDelay: `${40 + index * 35}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {card.label}
                  </p>

                  <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                    {card.value}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {card.description}
                  </p>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconClass}`}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* =====================================================
          SCHOLARSHIP + EXAM SUMMARY
      ===================================================== */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Scholarship */}
        <div
          className="
            ep-card
            p-5
            sm:p-6
            animate-fade-up
          "
          style={{
            animationDelay: '260ms',
          }}
        >
          <div className="flex items-start gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-400/10 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Award size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Scholarship Review Summary
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Scholarship application reviews within
                your assigned programs. Review approval does not indicate a final scholarship award.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-[#142738] border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Pending
              </p>

              <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                {summary.pending_scholarships ??
                  0}
              </p>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Under review
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-400/5 border border-emerald-100 dark:border-emerald-400/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                Review approved
              </p>

              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
                {summary.approved_scholarships ??
                  0}
              </p>

              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-300/70 mt-1">
                Admin review decision
              </p>
            </div>

            <div className="rounded-xl bg-red-50 dark:bg-red-400/5 border border-red-100 dark:border-red-400/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-600 dark:text-red-300">
                Rejected
              </p>

              <p className="text-2xl font-extrabold text-red-700 dark:text-red-300 mt-2">
                {summary.rejected_scholarships ??
                  0}
              </p>

              <p className="text-[11px] text-red-600/70 dark:text-red-300/70 mt-1">
                Not approved
              </p>
            </div>
          </div>
        </div>

        {/* Examination */}
        <div
          className="
            ep-card
            p-5
            sm:p-6
            animate-fade-up
          "
          style={{
            animationDelay: '300ms',
          }}
        >
          <div className="flex items-start gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-400/10 text-[#0F766E] dark:text-teal-300 flex items-center justify-center shrink-0">
              <CalendarDays size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Entrance Examination
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Examination assignments for your
                assigned programs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-blue-50 dark:bg-sky-400/5 border border-blue-100 dark:border-sky-400/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#123B5D] dark:text-sky-300">
                Scheduled
              </p>

              <p className="text-2xl font-extrabold text-[#123B5D] dark:text-sky-300 mt-2">
                {summary.scheduled_exams ??
                  0}
              </p>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Upcoming
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-400/5 border border-emerald-100 dark:border-emerald-400/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                Completed
              </p>

              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
                {summary.completed_exams ??
                  0}
              </p>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Finished
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-400/5 border border-amber-100 dark:border-amber-400/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                Absent
              </p>

              <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">
                {summary.absent_exams ?? 0}
              </p>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Did not attend
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROGRAM SUMMARY
      ===================================================== */}
      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '340ms',
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
            gap-4
          "
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
              <BarChart3 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Program Summary
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Admission activity for programs
                assigned to you.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 text-xs font-bold self-start sm:self-auto">
            <ShieldCheck size={14} />
            Program Scoped
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="p-10 sm:p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <BarChart3
                size={25}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Academic Programs Assigned
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              Program statistics will appear
              here once this staff account has
              an assigned academic program.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-[#142738] border-b border-gray-100 dark:border-gray-800">
                    <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Program
                    </th>

                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Code
                    </th>

                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      Total
                    </th>

                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      Pending
                    </th>

                    <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      Approved
                    </th>

                    <th className="py-4 px-6 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center">
                      Rejected
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {programs.map((program) => (
                    <tr
                      key={program.id}
                      className="
                        border-b
                        border-gray-100
                        dark:border-gray-800
                        last:border-b-0
                        hover:bg-gray-50
                        dark:hover:bg-[#142738]/70
                        transition-colors
                      "
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#123B5D]/10 dark:bg-sky-400/10 flex items-center justify-center">
                            <ClipboardList
                              size={16}
                              className="text-[#123B5D] dark:text-sky-300"
                            />
                          </div>

                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {program.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold">
                          {program.code}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {program.total_applications ??
                            0}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-amber-600 dark:text-amber-300">
                          {program.pending_applications ??
                            0}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                          {program.approved_applications ??
                            0}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className="font-semibold text-red-600 dark:text-red-300">
                          {program.rejected_applications ??
                            0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="
                    rounded-2xl
                    border
                    border-gray-100
                    dark:border-gray-800
                    p-4
                    bg-gray-50/50
                    dark:bg-[#142738]/50
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
                        <ClipboardList size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                          {program.name}
                        </p>

                        <span className="inline-flex mt-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                          {program.code}
                        </span>
                      </div>
                    </div>

                    <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
                      {program.total_applications ??
                        0}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-400/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                        Pending
                      </p>

                      <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                        {program.pending_applications ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-400/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                        Approved
                      </p>

                      <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                        {program.approved_applications ??
                          0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-50 dark:bg-red-400/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-300">
                        Rejected
                      </p>

                      <p className="text-lg font-extrabold text-red-700 dark:text-red-300 mt-1">
                        {program.rejected_applications ??
                          0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* =====================================================
          RECENT APPLICATIONS
      ===================================================== */}
      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '380ms',
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
            items-start
            gap-3
          "
        >
          <div className="w-11 h-11 rounded-xl bg-[#0F766E]/10 dark:bg-teal-400/10 text-[#0F766E] dark:text-teal-300 flex items-center justify-center shrink-0">
            <FileCheck size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Recent Applications
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Latest admission applications from
              your assigned programs.
            </p>
          </div>
        </div>

        {recentApplications.length === 0 ? (
          <div className="p-10 sm:p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <FileCheck
                size={25}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Recent Applications
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              Admission applications will appear
              here when applicants submit them.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentApplications.map(
              (application) => (
                <div
                  key={application.id}
                  className="
                    p-5
                    sm:p-6
                    hover:bg-gray-50
                    dark:hover:bg-[#142738]/60
                    transition-colors
                  "
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-sky-400/10 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                          {getApplicantName(
                            application
                          )}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {application
                              .academic_program
                              ?.name ||
                              'Academic Program'}
                          </span>

                          {application
                            .academic_program
                            ?.code && (
                            <>
                              <span className="text-gray-300 dark:text-gray-700">
                                •
                              </span>

                              <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                                {
                                  application
                                    .academic_program
                                    .code
                                }
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Submitted{' '}
                          {formatDate(
                            application.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`
                        inline-flex
                        items-center
                        justify-center
                        gap-1.5
                        px-3
                        py-1.5
                        rounded-full
                        text-xs
                        font-bold
                        self-start
                        sm:self-auto
                        ${getStatusClasses(
                          application.status
                        )}
                      `}
                    >
                      {getStatusIcon(
                        application.status
                      )}

                      {getStatusLabel(
                        application.status
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          REPORT SCOPE FOOTER
      ===================================================== */}
      <div
        className="
          rounded-2xl
          border
          border-[#123B5D]/10
          dark:border-sky-400/10
          bg-[#123B5D]/5
          dark:bg-sky-400/5
          p-4
          sm:p-5
          flex
          items-start
          gap-3
          animate-fade-up
        "
      >
        <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#142738] flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck
            size={17}
            className="text-[#123B5D] dark:text-sky-300"
          />
        </div>

        <div>
          <p className="text-sm font-bold text-[#123B5D] dark:text-sky-300">
            Staff Report Scope
          </p>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            These statistics are limited to the
            academic programs assigned to your staff
            account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffReports;

