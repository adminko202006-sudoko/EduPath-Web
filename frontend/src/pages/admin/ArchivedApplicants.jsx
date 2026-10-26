import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useState } from 'react';
import { Archive, Eye, RotateCcw, Search, Users, Mail, GraduationCap, ShieldCheck, ArrowUpRight, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from '../../context/useAuth';
import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';

const ArchivedApplicants = ({ confirm }) => {
  const { token } = useAuth();

  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadArchivedApplicants = useCallback(async (showRefresh = false) => {
    try {
      setError('');

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/admin/applicants/archived', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setApplicants(response.data.data || []);
    } catch (err) {
      console.error('Failed to load archived applicants:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load archived applicants.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  useAutoRefresh(async () => {
    await loadArchivedApplicants(true);
  });

  useEffect(() => {
    if (token) {
      queueMicrotask(() => {
        loadArchivedApplicants();
      });
    }
  }, [token, loadArchivedApplicants]);

  const formatName = (applicant) => {
    if (applicant.display_name) {
      return applicant.display_name;
    }

    return (
      [
        applicant.first_name,
        applicant.middle_name,
        applicant.last_name,
      ]
        .filter(Boolean)
        .join(' ') || 'Unnamed Applicant'
    );
  };

  const getProgram = (applicant) => {
    const application = applicant.admission_applications?.[0];

    return (
      application?.academic_program?.name ||
      'Not assigned'
    );
  };

  const getStatus = (applicant) => {
    const application = applicant.admission_applications?.[0];

    return application?.status || 'Pending';
  };

  const getInitials = (applicant) => {
    const name = formatName(applicant);

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) return true;

    const name = formatName(applicant).toLowerCase();
    const email =
      applicant.user?.email?.toLowerCase() || '';
    const program = getProgram(applicant).toLowerCase();

    return (
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      program.includes(searchValue)
    );
  });

  const restoreApplicant = async (applicant) => {
    const applicantName = formatName(applicant);

    const confirmed = await confirm({
      title: 'Restore Applicant',
      message: `Are you sure you want to restore ${applicantName}?`,
      confirmLabel: 'Restore',
      destructive: false,
    });

    if (!confirmed) return;

    try {
      setError('');

      await api.put(
        `/admin/applicants/${applicant.id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadArchivedApplicants(true);
    } catch (err) {
      console.error('Failed to restore applicant:', err);

      setError(
        err.response?.data?.message ||
          'Failed to restore applicant.'
      );
    }
  };

  const getStatusClasses = (status) => {
    const normalizedStatus = String(status).toLowerCase();

    if (normalizedStatus === 'approved') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40';
    }

    if (normalizedStatus === 'rejected') {
      return 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40';
    }

    return 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950 page-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
            <div className="relative w-16 h-16 mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-[#123B5D]/10 dark:border-white/10" />

              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#123B5D] border-r-[#0F766E] animate-spin" />

              <div className="absolute inset-3 rounded-full bg-[#123B5D] flex items-center justify-center">
                <Archive
                  size={20}
                  className="text-white"
                />
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Loading archived applicants...
            </h2>

            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Please wait a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950 page-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Hero */}
        <div className="ep-page-banner relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg p-6 sm:p-8 mb-6 animate-fade-up">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 animate-float" />
          <div className="absolute -bottom-20 -left-12 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/3 w-20 h-20 rounded-full bg-white/5 blur-sm" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-100 text-xs font-semibold mb-4">
                <ShieldCheck size={14} />
                Applicant Management
              </div>

              <div className="flex items-start gap-4">
                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
                  <Archive
                    size={27}
                    className="text-white"
                  />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Archived Applicants
                  </h1>

                  <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-2xl">
                    View archived applicant records and restore
                    them when necessary.
                  </p>
                </div>
              </div>
            </div>

            
          </div>
        </div>

        {/* Error */}
        {error && (
          <ErrorMessage message={error}><div className="mb-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/40 px-5 py-4 animate-fade-up">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertCircle
                  size={18}
                  className="text-red-600 dark:text-red-400"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
                  Unable to load archived applicants
                </h3>

                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div></ErrorMessage>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
          <div className="ep-card ep-hover-lift p-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Total Archived
                </p>

                <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">
                  {applicants.length}
                </p>

                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  Archived applicant records
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Archive
                  size={21}
                  className="text-slate-600 dark:text-slate-300"
                />
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-gradient-to-r from-slate-500 to-slate-300 mt-5" />
          </div>

          <div className="ep-card ep-hover-lift p-5 animate-fade-up">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Search Results
                </p>

                <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">
                  {filteredApplicants.length}
                </p>

                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  Records matching your search
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Search
                  size={21}
                  className="text-[#123B5D] dark:text-blue-400"
                />
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-gradient-to-r from-[#123B5D] to-[#0F766E] mt-5" />
          </div>

          <div className="ep-card ep-hover-lift p-5 animate-fade-up sm:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Records Available
                </p>

                <p className="text-3xl font-extrabold text-gray-800 dark:text-white mt-2">
                  {applicants.length > 0 ? 'Yes' : 'No'}
                </p>

                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  Current archive status
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Users
                  size={21}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 mt-5" />
          </div>
        </div>

        {/* Search */}
        <div className="ep-card p-5 mb-6 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Search Archived Records
              </h2>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Search by applicant name, email, or program.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-300">
              <Archive size={14} />
              {filteredApplicants.length} Result
              {filteredApplicants.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="relative max-w-2xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search archived applicants..."
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition"
            />
          </div>
        </div>

        {/* Archived Records */}
        <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">
          {/* Section Header */}
          <div className="px-5 sm:px-6 py-5 border-b border-gray-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-blue-900/20 flex items-center justify-center">
                  <Archive
                    size={20}
                    className="text-[#123B5D] dark:text-blue-400"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Archived Records
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                    Manage previously archived applicants
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold w-fit">
                <Users size={14} />
                {filteredApplicants.length} Archived
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredApplicants.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5 animate-float">
                {search ? (
                  <Search
                    size={28}
                    className="text-slate-400 dark:text-slate-500"
                  />
                ) : (
                  <Archive
                    size={28}
                    className="text-slate-400 dark:text-slate-500"
                  />
                )}
              </div>

              <h3 className="text-base font-bold text-gray-700 dark:text-slate-200">
                {search
                  ? 'No matching applicants'
                  : 'No archived applicants'}
              </h3>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {search
                  ? 'Try adjusting your search terms to find another archived applicant.'
                  : 'Archived applicant records will appear here when records are archived.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-800">
                      <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Applicant
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Email
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Program
                      </th>

                      <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Status
                      </th>

                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredApplicants.map((applicant) => {
                      const status = getStatus(applicant);

                      return (
                        <tr
                          key={applicant.id}
                          className="group hover:bg-gray-50 dark:hover:bg-slate-900/50 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {getInitials(applicant)}
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-gray-800 dark:text-white truncate max-w-[220px]">
                                  {formatName(applicant)}
                                </div>

                                <div className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
                                  Archived record
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                              <Mail
                                size={15}
                                className="text-gray-400 dark:text-slate-500"
                              />

                              <span className="truncate max-w-[220px]">
                                {applicant.user?.email || 'No email'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                              <GraduationCap
                                size={16}
                                className="text-gray-400 dark:text-slate-500"
                              />

                              <span>
                                {getProgram(applicant)}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${getStatusClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  window.location.href = `/admin/applicants/${applicant.id}`;
                                }}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#123B5D] text-white text-sm font-semibold hover:bg-[#0F3553] hover:shadow-md transition"
                              >
                                <Eye size={15} />
                                View
                                <ArrowUpRight
                                  size={14}
                                  className="  transition"
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  restoreApplicant(applicant)
                                }
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                              >
                                <RotateCcw size={15} />
                                Restore
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Cards */}
              <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-800">
                {filteredApplicants.map((applicant) => {
                  const status = getStatus(applicant);

                  return (
                    <div
                      key={applicant.id}
                      className="p-5 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {getInitials(applicant)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-gray-800 dark:text-white">
                                {formatName(applicant)}
                              </h3>

                              <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
                                Archived applicant
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize w-fit ${getStatusClasses(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                              <Mail
                                size={15}
                                className="text-gray-400 dark:text-slate-500 shrink-0"
                              />

                              <span className="truncate">
                                {applicant.user?.email || 'No email'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                              <GraduationCap
                                size={15}
                                className="text-gray-400 dark:text-slate-500 shrink-0"
                              />

                              <span>
                                {getProgram(applicant)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 mt-5">
                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = `/admin/applicants/${applicant.id}`;
                              }}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B5D] text-white text-sm font-semibold hover:bg-[#0F3553] transition"
                            >
                              <Eye size={15} />
                              View Applicant
                              <ArrowUpRight size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                restoreApplicant(applicant)
                              }
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                            >
                              <RotateCcw size={15} />
                              Restore
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ArchivedApplicantsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <ArchivedApplicants confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default ArchivedApplicantsWrapper;