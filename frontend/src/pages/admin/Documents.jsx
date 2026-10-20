import ErrorMessage from '../../components/ui/ErrorMessage';


import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import { openPrivateDocument } from '../../services/documentFile';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { notifyRefresh } from '../../services/refreshBus';
import { ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../components/ui/useConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  X,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  User,
  GraduationCap,
  CalendarDays,
  MessageSquare,
  Filter,
  FileCheck2,
  XCircle,
} from 'lucide-react';

const API_URL = getApiBaseUrl();

const getToken = () => {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('access_token')
  );
};

const getHeaders = () => {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
};

function Documents({ confirm }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

const loadDocuments = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await axios.get(`${API_URL}/admin/documents`, {
        headers: getHeaders(),
      });

      const data = response.data;

      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (Array.isArray(data?.data)) {
        setDocuments(data.data);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);

      setError(
        err?.response?.data?.message ||
          'Unable to load documents. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useAutoRefresh(() => {
    loadDocuments(true);
  });

  useEffect(() => {
    queueMicrotask(() => {
      loadDocuments();
    });
  }, [loadDocuments]);

  const normalizeStatus = (status) => {
    const value = String(status || 'pending')
      .trim()
      .toLowerCase();

    if (value === 'under review') {
      return 'under_review';
    }

    return value;
  };

  const getStatusConfig = (status) => {
    switch (normalizeStatus(status)) {
      case 'verified':
        return {
          label: 'Verified',
          className:
            'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-100 dark:border-green-900/50',
          icon: CheckCircle,
        };

      case 'under_review':
        return {
          label: 'Under Review',
          className:
            'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50',
          icon: ShieldCheck,
        };

      case 'rejected':
        return {
          label: 'Rejected',
          className:
            'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/50',
          icon: XCircle,
        };

      case 'pending':
      default:
        return {
          label: 'Pending',
          className:
            'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-900/50',
          icon: Clock,
        };
    }
  };

  const openDocument = async (document) => {
    if (!document?.file_path) {
      setError('This document does not have an uploaded file.');
      return;
    }

    try {
      // Streamed through the admin endpoint; the legacy /storage/ link had
      // no authorization behind it.
      await openPrivateDocument(
        `/admin/documents/${document.id}/file`
      );
    } catch {
      setError('Unable to open the document right now. Please try again.');
    }
  };

  const getApplicantName = (document) => {
    const applicant = document?.admission_application?.applicant;

    if (applicant) {
      const fullName = [
        applicant.first_name,
        applicant.middle_name,
        applicant.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (fullName) {
        return fullName;
      }

      if (applicant.user?.name) {
        return applicant.user.name;
      }
    }

    if (document?.applicant?.user?.name) {
      return document.applicant.user.name;
    }

    if (document?.applicant?.name) {
      return document.applicant.name;
    }

    if (document?.admission_application?.applicant?.user?.name) {
      return document.admission_application.applicant.user.name;
    }

    return 'Unknown Applicant';
  };

  const getApplicantEmail = (document) => {
    return (
      document?.admission_application?.applicant?.user?.email ||
      document?.applicant?.user?.email ||
      document?.applicant?.email ||
      'No email available'
    );
  };

  const getProgramName = (document) => {
    return (
      document?.admission_application?.academic_program?.name ||
      document?.admission_application?.academicProgram?.name ||
      document?.academic_program?.name ||
      'No program assigned'
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return documents.filter((document) => {
      const status = normalizeStatus(document.status);

      const applicantName = getApplicantName(document).toLowerCase();
      const applicantEmail = getApplicantEmail(document).toLowerCase();
      const documentName = String(
        document.document_name || ''
      ).toLowerCase();
      const programName = getProgramName(document).toLowerCase();

      const matchesSearch =
        !keyword ||
        applicantName.includes(keyword) ||
        applicantEmail.includes(keyword) ||
        documentName.includes(keyword) ||
        programName.includes(keyword);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const totalCount = documents.length;

  const pendingCount = documents.filter(
    (document) => normalizeStatus(document.status) === 'pending'
  ).length;

  const underReviewCount = documents.filter(
    (document) => normalizeStatus(document.status) === 'under_review'
  ).length;

  const verifiedCount = documents.filter(
    (document) => normalizeStatus(document.status) === 'verified'
  ).length;

  const rejectedCount = documents.filter(
    (document) => normalizeStatus(document.status) === 'rejected'
  ).length;

  const openReview = (document) => {
    setSelectedDocument(document);
    setReviewStatus(normalizeStatus(document.status));
    setReviewRemarks(document.remarks || '');
    setError('');
    setSuccess('');
  };

  const closeReview = () => {
    if (reviewLoading) {
      return;
    }

    setSelectedDocument(null);
    setReviewStatus('pending');
    setReviewRemarks('');
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!selectedDocument) {
      return;
    }

    try {
      setReviewLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        status: normalizeStatus(reviewStatus),
        remarks: reviewRemarks.trim() || null,
      };

      const response = await axios.put(
        `${API_URL}/admin/documents/${selectedDocument.id}`,
        payload,
        {
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      const updatedDocument =
        response?.data?.data || response?.data?.document || response?.data;

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === selectedDocument.id
            ? {
                ...document,
                ...(updatedDocument && typeof updatedDocument === 'object'
                  ? updatedDocument
                  : {}),
                status: payload.status,
                remarks: payload.remarks,
              }
            : document
        )
      );

      setSuccess('Document review updated successfully.');

      // Bypasses the shared api client, so notify the refresh bus manually.
      notifyRefresh();

      setSelectedDocument(null);
      setReviewStatus('pending');
      setReviewRemarks('');
    } catch (err) {
      console.error('Failed to update document:', err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.status?.[0] ||
          'Unable to update the document review.'
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDelete = async (document) => {
    const confirmed = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${document.document_name || 'this document'}"?`,
      confirmLabel: 'Delete',
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(document.id);
      setError('');
      setSuccess('');

      await axios.delete(`${API_URL}/admin/documents/${document.id}`, {
        headers: getHeaders(),
      });

      setDocuments((currentDocuments) =>
        currentDocuments.filter((item) => item.id !== document.id)
      );

      setSuccess('Document deleted successfully.');

      // Bypasses the shared api client, so notify the refresh bus manually.
      notifyRefresh();
    } catch (err) {
      console.error('Failed to delete document:', err);

      setError(
        err?.response?.data?.message ||
          'Unable to delete the document.'
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />

          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>

        <div className="h-7 w-24 rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="mt-5 h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fa] px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="ep-page-banner rounded-2xl p-6 shadow-lg sm:p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-100">
              <FileCheck2 size={18} />
              <span>Document Management</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Applicant Documents
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Review, verify, and manage documents submitted by
              applicants for admission.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDocuments(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f314d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'animate-spin' : ''}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <ErrorMessage message={error}><div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />

            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5">{error}</p>
            </div>

            <button
              type="button"
              onClick={clearMessages}
              className="rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X size={17} />
            </button>
          </div></ErrorMessage>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle className="mt-0.5 shrink-0" size={18} />

            <div className="flex-1">
              <p className="font-semibold">Success</p>
              <p className="mt-0.5">{success}</p>
            </div>

            <button
              type="button"
              onClick={clearMessages}
              className="rounded-lg p-1 transition hover:bg-green-100 dark:hover:bg-green-900/40"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Documents
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '—' : totalCount}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-[#123B5D] dark:bg-blue-950/40 dark:text-blue-300">
                <FileText size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending Review
                </p>

                <p className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                  {loading ? '—' : pendingCount}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-300">
                <Clock size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Under Review
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {loading ? '—' : underReviewCount}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <ShieldCheck size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Verified
                </p>

                <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-300">
                  {loading ? '—' : verifiedCount}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600 dark:bg-green-950/40 dark:text-green-300">
                <CheckCircle size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rejected
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-300">
                  {loading ? '—' : rejectedCount}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <XCircle size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant, document, email, or program..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter
                size={18}
                className="text-gray-400"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <FileText size={30} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
              No documents found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {search || statusFilter !== 'all'
                ? 'No documents match your current search or status filter.'
                : 'There are currently no applicant documents to display.'}
            </p>

            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-5 rounded-xl bg-[#123B5D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f314d]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredDocuments.map((document) => {
              const statusConfig = getStatusConfig(document.status);
              const StatusIcon = statusConfig.icon;
              const fileUrl = document?.file_path;

              return (
                <div
                  key={document.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200  hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300">
                        <FileText size={24} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-gray-900 dark:text-white">
                          {document.document_name ||
                            'Unnamed Document'}
                        </h3>

                        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                          {getApplicantName(document)}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                          {getApplicantEmail(document)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}
                    >
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                        <GraduationCap size={15} />
                        Program
                      </div>

                      <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {getProgramName(document)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/70">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                        <CalendarDays size={15} />
                        Submitted
                      </div>

                      <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {formatDate(
                          document.created_at ||
                            document.submitted_at
                        )}
                      </p>
                    </div>
                  </div>

                  {document.remarks && (
                    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
                        <MessageSquare size={15} />
                        Review Remarks
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                        {document.remarks}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openDocument(document)}
                      disabled={!fileUrl}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <Eye size={17} />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => openReview(document)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f314d]"
                    >
                      <ShieldCheck size={17} />
                      Review
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(document)}
                      disabled={deleteLoading === document.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                    >
                      <Trash2 size={17} />
                      {deleteLoading === document.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredDocuments.length > 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredDocuments.length} of {documents.length}{' '}
            documents
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDocument && (
        <ModalPortal
          onEscape={() => {
            if (!reviewLoading) closeReview();
          }}
        >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Document Review"
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-[#123B5D] dark:text-blue-300">
                  <FileCheck2 size={18} />
                  Document Review
                </div>

                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {selectedDocument.document_name ||
                    'Applicant Document'}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Review the submitted document and update its
                  verification status.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReview}
                disabled={reviewLoading}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="space-y-6 p-5 sm:p-6"
            >
              {/* Applicant Information */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <div className="mb-3 flex items-center gap-2">
                  <User
                    size={18}
                    className="text-[#123B5D] dark:text-blue-300"
                  />

                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Applicant Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      Applicant
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {getApplicantName(selectedDocument)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {getApplicantEmail(selectedDocument)}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      Program
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {getProgramName(selectedDocument)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Document */}
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-950/50 dark:text-blue-300">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedDocument.document_name ||
                          'Uploaded Document'}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Submitted{' '}
                        {formatDate(selectedDocument.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDocument(selectedDocument)}
                    disabled={!selectedDocument?.file_path}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Eye size={16} />
                    View File
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="mb-3">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">
                    Document Status
                  </label>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the current verification stage of this
                    document.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Pending */}
                  <button
                    type="button"
                    onClick={() => setReviewStatus('pending')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      reviewStatus === 'pending'
                        ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400/20 dark:border-yellow-500 dark:bg-yellow-950/30'
                        : 'border-gray-200 bg-white hover:border-yellow-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-yellow-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-300">
                        <Clock size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Pending
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Needs review
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Under Review */}
                  <button
                    type="button"
                    onClick={() => setReviewStatus('under_review')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      reviewStatus === 'under_review'
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-400/20 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                        <ShieldCheck size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Under Review
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Currently being checked
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Verified */}
                  <button
                    type="button"
                    onClick={() => setReviewStatus('verified')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      reviewStatus === 'verified'
                        ? 'border-green-400 bg-green-50 ring-2 ring-green-400/20 dark:border-green-500 dark:bg-green-950/30'
                        : 'border-gray-200 bg-white hover:border-green-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-green-100 p-2 text-green-600 dark:bg-green-950/50 dark:text-green-300">
                        <CheckCircle size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Verified
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Document accepted
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Rejected */}
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`rounded-2xl border p-4 text-left transition ${
                      reviewStatus === 'rejected'
                        ? 'border-red-400 bg-red-50 ring-2 ring-red-400/20 dark:border-red-500 dark:bg-red-950/30'
                        : 'border-gray-200 bg-white hover:border-red-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-red-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-red-100 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-300">
                        <XCircle size={19} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Rejected
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Document needs correction
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label
                  htmlFor="reviewRemarks"
                  className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Review Remarks
                </label>

                <textarea
                  id="reviewRemarks"
                  value={reviewRemarks}
                  onChange={(event) =>
                    setReviewRemarks(event.target.value)
                  }
                  rows={4}
                  placeholder="Enter remarks, verification notes, or correction instructions..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#123B5D] focus:ring-2 focus:ring-[#123B5D]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReview}
                  disabled={reviewLoading}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123B5D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f314d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewLoading ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={17} />
                      Save Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>                        
        </div>
        </ModalPortal>
      )}
    </div>
  );
}

const DocumentsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <Documents confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default DocumentsWrapper;
