import { useCallback, useEffect, useRef, useState } from 'react';
import ErrorMessage from '../../components/ui/ErrorMessage';

import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  ClipboardList,
  UserRound,
  CalendarDays,
  Filter,
  GraduationCap,
  X,
  History,
  Clock3,
} from 'lucide-react';

import api from '../../services/api';
import ApplicantApplicationGroups from '../../components/ApplicantApplicationGroups';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';

const AdmissionApplications = ({ confirm }) => {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  // Search is submitted explicitly; typing alone must not reload the queue.
  const searchInputRef = useRef('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  const fetchApplications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setMessage('');
      setErrorMessage('');

      const response = await api.get('/staff/admission-applications', {
        params: {
          search: searchInputRef.current || undefined,
          status: status || undefined,
        },
      });

      setApplications(response.data?.data || []);
    } catch (error) {
      console.error('Fetch admission applications error:', error);

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to load admission applications.'
      );

      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);
  useAutoRefresh(() => {
    fetchApplications(true);
  });

  useEffect(() => {
    queueMicrotask(() => {
      fetchApplications();
    });
  }, [status, fetchApplications]);

  const handleSearch = (event) => {
    searchInputRef.current = event.target.value;
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchApplications();
  };

  const handleRefresh = () => {
    fetchApplications(true);
  };

  const handleApprove = async (id) => {
    setErrorMessage('');
    const confirmed = await confirm({
      title: 'Approve Application',
      message: 'Are you sure you want to approve this admission application?',
      confirmLabel: 'Approve',
      destructive: false,
    });

    if (!confirmed) {
      return;
    }

    try {
      setMessage('');

      await api.put(`/staff/admission-applications/${id}/approve`);

      setMessage('Application approved successfully.');
      setSelectedApplication(null);

      await fetchApplications(true);
    } catch (error) {
      console.error('Approve application error:', error);

      setErrorMessage(
        error.response?.data?.message ||
          'Failed to approve application.'
      );
    }
  };

  const handleReject = async (id) => {
    setErrorMessage('');
    const remarks = window.prompt(
      'Enter the reason for rejecting this application:'
    );

    if (remarks === null) {
      return;
    }

    try {
      setMessage('');

      await api.put(
        `/staff/admission-applications/${id}/reject`,
        {
          remarks,
        }
      );

      setMessage('Application rejected successfully.');
      setSelectedApplication(null);

      await fetchApplications(true);
    } catch (error) {
      console.error('Reject application error:', error);

      setErrorMessage(
        error.response?.data?.message ||
          'Failed to reject application.'
      );
    }
  };

  const getApplicantName = (application) => {
    const applicant = application?.applicant;
    const user = applicant?.user;

    if (user?.name) {
      return user.name;
    }

    const fullName = [
      applicant?.first_name,
      applicant?.middle_name,
      applicant?.last_name,
    ]
      .filter(Boolean)
      .join(' ');

    return fullName || 'Unknown Applicant';
  };

  const getApplicantEmail = (application) => {
    return (
      application?.applicant?.user?.email ||
      'No email available'
    );
  };

  const getProgramName = (application) => {
    return (
      application?.academic_program?.name ||
      application?.academicProgram?.name ||
      'No program assigned'
    );
  };

  const getProgramCode = (application) => {
    return (
      application?.academic_program?.code ||
      application?.academicProgram?.code ||
      ''
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (applicationStatus) => {
    switch (applicationStatus) {
      case 'approved':
        return {
          label: 'Approved',
          className:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
          dotClass: 'bg-emerald-500',
          iconClass: 'text-emerald-600 dark:text-emerald-300',
        };

      case 'rejected':
        return {
          label: 'Rejected',
          className:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
          dotClass: 'bg-red-500',
          iconClass: 'text-red-600 dark:text-red-300',
        };

      case 'under_review':
        return {
          label: 'Under Review',
          className:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
          dotClass: 'bg-amber-500',
          iconClass: 'text-amber-600 dark:text-amber-300',
        };

      case 'withdrawn':
        return {
          label: 'Withdrawn',
          className:
            'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
          dotClass: 'bg-gray-400',
          iconClass: 'text-gray-500 dark:text-gray-300',
        };

      case 'pending':
      default:
        return {
          label: 'Pending',
          className:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
          dotClass: 'bg-blue-500',
          iconClass: 'text-blue-600 dark:text-blue-300',
        };
    }
  };

  const getHistoryConfig = (history) => {
    const newStatus = history?.new_status;

    switch (newStatus) {
      case 'approved':
        return {
          label: 'Application Approved',
          className:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
          iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
          icon: CheckCircle,
        };

      case 'rejected':
        return {
          label: 'Application Rejected',
          className:
            'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
          iconClass: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
          icon: XCircle,
        };

      case 'pending':
        return {
          label:
            history?.action === 'submitted'
              ? 'Application Submitted'
              : 'Application Pending',
          className:
            'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
          iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
          icon: FileText,
        };

      case 'under_review':
        return {
          label: 'Application Under Review',
          className:
            'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
          iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
          icon: ClipboardList,
        };

      case 'withdrawn':
        return {
          label: 'Application Withdrawn',
          className:
            'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
          iconClass:
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
          icon: History,
        };

      default:
        return {
          label: history?.action
            ? history.action
                .replaceAll('_', ' ')
                .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
                )
            : 'Application Updated',
          className:
            'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
          iconClass:
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
          icon: History,
        };
    }
  };

  const getHistoryUserName = (history) => {
    if (history?.user?.name) {
      return history.user.name;
    }

    return 'System User';
  };

  const getHistoryStatusLabel = (value) => {
    if (!value) {
      return null;
    }

    return value
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getApplicationHistories = (application) => {
    if (!Array.isArray(application?.histories)) {
      return [];
    }

    return [...application.histories].sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
  };

  const pendingCount = applications.filter(
    (application) =>
      !application.status ||
      application.status === 'pending'
  ).length;

  const underReviewCount = applications.filter(
    (application) => application.status === 'under_review'
  ).length;

  const approvedCount = applications.filter(
    (application) => application.status === 'approved'
  ).length;

  const rejectedCount = applications.filter(
    (application) => application.status === 'rejected'
  ).length;

  const filteredApplications = applications.filter(
    (application) => {
      if (!search.trim()) {
        return true;
      }

      const applicant = application?.applicant;
      const user = applicant?.user;

      const searchableText = [
        user?.name,
        user?.email,
        applicant?.first_name,
        applicant?.middle_name,
        applicant?.last_name,
        application?.academic_program?.name,
        application?.academicProgram?.name,
        application?.academic_program?.code,
        application?.academicProgram?.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(
        search.toLowerCase()
      );
    }
  );

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <tr key={index}>
        <td className="px-5 py-5">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </td>

        <td className="px-5 py-5">
          <div className="animate-pulse">
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </td>

        <td className="px-5 py-5">
          <div className="animate-pulse h-7 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
        </td>

        <td className="px-5 py-5">
          <div className="animate-pulse h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        </td>

        <td className="px-5 py-5">
          <div className="animate-pulse flex justify-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="ep-page-banner rounded-2xl p-6 shadow-lg sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center shadow-md">
                <ClipboardList
                  size={22}
                  className="text-white"
                />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Admission Applications
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Review and manage admission applications assigned to your programs.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'animate-spin' : ''}
            />

            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : pendingCount}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <FileText
                  size={21}
                  className="text-blue-600 dark:text-blue-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Under Review
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : underReviewCount}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ClipboardList
                  size={21}
                  className="text-amber-600 dark:text-amber-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Approved
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : approvedCount}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle
                  size={21}
                  className="text-emerald-600 dark:text-emerald-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rejected
                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : rejectedCount}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle
                  size={21}
                  className="text-red-600 dark:text-red-300"
                />
              </div>
            </div>
          </div>
        </div>

        {errorMessage && <ErrorMessage message={errorMessage}><p>{errorMessage}</p></ErrorMessage>}
        {message && (
          <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {message}
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">

            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex gap-2"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search applicant or program..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#123B5D] text-white font-medium hover:bg-[#0e304a] transition"
              >
                Search
              </button>
            </form>

            <div className="relative lg:w-56">
              <Filter
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full appearance-none pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">
                  Under Review
                </option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        <ApplicantApplicationGroups applications={loading ? [] : filteredApplications}>
          {(groupApplications) => (<>
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Applications
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {loading
                    ? 'Loading applications...'
                    : `${groupApplications.length} application${
                        groupApplications.length === 1
                          ? ''
                          : 's'
                      } found`}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Applicant
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Program
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Date
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  renderSkeletonRows()
                ) : groupApplications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-16">
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                          <ClipboardList
                            size={25}
                            className="text-gray-400"
                          />
                        </div>

                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          No applications found
                        </h3>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Try changing your search or filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupApplications.map((application) => {
                    const statusConfig =
                      getStatusConfig(application.status);

                    const applicantName =
                      getApplicantName(application);

                    const applicantEmail =
                      getApplicantEmail(application);

                    const programName =
                      getProgramName(application);

                    const programCode =
                      getProgramCode(application);

                    const isPending =
                      !application.status ||
                      application.status === 'pending';

                    return (
                      <tr
                        key={application.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-[#123B5D]/30 flex items-center justify-center flex-shrink-0">
                              <UserRound
                                size={18}
                                className="text-[#123B5D] dark:text-blue-300"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
                                {applicantName}
                              </p>

                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px] mt-0.5">
                                {applicantEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                              <GraduationCap
                                size={15}
                                className="text-[#0F766E] dark:text-teal-300"
                              />
                            </div>

                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {programName}
                              </p>

                              {programCode && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {programCode}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${statusConfig.className}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}
                            />

                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <CalendarDays
                              size={16}
                              className="text-gray-400"
                            />

                            {formatDate(
                              application.created_at
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-center gap-2">

                            <button
                              type="button"
                              title="View application"
                              onClick={() =>
                                setSelectedApplication(
                                  application
                                )
                              }
                              className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#123B5D] dark:hover:text-blue-300 transition"
                            >
                              <Eye size={17} />
                            </button>

                            {isPending && (
                              <button
                                type="button"
                                title="Approve application"
                                onClick={() =>
                                  handleApprove(
                                    application.id
                                  )
                                }
                                className="w-9 h-9 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
                              >
                                <CheckCircle size={17} />
                              </button>
                            )}

                            {isPending && (
                              <button
                                type="button"
                                title="Reject application"
                                onClick={() =>
                                  handleReject(
                                    application.id
                                  )
                                }
                                className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                              >
                                <XCircle size={17} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>

                <div className="mt-5 h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="mt-4 h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="mt-5 h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            ))
          ) : groupApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <ClipboardList
                  size={25}
                  className="text-gray-400"
                />
              </div>

              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                No applications found
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            groupApplications.map((application) => {
              const statusConfig =
                getStatusConfig(application.status);

              const applicantName =
                getApplicantName(application);

              const applicantEmail =
                getApplicantEmail(application);

              const programName =
                getProgramName(application);

              const programCode =
                getProgramCode(application);

              const isPending =
                !application.status ||
                application.status === 'pending';

              return (
                <div
                  key={application.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-[#123B5D]/30 flex items-center justify-center flex-shrink-0">
                        <UserRound
                          size={19}
                          className="text-[#123B5D] dark:text-blue-300"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {applicantName}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {applicantEmail}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold whitespace-nowrap ${statusConfig.className}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}
                      />

                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="mt-5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                        <GraduationCap
                          size={15}
                          className="text-[#0F766E] dark:text-teal-300"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Program
                        </p>

                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {programName}
                        </p>

                        {programCode && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {programCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-4">
                    <CalendarDays size={15} />

                    Submitted {formatDate(application.created_at)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedApplication(
                          application
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() =>
                          handleApprove(application.id)
                        }
                        className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        onClick={() =>
                          handleReject(application.id)
                        }
                        className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>)}
        </ApplicantApplicationGroups>
      </div>

      {selectedApplication && (
        <ModalPortal onEscape={() => setSelectedApplication(null)}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Application Details"
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">

            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Application Details
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Review the applicant's admission application.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedApplication(null)
                }
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-[#123B5D]/30 flex items-center justify-center">
                    <UserRound
                      size={20}
                      className="text-[#123B5D] dark:text-blue-300"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Applicant Information
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Personal information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Full Name
                    </p>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {getApplicantName(
                        selectedApplication
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </p>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">
                      {getApplicantEmail(
                        selectedApplication
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                    <GraduationCap
                      size={20}
                      className="text-[#0F766E] dark:text-teal-300"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Admission Information
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Application details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Program
                    </p>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {getProgramName(
                        selectedApplication
                      )}
                    </p>

                    {getProgramCode(
                      selectedApplication
                    ) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getProgramCode(
                          selectedApplication
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </p>

                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                        getStatusConfig(
                          selectedApplication.status
                        ).className
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          getStatusConfig(
                            selectedApplication.status
                          ).dotClass
                        }`}
                      />

                      {
                        getStatusConfig(
                          selectedApplication.status
                        ).label
                      }
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Submitted
                    </p>

                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatDate(
                        selectedApplication.created_at
                      )}
                    </p>
                  </div>

                  {selectedApplication.updated_at && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Last Updated
                      </p>

                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(
                          selectedApplication.updated_at
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedApplication.remarks && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText
                      size={18}
                      className="text-gray-500 dark:text-gray-400"
                    />

                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Remarks
                    </h3>
                  </div>

                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedApplication.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Application History */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <History
                      size={20}
                      className="text-indigo-600 dark:text-indigo-300"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Application History
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Track changes and actions made to this application.
                    </p>
                  </div>
                </div>

                {getApplicationHistories(
                  selectedApplication
                ).length === 0 ? (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 text-center">
                    <History
                      size={24}
                      className="mx-auto text-gray-400 mb-3"
                    />

                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No history available
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Application activity will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-6">
                      {getApplicationHistories(
                        selectedApplication
                      ).map((history, index) => {
                        const historyConfig =
                          getHistoryConfig(history);

                        const HistoryIcon =
                          historyConfig.icon;

                        const oldStatus =
                          getHistoryStatusLabel(
                            history.old_status
                          );

                        const newStatus =
                          getHistoryStatusLabel(
                            history.new_status
                          );

                        return (
                          <div
                            key={
                              history.id ||
                              `${history.created_at}-${index}`
                            }
                            className="relative flex gap-4"
                          >
                            <div
                              className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${historyConfig.iconClass}`}
                            >
                              <HistoryIcon size={17} />
                            </div>

                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {historyConfig.label}
                                  </h4>

                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {getHistoryUserName(
                                      history
                                    )}
                                  </p>
                                </div>

                                <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                  <Clock3 size={13} />
                                  {formatDateTime(
                                    history.created_at
                                  )}
                                </div>
                              </div>

                              {(oldStatus || newStatus) && (
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  {oldStatus && (
                                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                      {oldStatus}
                                    </span>
                                  )}

                                  {oldStatus && newStatus && (
                                    <span className="text-gray-400">
                                      →
                                    </span>
                                  )}

                                  {newStatus && (
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${historyConfig.className}`}
                                    >
                                      {newStatus}
                                    </span>
                                  )}
                                </div>
                              )}

                              {history.remarks && (
                                <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/70 px-3 py-2.5">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Remarks
                                  </p>

                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {history.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-5 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-end gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedApplication(null)
                  }
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Close
                </button>

                {(!selectedApplication.status ||
                  selectedApplication.status === 'pending') && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleReject(
                          selectedApplication.id
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                    >
                      <XCircle size={17} />
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleApprove(
                          selectedApplication.id
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
                    >
                      <CheckCircle size={17} />
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
};

const AdmissionApplicationsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <AdmissionApplications confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default AdmissionApplicationsWrapper;

