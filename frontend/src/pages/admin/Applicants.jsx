import ErrorMessage from '../../components/ui/ErrorMessage';
import OnlineDot from '../../components/ui/OnlineDot';
import useOnlinePresence from '../../hooks/useOnlinePresence';

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, User, Mail, Phone, Calendar, ArrowUpDown, Eye, AlertCircle, Archive, ShieldCheck, Filter, X, CheckCircle2, Loader2, GraduationCap, SlidersHorizontal, RotateCcw } from 'lucide-react';

import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import { LoadingState } from '../../components/ui/Shared';

import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const inputClass =
  'w-full rounded-xl border border-gray-200/90 bg-white/70 px-4 py-3 text-sm text-gray-800 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-teal-500 dark:focus:ring-teal-500/10';

const labelClass =
  'mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400';

const ApplicantDetails = lazy(() => import('./ApplicantDetails'));

const Applicants = ({ confirm }) => {
  const { token } = useAuth();

  const [applicants, setApplicants] = useState([]);
  const online = useOnlinePresence(applicants.map((applicant) => applicant.user?.id ?? applicant.user_id));
  const [programs, setPrograms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const applicantRequestRef = useRef(0);
  const filterTimerRef = useRef(null);
  const invalidateApplicantRequests = useCallback(() => { applicantRequestRef.current++; }, []);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const detailsSavingRef = useRef(false);
  const closeDetails = useCallback(() => {
    if (!detailsSavingRef.current) setSelectedApplicant(null);
  }, []);
  const handleDetailsSaving = useCallback((busy) => {
    detailsSavingRef.current = busy;
    setDetailsSaving(busy);
  }, []);

  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState('');
  const [status, setStatus] = useState('');
  const [documentStatus, setDocumentStatus] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  const activeFilterCount = [
    search.trim(),
    programId,
    status,
    documentStatus,
  ].filter(Boolean).length;

  const loadPrograms = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get('/admin/programs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setPrograms(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []
      );
    } catch (err) {
      console.error('Failed to load programs:', err);
    }
  }, [token]);

  const loadApplicants = useCallback(
    async (showRefresh = false, filters = null) => {
      const request = ++applicantRequestRef.current;
      if (!token) {
        setLoading(false);
        return;
      }

      // The initial loading state is set on mount. Later requests update only
      // the results, keeping the page and the focused filter control mounted.
      if (showRefresh) setRefreshing(true);

      setError('');

      const activeFilters = filters || {
        search: search.trim(),
        program_id: programId,
        status,
        document_status: documentStatus,
      };

      try {
        const response = await api.get('/admin/applicants', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: activeFilters,
        });

        const data = response.data;
        if (request !== applicantRequestRef.current) return;

        setApplicants(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : []
        );
      } catch (err) {
        if (request !== applicantRequestRef.current) return;
        console.error('Failed to load applicants:', err);

        setError(
          err.response?.data?.message ||
            'Failed to load applicants. Please try again.'
        );
      } finally {
        if (request === applicantRequestRef.current) {
        setLoading(false);
        setRefreshing(false);
        }
      }
    },
    [token, search, programId, status, documentStatus]
  );
  useAutoRefresh(async () => {
    await loadApplicants(true);
    await loadPrograms();
  });

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      loadPrograms();
    });
  }, [token, loadPrograms]);

  useEffect(() => {
    const timer = setTimeout(() => { loadApplicants(true); }, 250);
    filterTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      invalidateApplicantRequests();
    };
  }, [loadApplicants, invalidateApplicantRequests]);

  const sortedApplicants = useMemo(() => {
    return [...applicants].sort((a, b) => {
      if (sortBy === 'name_asc' || sortBy === 'name_desc') {
        const direction = sortBy === 'name_asc' ? 1 : -1;

        const lastNameCompare = (a.last_name || '').localeCompare(
          b.last_name || ''
        );

        if (lastNameCompare !== 0) {
          return lastNameCompare * direction;
        }

        return (a.first_name || '').localeCompare(
          b.first_name || ''
        ) * direction;
      }

      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : 0;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : 0;

      return sortBy === 'date_asc'
        ? dateA - dateB
        : dateB - dateA;
    });
  }, [applicants, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setProgramId('');
    setStatus('');
    setDocumentStatus('');

  };

  const formatName = (applicant) => {
    const parts = [
      applicant?.first_name,
      applicant?.middle_name,
      applicant?.last_name,
    ].filter(Boolean);

    return parts.join(' ') || 'Unnamed Applicant';
  };

  const getInitials = (applicant) => {
    const first = applicant?.first_name?.trim() || '';
    const last = applicant?.last_name?.trim() || '';

    if (!first && !last) return '?';

    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return 'Not provided';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Not provided';
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const archiveApplicant = async (applicant) => {
    const confirmed = await confirm({
      title: 'Archive Applicant',
      message: `Are you sure you want to archive ${formatName(applicant)}?`,
      confirmLabel: 'Archive',
    });

    if (!confirmed) return;

    try {
      setError('');

      await api.delete(`/admin/applicants/${applicant.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await loadApplicants(true);
    } catch (err) {
      console.error('Failed to archive applicant:', err);

      setError(
        err.response?.data?.message ||
          'Failed to archive applicant. Please try again.'
      );
    }
  };

  const handleApplyFilters = () => {
    clearTimeout(filterTimerRef.current);
    loadApplicants(true, {
      search: search.trim(),
      program_id: programId,
      status,
      document_status: documentStatus,
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="page-transition space-y-6 pb-8">
      {/* HERO */}
      <section className="ep-page-banner ep-brand-gradient relative isolate overflow-hidden rounded-3xl shadow-xl shadow-slate-950/10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-24 w-24 rounded-full border border-white/10" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="animate-fade-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Administration / Applicants
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Applicant Management
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Manage registered Trinidad Municipal College applicants,
              review records, and find the information you need.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-white/80">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Users className="h-4 w-4 text-teal-200" />
                {applicants.length} loaded records
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <GraduationCap className="h-4 w-4 text-amber-200" />
                Academic admissions
              </span>
            </div>
          </div>

          <Link
            to="/admin/applicants/archived"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#123B5D] lg:self-center"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archived Applicants
          </Link>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <ErrorMessage message={error}><div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-bold">Something went wrong</p>
            <p className="mt-1 text-sm leading-5">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadApplicants(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div></ErrorMessage>
      )}

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total applicants"
          value={applicants.length}
          description="Records returned by the server"
          icon={Users}
          tone="blue"
          delay="0ms"
        />

        <StatCard
          label="Current results"
          value={sortedApplicants.length}
          description={
            activeFilterCount
              ? 'Sorted results for current filters'
              : 'Applicants currently displayed'
          }
          icon={Search}
          tone="gold"
          delay="80ms"
        />

        <StatCard
          label="Active filters"
          value={activeFilterCount}
          description="Search and criteria selected"
          icon={SlidersHorizontal}
          tone="teal"
          delay="160ms"
        />
      </section>

      {/* FILTER PANEL */}
      <section className="ep-card animate-fade-up overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-4 border-b border-gray-200/80 p-5 dark:border-gray-700/80 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeading
            icon={Filter}
            title="Search & filters"
            description="Narrow down applicant records using admission criteria."
          />

          {activeFilterCount > 0 && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {activeFilterCount} active
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="applicant-search">
                Search applicants
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  id="applicant-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyFilters();
                  }}
                  placeholder="Search by applicant name or email..."
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="applicant-program">
                Academic program
              </label>

              <select
                id="applicant-program"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className={inputClass}
              >
                <option value="">All programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="applicant-status">
                Admission status
              </label>

              <select
                id="applicant-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="document-status">
                Document status
              </label>

              <select
                id="document-status"
                value={documentStatus}
                onChange={(e) => setDocumentStatus(e.target.value)}
                className={inputClass}
              >
                <option value="">All documents</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="applicant-sort">
                Sort records
              </label>

              <div className="relative">
                <ArrowUpDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <select
                  id="applicant-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`${inputClass} pl-10`}
                >
                  <option value="date_desc">Newest first</option>
                  <option value="date_asc">Oldest first</option>
                  <option value="name_asc">Name: A–Z</option>
                  <option value="name_desc">Name: Z–A</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-3 sm:flex-row md:col-span-2 xl:col-span-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={refreshing}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-950/10 transition-colors duration-200  hover:bg-[#0D304B] disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                <Search className="h-4 w-4" />
                Apply filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS HEADING */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
            Applicant directory
          </p>

          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Registered applicants
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {sortedApplicants.length} result
            {sortedApplicants.length !== 1 ? 's' : ''} displayed
          </p>
          {refreshing && <p role="status" className="mt-1 text-xs text-gray-500 dark:text-gray-400">Updating results...</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <X className="h-3.5 w-3.5" />
              Clear active filters
            </button>
          )}

          
        </div>
      </div>

      {/* EMPTY STATES */}
      {applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants found"
          description={
            activeFilterCount
              ? 'No applicant records match the current criteria. Try clearing your filters.'
              : 'There are currently no applicant records available to display.'
          }
          action={
            activeFilterCount ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0D304B] dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                <RotateCcw className="h-4 w-4" />
                Clear filters
              </button>
            ) : null
          }
        />
      ) : sortedApplicants.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching applicants"
          description="Try changing your search, program, or status filters."
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0D304B] dark:bg-teal-700 dark:hover:bg-teal-600"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          }
        />
      ) : (
        <section className="ep-card overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 border-b border-gray-200/80 p-5 dark:border-gray-700/80 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <SectionHeading
              icon={Users}
              title="Applicant records"
              description="Applicant contact information and registration dates. Green dots indicate online activity within the last 90 seconds."
            />

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {sortedApplicants.length} displayed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-gray-200/80 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900/40">
                <tr>
                  {[
                    'Applicant',
                    'Email address',
                    'Phone',
                    'Gender',
                    'Registration date',
                    'Actions',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={`px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {sortedApplicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className="group transition-colors duration-200 hover:bg-teal-50/40 dark:hover:bg-teal-950/10"
                  >
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-teal-700 text-sm font-extrabold text-white shadow-sm transition-transform duration-200 ">
                          {getInitials(applicant)}
                          <OnlineDot online={online[applicant.user?.id ?? applicant.user_id]} />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[210px] truncate text-sm font-bold text-gray-900 dark:text-white">
                            {formatName(applicant)}
                          </p>

                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="max-w-[220px] truncate text-sm text-gray-600 dark:text-gray-300">
                          {applicant.user?.email || 'No email provided'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {applicant.phone || 'Not provided'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <span className="inline-flex items-center gap-2 text-sm capitalize text-gray-600 dark:text-gray-300">
                        <User className="h-4 w-4 text-gray-400" />
                        {applicant.gender || 'Not provided'}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(applicant.created_at)}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedApplicant(applicant)}
                          aria-label={`View ${formatName(applicant)}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors  hover:bg-[#0D304B] dark:bg-teal-700 dark:hover:bg-teal-600"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => archiveApplicant(applicant)}
                          aria-label={`Archive ${formatName(applicant)}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-600 transition-colors  hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200/80 bg-gray-50/50 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>EduPath · Trinidad Municipal College</span>
            <span>Showing {sortedApplicants.length} loaded record(s)</span>
          </div>
        </section>
      )}
      {selectedApplicant && (
        <ModalPortal onEscape={closeDetails}>
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4"
            onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails(); }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="applicant-details-title"
              aria-busy={detailsSaving}
              className="ep-card animate-scale-in flex max-h-[calc(100dvh-2rem)] w-full max-w-7xl flex-col overflow-hidden"
            >
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div className="min-w-0">
                  <h2 id="applicant-details-title" className="text-lg font-bold text-[#123B5D] dark:text-sky-300">Applicant Details</h2>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">{formatName(selectedApplicant)}</p>
                </div>
                <button type="button" onClick={closeDetails} disabled={detailsSaving} aria-label="Close applicant details" className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800">
                  <X size={20} />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <Suspense fallback={<LoadingState message="Loading applicant details..." />}>
                  <ApplicantDetails key={selectedApplicant.id} applicantId={selectedApplicant.id} onClose={closeDetails} onSavingChange={handleDetailsSaving} />
                </Suspense>
              </div>
            </section>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

/* STAT CARD */

const StatCard = ({
  label,
  value,
  description,
  icon: Icon,
  tone,
  delay,
}) => {
  const tones = {
    blue: {
      icon: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
      line: 'from-blue-600 to-cyan-500',
      label: 'text-blue-700 dark:text-blue-300',
    },
    gold: {
      icon: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
      line: 'from-amber-500 to-yellow-400',
      label: 'text-amber-700 dark:text-amber-300',
    },
    teal: {
      icon: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
      line: 'from-teal-600 to-emerald-400',
      label: 'text-teal-700 dark:text-teal-300',
    },
  };

  const selectedTone = tones[tone] || tones.blue;

  return (
    <article
      className="ep-card ep-hover-lift animate-fade-up relative overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-extrabold uppercase tracking-wider ${selectedTone.label}`}>
            {label}
          </p>

          <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <div className={`rounded-2xl p-3 ${selectedTone.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${selectedTone.line}`} />
      </div>
    </article>
  );
};

/* SECTION HEADING */

const SectionHeading = ({ icon: Icon, title, description }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#123B5D] dark:bg-blue-950/60 dark:text-teal-300">
      <Icon className="h-5 w-5" />
    </div>

    <div className="min-w-0">
      <h2 className="text-base font-extrabold text-gray-900 dark:text-white sm:text-lg">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400 sm:text-sm">
        {description}
      </p>
    </div>
  </div>
);

/* EMPTY STATE */

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <section className="ep-card animate-fade-up rounded-2xl px-6 py-12 text-center sm:px-10">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300">
      <Icon className="h-7 w-7" />
    </div>

    <h2 className="mt-5 text-xl font-extrabold text-gray-900 dark:text-white">
      {title}
    </h2>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
      {description}
    </p>

    {action}
  </section>
);

/* SKELETON LOADER */

const DashboardSkeleton = () => (
  <div className="page-transition space-y-6">
    <section className="ep-page-banner ep-brand-gradient overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="ep-skeleton h-5 w-40 rounded-full bg-white/20" />
      <div className="ep-skeleton mt-5 h-9 w-64 max-w-full rounded-lg bg-white/20" />
      <div className="ep-skeleton mt-4 h-4 w-full max-w-xl rounded bg-white/20" />
      <div className="ep-skeleton mt-2 h-4 w-2/3 max-w-lg rounded bg-white/20" />
    </section>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="ep-card rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="ep-skeleton h-3 w-28 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="ep-skeleton h-9 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="ep-skeleton h-3 w-36 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="ep-skeleton h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="ep-skeleton mt-5 h-1 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </section>

    <section className="ep-card rounded-2xl p-5 sm:p-6">
      <div className="ep-skeleton h-5 w-44 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="ep-skeleton mt-3 h-4 w-64 max-w-full rounded bg-gray-200 dark:bg-gray-700" />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="ep-skeleton h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </section>

    <section className="ep-card overflow-hidden rounded-2xl">
      <div className="border-b border-gray-200 p-5 dark:border-gray-700">
        <div className="ep-skeleton h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="ep-skeleton mt-3 h-3 w-64 max-w-full rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex items-center gap-4 border-b border-gray-100 p-5 last:border-0 dark:border-gray-800"
        >
          <div className="ep-skeleton h-11 w-11 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="ep-skeleton h-4 w-48 max-w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="ep-skeleton h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="ep-skeleton hidden h-9 w-24 rounded-xl bg-gray-200 dark:bg-gray-700 sm:block" />
        </div>
      ))}
    </section>

    <div className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
      <Loader2 className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-400" />
      Loading applicants...
    </div>
  </div>
);

const ApplicantsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <Applicants confirm={confirm} />
      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default ApplicantsWrapper;
