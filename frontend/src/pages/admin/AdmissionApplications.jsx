import ErrorMessage from '../../components/ui/ErrorMessage';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

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
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import ApplicantApplicationGroups from '../../components/ApplicantApplicationGroups';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import { LoadingState } from '../../components/ui/Shared';

const AdmissionApplicationDetails = lazy(() => import('./AdmissionApplicationDetails'));

const AdmissionApplications = ({ confirm }) => {
  const { token } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editor, setEditor] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const detailsBusyRef = useRef(false);
  const closeDetails = useCallback(() => {
    if (!detailsBusyRef.current) setSelectedApplication(null);
  }, []);
  const handleDetailsBusy = useCallback((busy) => {
    detailsBusyRef.current = busy;
    setDetailsBusy(busy);
  }, []);

  // ==========================================
  // LOAD APPLICATIONS
  // ==========================================

  const loadApplications = useCallback(async (showRefresh = false) => {
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
  }, [token]);

  const openEditor = async (application = null) => {
    setEditorError('');
    try {
      const [applicantResponse, programResponse] = await Promise.all([
        api.get('/admin/applicants', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/programs', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const applicantData = applicantResponse.data?.data ?? applicantResponse.data;
      const programData = programResponse.data?.data ?? programResponse.data;
      setApplicants(Array.isArray(applicantData) ? applicantData : []);
      setPrograms(Array.isArray(programData) ? programData : []);
      setEditor({
        application,
        applicant_id: application?.applicant_id ?? '',
        academic_program_id: application?.academic_program_id ?? '',
        remarks: application?.remarks ?? '',
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load applicants and programs.');
    }
  };

  const saveApplication = async (event) => {
    event.preventDefault();
    if (!editor || saving) return;
    setSaving(true);
    setEditorError('');
    try {
      const payload = {
        academic_program_id: Number(editor.academic_program_id),
        remarks: editor.remarks || null,
      };
      if (editor.application) {
        await api.put(`/admin/admission-applications/${editor.application.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/admin/admission-applications', {
          ...payload,
          applicant_id: Number(editor.applicant_id),
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditor(null);
      await loadApplications(true);
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      setEditorError(
        Object.values(validation || {}).flat()[0] ||
        requestError.response?.data?.message || 'Unable to save this application.'
      );
    } finally {
      setSaving(false);
    }
  };

  const withdrawApplication = async (application) => {
    const approved = await confirm({
      title: 'Withdraw application?',
      message: 'This removes the application from active review. Its record, documents, and history will be retained.',
      confirmLabel: 'Withdraw application',
    });
    if (!approved) return;
    try {
      await api.delete(`/admin/admission-applications/${application.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadApplications(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to withdraw this application.');
    }
  };
  useAutoRefresh(() => {
    loadApplications(true);
  });

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    if (!token) {
      return;
    }

    queueMicrotask(() => {
      loadApplications();
    });
  }, [token, loadApplications]);

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

      case 'withdrawn':
        return {
          label: 'Withdrawn',
          className:
            'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
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

      <section className="ep-page-banner ep-brand-gradient relative overflow-hidden rounded-2xl p-6 shadow-lg sm:p-8">

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

          <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openEditor()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4B400] px-5 py-3 font-semibold text-[#0B2941] shadow-lg transition-colors hover:bg-amber-300"
          >
            <Plus className="h-5 w-5" /> Create application
          </button>
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

        </div>

      </section>

      {/* ==========================================
          ALERT
      ========================================== */}

      {error && (
        <ErrorMessage message={error}><div className="animate-fade-up flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">

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

        </div></ErrorMessage>
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

              <option value="withdrawn">
                Withdrawn
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

          <ApplicantApplicationGroups applications={filteredApplications}>
            {(groupApplications) => (
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

                {groupApplications.map(
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

                          <div className="flex justify-end gap-2">
                            {(application.status === 'pending' || application.status === 'rejected') && (
                              <>
                                <button type="button" onClick={() => openEditor(application)} title="Edit application"
                                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                                  <Pencil className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Edit</span>
                                </button>
                                <button type="button" onClick={() => withdrawApplication(application)} title="Withdraw application"
                                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30">
                                  <Trash2 className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Delete</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedApplication(application)}
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
          </ApplicantApplicationGroups>
        )}

      </section>

      {selectedApplication && (
        <ModalPortal onEscape={closeDetails}>
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4"
            onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails(); }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="admission-details-title"
              aria-busy={detailsBusy}
              className="ep-card animate-scale-in flex max-h-[calc(100dvh-2rem)] w-full max-w-7xl flex-col overflow-hidden"
            >
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div className="min-w-0">
                  <h2 id="admission-details-title" className="text-lg font-bold text-[#123B5D] dark:text-sky-300">Admission Application Details</h2>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">#{selectedApplication.id} · {formatName(selectedApplication.applicant)}</p>
                </div>
                <button type="button" onClick={closeDetails} disabled={detailsBusy} aria-label="Close application details" className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800">
                  <X size={20} />
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                <Suspense fallback={<LoadingState message="Loading admission application..." />}>
                  <AdmissionApplicationDetails key={selectedApplication.id} applicationId={selectedApplication.id} onClose={closeDetails} onBusyChange={handleDetailsBusy} />
                </Suspense>
              </div>
            </section>
          </div>
        </ModalPortal>
      )}

      {editor && (
        <ModalPortal onEscape={() => !saving && setEditor(null)}>
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="application-editor-title" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h2 id="application-editor-title" className="text-xl font-bold text-gray-900 dark:text-white">
              {editor.application ? 'Edit admission application' : 'Create admission application'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {editor.application ? 'Applicant ownership and workflow status remain unchanged.' : 'Creates a pending application for the current open admission period.'}
            </p>
            {editorError && <ErrorMessage message={editorError}><p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{editorError}</p></ErrorMessage>}
            <form onSubmit={saveApplication} className="mt-5 space-y-4">
              {!editor.application && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Applicant
                  <select required value={editor.applicant_id} onChange={(event) => setEditor({ ...editor, applicant_id: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                    <option value="">Select applicant</option>
                    {applicants.map((applicant) => <option key={applicant.id} value={applicant.id}>{applicant.display_name || [applicant.first_name, applicant.last_name].filter(Boolean).join(' ') || `Applicant #${applicant.id}`}</option>)}
                  </select>
                </label>
              )}
              {editor.application && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">Applicant: {formatName(editor.application.applicant)}</p>}
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Academic program
                <select required value={editor.academic_program_id} onChange={(event) => setEditor({ ...editor, academic_program_id: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <option value="">Select program</option>
                  {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Remarks
                <textarea maxLength={1000} rows={4} value={editor.remarks} onChange={(event) => setEditor({ ...editor, remarks: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-800" />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" disabled={saving} onClick={() => setEditor(null)} className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-[#123B5D] px-4 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editor.application ? 'Save changes' : 'Create application'}</button>
              </div>
            </form>
          </section>
        </div>
        </ModalPortal>
      )}

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

const AdmissionApplicationsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();
  return <><AdmissionApplications confirm={confirm} /><ConfirmDialogHost dialog={dialog} /></>;
};

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

export default AdmissionApplicationsWrapper;
