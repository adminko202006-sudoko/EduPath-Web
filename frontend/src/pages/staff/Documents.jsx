import { showErrorDialog } from '../../services/errorDialogs';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock3,
  FileText,
  UserRound,
  RefreshCw,
  Filter,
  GraduationCap,
  ExternalLink,
  X,
  Save,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { openPrivateDocument } from '../../services/documentFile';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { useAuth } from '../../context/useAuth';
import ModalPortal from '../../components/ui/ModalPortal';

const StaffDocuments = () => {
  const { token } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchDocuments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/staff/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocuments(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load staff documents:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load documents. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  useAutoRefresh(() => {
    fetchDocuments(true);
  });

  useEffect(() => {
    if (token) {
      queueMicrotask(() => {
        fetchDocuments();
      });
    }
  }, [token, fetchDocuments]);

  const getApplicantName = (document) => {
    const applicant =
      document?.admission_application?.applicant;

    if (!applicant) {
      return 'Unknown Applicant';
    }

    const fullName = [
      applicant.first_name,
      applicant.middle_name,
      applicant.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return (
      fullName ||
      applicant.user?.name ||
      'Unknown Applicant'
    );
  };

  const getApplicantEmail = (document) => {
    return (
      document?.admission_application?.applicant?.user
        ?.email || 'No email available'
    );
  };

  const getProgramName = (document) => {
    return (
      document?.admission_application?.academic_program
        ?.name || 'No Program'
    );
  };

  const getProgramCode = (document) => {
    return (
      document?.admission_application?.academic_program
        ?.code || ''
    );
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified',
          icon: CheckCircle2,
          className:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        };

      case 'rejected':
        return {
          label: 'Rejected',
          icon: XCircle,
          className:
            'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
        };

      case 'under_review':
        return {
          label: 'Under Review',
          icon: Eye,
          className:
            'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
        };

      case 'pending':
      default:
        return {
          label: 'Pending',
          icon: Clock3,
          className:
            'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
        };
    }
  };

  const filteredDocuments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return documents.filter((document) => {
      const applicantName =
        getApplicantName(document).toLowerCase();

      const applicantEmail =
        getApplicantEmail(document).toLowerCase();

      const documentName = (
        document.document_name || ''
      ).toLowerCase();

      const programName =
        getProgramName(document).toLowerCase();

      const programCode =
        getProgramCode(document).toLowerCase();

      const matchesSearch =
        !searchValue ||
        applicantName.includes(searchValue) ||
        applicantEmail.includes(searchValue) ||
        documentName.includes(searchValue) ||
        programName.includes(searchValue) ||
        programCode.includes(searchValue);

      const matchesStatus =
        statusFilter === 'all' ||
        document.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const totalCount = documents.length;

  const pendingCount = documents.filter(
    (document) =>
      !document.status ||
      document.status === 'pending'
  ).length;

  const underReviewCount = documents.filter(
    (document) => document.status === 'under_review'
  ).length;

  const verifiedCount = documents.filter(
    (document) => document.status === 'verified'
  ).length;

  const rejectedCount = documents.filter(
    (document) => document.status === 'rejected'
  ).length;

  const openDocument = (document) => {
    setSelectedDocument(document);
    setNewStatus(document.status || 'pending');
    setRemarks(document.remarks || '');
  };

  const closeDocument = () => {
    if (updating) {
      return;
    }

    setSelectedDocument(null);
    setNewStatus('');
    setRemarks('');
  };

  const updateDocumentStatus = async () => {
    if (!selectedDocument) {
      return;
    }

    try {
      setUpdating(true);

      const response = await api.put(
        `/staff/documents/${selectedDocument.id}`,
        {
          status: newStatus,
          remarks: remarks || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedDocument = response.data?.data;

      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === selectedDocument.id
            ? updatedDocument || {
                ...document,
                status: newStatus,
                remarks,
              }
            : document
        )
      );

      closeDocument();
    } catch (err) {
      console.error(
        'Failed to update document:',
        err
      );

      showErrorDialog(
        err.response?.data?.message ||
          'Failed to update document status.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const handleOpenFile = async (document) => {
    if (!document?.file_path) {
      return;
    }

    try {
      // Streamed through the staff endpoint so program assignments are
      // enforced server-side (the old /storage/ link had no authorization).
      await openPrivateDocument(
        `/staff/documents/${document.id}/file`
      );
    } catch {
      setError(
        'Unable to open the document right now. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-7 page-transition">
      {/* HERO */}
      <section className="ep-page-banner relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg p-6 sm:p-8 animate-fade-up">
        <div className="absolute -right-16 -top-20 w-52 h-52 rounded-full bg-white/5 animate-float" />
        <div className="absolute right-24 -bottom-24 w-44 h-44 rounded-full bg-[#F4B400]/10" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-[10px] font-bold uppercase tracking-[0.16em] mb-4">
            <ShieldCheck size={13} />
            Document Verification
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Applicant Documents
              </h1>

              <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
                Review and verify documents submitted by
                applicants assigned to your academic programs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchDocuments(true)}
              disabled={refreshing}
              className="self-start lg:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold backdrop-blur-sm transition-colors disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? 'animate-spin' : ''
                }
              />

              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Documents',
            value: totalCount,
            description: 'All submitted documents',
            icon: FileText,
            iconBg:
              'bg-blue-50 dark:bg-blue-500/10',
            iconColor:
              'text-blue-600 dark:text-blue-400',
          },
          {
            title: 'Pending',
            value: pendingCount,
            description: 'Awaiting review',
            icon: Clock3,
            iconBg:
              'bg-amber-50 dark:bg-amber-500/10',
            iconColor:
              'text-amber-600 dark:text-amber-400',
          },
          {
            title: 'Under Review',
            value: underReviewCount,
            description: 'Currently being reviewed',
            icon: Eye,
            iconBg:
              'bg-blue-50 dark:bg-blue-500/10',
            iconColor:
              'text-blue-600 dark:text-blue-400',
          },
          {
            title: 'Verified',
            value: verifiedCount,
            description: 'Successfully verified',
            icon: CheckCircle2,
            iconBg:
              'bg-emerald-50 dark:bg-emerald-500/10',
            iconColor:
              'text-emerald-600 dark:text-emerald-400',
          },
        ].map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="ep-card ep-hover-lift p-5 animate-fade-up"
              style={{
                animationDelay: `${index * 45}ms`,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {card.title}
                  </p>

                  <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                    {card.value}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {card.description}
                  </p>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
                >
                  <Icon
                    size={23}
                    className={card.iconColor}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* REJECTED SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="ep-card p-5 animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Rejected
              </p>

              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                {rejectedCount}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Documents requiring correction or resubmission
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-500/10">
              <XCircle
                size={23}
                className="text-red-600 dark:text-red-400"
              />
            </div>
          </div>
        </div>

        <div className="ep-card p-5 animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Verification Queue
              </p>

              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-2">
                {pendingCount + underReviewCount}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Documents still requiring staff action
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#0F766E]/10 dark:bg-teal-400/10">
              <ShieldCheck
                size={23}
                className="text-[#0F766E] dark:text-teal-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <ErrorMessage message={error}><div className="ep-card border-red-200 dark:border-red-900/50 p-4 flex items-start gap-3 animate-scale-in">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>

          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">
              Unable to load documents
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div></ErrorMessage>
      )}

      {/* FILTERS */}
      <section
        className="ep-card p-4 sm:p-5 animate-fade-up"
        style={{ animationDelay: '180ms' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter
            size={17}
            className="text-[#0F766E] dark:text-teal-400"
          />

          <div>
            <h2 className="font-bold text-gray-800 dark:text-gray-100">
              Search & Filter
            </h2>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Search by applicant, document, email, or academic
              program.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search applicant, document, or program..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#142738] text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-[#0F766E] dark:focus:border-teal-400 focus:ring-4 focus:ring-[#0F766E]/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="lg:w-52 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#142738] text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-[#0F766E] dark:focus:border-teal-400 focus:ring-4 focus:ring-[#0F766E]/10"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">
              Under Review
            </option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          {(search || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* DOCUMENTS */}
      <section
        className="ep-card overflow-hidden animate-fade-up"
        style={{ animationDelay: '220ms' }}
      >
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-sky-400/10 flex items-center justify-center">
              <FileText
                size={21}
                className="text-[#123B5D] dark:text-sky-300"
              />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123B5D] dark:text-sky-300">
                Submitted Documents
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredDocuments.length} document
                {filteredDocuments.length !== 1 ? 's' : ''}{' '}
                displayed
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-[#0F766E]/10 dark:bg-teal-400/10 text-[#0F766E] dark:text-teal-300 text-xs font-bold">
            <ShieldCheck size={14} />
            Verification Queue
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="p-5 sm:p-6">
            <div className="hidden md:block space-y-3">
              <div className="grid grid-cols-5 gap-4 px-5 py-3">
                {Array.from({ length: 5 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="ep-skeleton h-3 rounded"
                    />
                  )
                )}
              </div>

              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-4 items-center p-5 border border-gray-100 dark:border-gray-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="ep-skeleton w-10 h-10 rounded-xl" />

                      <div>
                        <div className="ep-skeleton h-4 w-36 mb-2" />
                        <div className="ep-skeleton h-3 w-40" />
                      </div>
                    </div>

                    <div>
                      <div className="ep-skeleton h-4 w-28 mb-2" />
                      <div className="ep-skeleton h-3 w-14" />
                    </div>

                    <div className="ep-skeleton h-4 w-32" />

                    <div className="ep-skeleton h-7 w-24 rounded-full" />

                    <div className="flex justify-end">
                      <div className="ep-skeleton h-9 w-24 rounded-lg" />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="md:hidden space-y-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="border border-gray-100 dark:border-gray-800 rounded-xl p-4"
                  >
                    <div className="flex gap-3">
                      <div className="ep-skeleton w-11 h-11 rounded-xl" />

                      <div className="flex-1">
                        <div className="ep-skeleton h-4 w-40 mb-2" />
                        <div className="ep-skeleton h-3 w-48 mb-3" />
                        <div className="ep-skeleton h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-10 sm:p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 animate-float">
              <FileText className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Documents Found
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter settings.'
                : 'Documents submitted by applicants assigned to your programs will appear here.'}
            </p>

            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 text-sm font-semibold text-[#0F766E] dark:text-teal-300 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0F3553] text-white">
                    <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider">
                      Applicant
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider">
                      Program
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider">
                      Document
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider">
                      Status
                    </th>

                    <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredDocuments.map(
                    (document, index) => {
                      const statusConfig =
                        getStatusConfig(
                          document.status
                        );

                      const StatusIcon =
                        statusConfig.icon;

                      return (
                        <tr
                          key={document.id}
                          className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.025] transition-colors duration-200 animate-fade-up"
                          style={{
                            animationDelay: `${index * 35}ms`,
                          }}
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] text-white flex items-center justify-center shadow-sm shrink-0">
                                <UserRound size={17} />
                              </div>

                              <div className="min-w-0">
                                <p className="font-bold text-gray-800 dark:text-gray-100 truncate max-w-[190px]">
                                  {getApplicantName(
                                    document
                                  )}
                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[190px] mt-1">
                                  {getApplicantEmail(
                                    document
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 dark:bg-teal-400/10 flex items-center justify-center">
                                <GraduationCap
                                  size={15}
                                  className="text-[#0F766E] dark:text-teal-300"
                                />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  {getProgramName(
                                    document
                                  )}
                                </p>

                                {getProgramCode(
                                  document
                                ) && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {getProgramCode(
                                      document
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                <FileText
                                  size={15}
                                  className="text-blue-600 dark:text-blue-400"
                                />
                              </div>

                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                                {document.document_name ||
                                  'Unnamed Document'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig.className}`}
                            >
                              <StatusIcon size={13} />
                              {statusConfig.label}
                            </span>
                          </td>

                          <td className="px-5 py-5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openDocument(document)
                              }
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#123B5D] hover:bg-[#0F3553] text-white text-xs font-bold shadow-sm hover:shadow-md transition-colors"
                            >
                              <Eye size={15} />
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {filteredDocuments.map(
                (document, index) => {
                  const statusConfig =
                    getStatusConfig(document.status);

                  const StatusIcon =
                    statusConfig.icon;

                  return (
                    <div
                      key={document.id}
                      className="p-5 animate-fade-up"
                      style={{
                        animationDelay: `${index * 40}ms`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] flex items-center justify-center text-white shadow-sm shrink-0">
                          <UserRound size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">
                            {getApplicantName(
                              document
                            )}
                          </h3>

                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {getApplicantEmail(
                              document
                            )}
                          </p>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mt-3 ${statusConfig.className}`}
                          >
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Program
                          </p>

                          <p className="text-sm font-semibold text-[#123B5D] dark:text-sky-300 mt-1">
                            {getProgramName(
                              document
                            )}
                          </p>

                          {getProgramCode(
                            document
                          ) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {getProgramCode(
                                document
                              )}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Document
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <FileText
                              size={15}
                              className="text-[#0F766E] dark:text-teal-300"
                            />

                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                              {document.document_name ||
                                'Unnamed Document'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openDocument(document)
                        }
                        className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0F3553] text-white text-sm font-bold shadow-sm"
                      >
                        <Eye size={16} />
                        Review Document
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* REVIEW MODAL */}
      {selectedDocument && (
        <ModalPortal
          onEscape={() => {
            if (!updating) closeDocument();
          }}
        >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review Document"
          tabIndex={-1}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updating
            ) {
              closeDocument();
            }
          }}
        >
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0F1F2D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 px-5 sm:px-6 py-5 bg-white dark:bg-[#0F1F2D] border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
                  <FileText
                    size={21}
                    className="text-[#123B5D] dark:text-sky-300"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    Review Document
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {selectedDocument.document_name ||
                      'Unnamed Document'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDocument}
                disabled={updating}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* APPLICANT */}
              <div className="rounded-xl bg-gray-50 dark:bg-[#142738] border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserRound
                    size={16}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Applicant
                  </p>
                </div>

                <p className="font-bold text-gray-900 dark:text-gray-100">
                  {getApplicantName(
                    selectedDocument
                  )}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getApplicantEmail(
                    selectedDocument
                  )}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <GraduationCap
                    size={15}
                    className="text-[#123B5D] dark:text-sky-300"
                  />

                  <p className="text-sm font-semibold text-[#123B5D] dark:text-sky-300">
                    {getProgramName(
                      selectedDocument
                    )}

                    {getProgramCode(
                      selectedDocument
                    )
                      ? ` (${getProgramCode(
                          selectedDocument
                        )})`
                      : ''}
                  </p>
                </div>
              </div>

              {/* DOCUMENT */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Submitted Document
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText
                      size={19}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>

                  <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {selectedDocument.document_name ||
                      'Unnamed Document'}
                  </p>
                </div>

                {selectedDocument?.file_path && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenFile(selectedDocument)
                    }
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E]/10 dark:bg-teal-400/10 text-[#0F766E] dark:text-teal-300 text-sm font-bold hover:bg-[#0F766E]/20 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Open Submitted File
                  </button>
                )}
              </div>

              {/* STATUS */}
              <div>
                <label
                  htmlFor="document-status"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Document Status
                </label>

                <select
                  id="document-status"
                  value={newStatus}
                  onChange={(event) =>
                    setNewStatus(event.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#142738] text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-[#0F766E] dark:focus:border-teal-400 focus:ring-4 focus:ring-[#0F766E]/10"
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="under_review">
                    Under Review
                  </option>

                  <option value="verified">
                    Verified
                  </option>

                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </div>

              {/* REMARKS */}
              <div>
                <label
                  htmlFor="document-remarks"
                  className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Remarks
                </label>

                <textarea
                  id="document-remarks"
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(event.target.value)
                  }
                  rows={4}
                  placeholder="Add remarks for the applicant..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#142738] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none outline-none text-sm focus:border-[#0F766E] dark:focus:border-teal-400 focus:ring-4 focus:ring-[#0F766E]/10"
                />
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-5 sm:px-6 py-5 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={closeDocument}
                disabled={updating}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateDocumentStatus}
                disabled={updating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0F3553] text-white font-bold text-sm shadow-md hover:shadow-lg transition-colors disabled:opacity-60"
              >
                {updating ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
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
};

export default StaffDocuments;
