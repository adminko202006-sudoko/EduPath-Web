import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ClipboardList,
  ShieldCheck,
  Send,
  X,
  GraduationCap,
  ExternalLink,
  Loader2,
} from 'lucide-react';

import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdmissionApplicationDetails = ({ confirm }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [remarks, setRemarks] = useState('');

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `/admin/admission-applications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      setApplication(data.data || data);
    } catch (err) {
      console.error(
        'Failed to load admission application:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load admission application details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !id) {
      return;
    }

    loadApplication();
  }, [token, id]);

  const formatName = (applicant) => {
    if (!applicant) {
      return 'Applicant';
    }

    return [
      applicant.first_name,
      applicant.middle_name,
      applicant.last_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Applicant';
  };

  const getInitials = (applicant) => {
    const name = formatName(applicant);
    const parts = name.split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) {
      return 'Not provided';
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          className:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
          icon: CheckCircle,
        };

      case 'rejected':
        return {
          label: 'Rejected',
          className:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
          icon: XCircle,
        };

      case 'pending':
      default:
        return {
          label: 'Pending Review',
          className:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
          icon: Clock,
        };
    }
  };

  const handleApprove = async () => {
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
      setActionLoading(true);
      setError('');

      const response = await api.put(
        `/admin/admission-applications/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplication(
        response.data.data || response.data
      );

      alert(
        'Admission application approved successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to approve application:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to approve admission application.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();

    const confirmed = await confirm({
      title: 'Reject Application',
      message: 'Are you sure you want to reject this admission application?',
      confirmLabel: 'Reject',
    });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await api.put(
        `/admin/admission-applications/${id}/reject`,
        {
          remarks: remarks || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplication(
        response.data.data || response.data
      );

      setShowRejectForm(false);

      alert(
        'Admission application rejected successfully.'
      );
    } catch (err) {
      console.error(
        'Failed to reject application:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to reject admission application.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * Requirements.jsx-style loading skeleton
   */
  if (loading) {
    return (
      <div className="space-y-6 pb-8 page-transition">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 p-6 sm:p-8 animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-300 dark:bg-gray-700 shrink-0" />

              <div className="space-y-3">
                <div className="h-3 w-36 rounded bg-gray-300 dark:bg-gray-700" />
                <div className="h-8 w-64 rounded-lg bg-gray-300 dark:bg-gray-700" />
                <div className="h-4 w-80 max-w-full rounded bg-gray-300 dark:bg-gray-700" />
              </div>
            </div>

            <div className="h-11 w-36 rounded-xl bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>

        {/* Applicant Information Skeleton */}
        <div className="ep-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-56 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-7 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-3">
                <div className="h-6 w-52 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className={`rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 ${
                    item === 5 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
                  <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Application Information Skeleton */}
        <div className="ep-card rounded-2xl overflow-hidden animate-pulse">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-60 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-gray-100 dark:border-gray-700 p-5"
                >
                  <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
                  <div className="h-5 w-44 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Skeleton */}
        <div className="ep-card rounded-2xl overflow-hidden animate-pulse">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />

              <div className="space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-64 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2
            size={28}
            className="text-[#123B5D] dark:text-blue-400 animate-spin mb-3"
          />

          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Loading admission application...
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="space-y-6 page-transition">
        <button
          type="button"
          onClick={() =>
            navigate('/admin/admission-applications')
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] dark:text-blue-400 hover:text-[#0F3553] dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={17} />
          Back to Admission Applications
        </button>

        <div className="ep-card rounded-2xl border border-red-200 dark:border-red-500/20 p-6 animate-fade-up">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertCircle
                size={21}
                className="text-red-600 dark:text-red-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-red-800 dark:text-red-300">
                Unable to load application
              </h2>

              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6 page-transition">
        <button
          type="button"
          onClick={() =>
            navigate('/admin/admission-applications')
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] dark:text-blue-400 hover:text-[#0F3553] dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={17} />
          Back to Admission Applications
        </button>

        <div className="ep-card rounded-2xl p-12 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-float">
            <FileText
              size={30}
              className="text-gray-400"
            />
          </div>

          <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
            Application Not Found
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            The requested admission application could not
            be found.
          </p>
        </div>
      </div>
    );
  }

  const applicant = application.applicant;

  const statusConfig = getStatusConfig(
    application.status
  );

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 pb-8 page-transition">

      {/* Back Button */}
      <button
        type="button"
        onClick={() =>
          navigate('/admin/admission-applications')
        }
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] dark:text-blue-400 hover:text-[#0F3553] dark:hover:text-blue-300 transition-colors"
      >
        <ArrowLeft size={17} />
        Back to Admission Applications
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 animate-fade-up">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-red-600 dark:text-red-400 mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                Action could not be completed
              </p>

              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg animate-fade-up">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-12 w-52 h-52 rounded-full bg-white/5" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <ClipboardList
                  size={28}
                  className="text-white"
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs font-semibold mb-2">
                  <ShieldCheck size={13} />
                  Admission Review
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Application #{application.id}
                </h1>

                <p className="text-blue-100 text-sm mt-1">
                  Review applicant information and submitted
                  admission documents.
                </p>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 w-fit px-4 py-2.5 rounded-xl border ${statusConfig.className}`}
            >
              <StatusIcon size={17} />

              <span className="font-bold">
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="relative px-6 lg:px-8 py-3.5 bg-black/10 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Calendar size={15} />
              Submitted {formatDate(application.submitted_at)}
            </div>

            <div className="flex items-center gap-2">
              <GraduationCap size={15} />
              {application.academic_program?.code ||
                'Program pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Applicant Information */}
      <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">
        <SectionHeader
          icon={User}
          iconClass="bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-500/10 dark:text-blue-400"
          title="Applicant Information"
          description="Personal information of the applicant"
        />

        <div className="p-6">

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-7 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#123B5D] to-[#0F766E] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
              {getInitials(applicant)}
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {formatName(applicant)}
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Applicant #{applicant?.id || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <InfoCard
              icon={Mail}
              label="Email Address"
              value={
                applicant?.user?.email ||
                'Not provided'
              }
              breakAll
            />

            <InfoCard
              icon={Phone}
              label="Phone"
              value={
                applicant?.phone ||
                'Not provided'
              }
            />

            <InfoCard
              icon={User}
              label="Gender"
              value={
                applicant?.gender ||
                'Not provided'
              }
              capitalize
            />

            <InfoCard
              icon={Calendar}
              label="Birth Date"
              value={formatDate(
                applicant?.birth_date
              )}
            />

            <InfoCard
              icon={MapPin}
              label="Address"
              value={
                applicant?.address ||
                'Not provided'
              }
              wide
            />

          </div>
        </div>
      </div>

      {/* Application Information */}
      <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">
        <SectionHeader
          icon={FileText}
          iconClass="bg-[#F4B400]/10 text-[#C99A00] dark:bg-yellow-500/10 dark:text-yellow-400"
          title="Application Information"
          description="Details about the admission application"
        />

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-[#123B5D]/20 dark:hover:border-blue-400/20 transition-colors">
              <div className="flex items-start gap-3">
                <GraduationCap
                  size={19}
                  className="text-[#123B5D] dark:text-blue-400 mt-0.5 shrink-0"
                />

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Academic Program
                  </p>

                  <p className="text-sm font-bold text-gray-800 dark:text-white mt-2">
                    {application.academic_program?.name ||
                      'Program not specified'}
                  </p>

                  {application.academic_program?.code && (
                    <span className="inline-flex mt-2 px-2.5 py-1 rounded-lg bg-[#F4B400]/10 text-[#A87C00] dark:bg-yellow-500/10 dark:text-yellow-400 text-xs font-bold">
                      {application.academic_program.code}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-[#123B5D]/20 dark:hover:border-blue-400/20 transition-colors">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Application Status
              </p>

              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold ${statusConfig.className}`}
                >
                  <StatusIcon size={15} />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <DateInfoCard
              label="Submitted Date"
              date={application.submitted_at}
            />

            <DateInfoCard
              label="Application Created"
              date={application.created_at}
            />

          </div>

          {application.remarks && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Remarks
              </p>

              <div className="mt-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {application.remarks}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">
        <SectionHeader
          icon={FileText}
          iconClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
          title="Submitted Documents"
          description="Documents submitted with this application"
        />

        <div className="p-6">
          {!application.documents ||
          application.documents.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-float">
                <FileText
                  size={24}
                  className="text-gray-400"
                />
              </div>

              <p className="font-semibold text-gray-600 dark:text-gray-300">
                No documents submitted
              </p>

              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                No documents are currently attached to
                this application.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {application.documents.map(
                (document) => (
                  <div
                    key={document.id}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#123B5D]/20 dark:hover:border-blue-400/20 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText
                          size={18}
                          className="text-[#123B5D] dark:text-blue-400"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">
                          {document.document_name ||
                            document.name ||
                            'Document'}
                        </p>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Document #{document.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold">
                        <CheckCircle size={13} />
                        Submitted
                      </span>

                      {document.file_path && (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `http://127.0.0.1:8000/storage/${document.file_path}`,
                              '_blank'
                            )
                          }
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#123B5D]/10 dark:bg-blue-500/10 text-[#123B5D] dark:text-blue-400 hover:bg-[#123B5D] dark:hover:bg-blue-600 hover:text-white transition-colors"
                          title="View document"
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Application Decision */}
      {application.status === 'pending' && (
        <div className="ep-card rounded-2xl overflow-hidden animate-fade-up">

          <SectionHeader
            icon={ShieldCheck}
            iconClass="bg-[#123B5D]/10 text-[#123B5D] dark:bg-blue-500/10 dark:text-blue-400"
            title="Application Decision"
            description="Review this application and make a decision"
          />

          <div className="p-6">

            {!showRejectForm ? (
              <div>
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <Clock
                      size={18}
                      className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
                    />

                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Application awaiting review
                      </p>

                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        Review the applicant information and
                        submitted documents before making a
                        final decision.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-900/50 text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <CheckCircle size={18} />

                    {actionLoading
                      ? 'Processing...'
                      : 'Approve Application'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowRejectForm(true)
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/50 text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <XCircle size={18} />
                    Reject Application
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReject}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      Reject Application
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Provide a reason for the rejection.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRemarks('');
                    }}
                    disabled={actionLoading}
                    className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <textarea
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  rows="5"
                  maxLength="1000"
                  placeholder="Enter the reason for rejecting this application..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
                />

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    Maximum 1000 characters.
                  </p>

                  <p className="text-xs text-gray-400">
                    {remarks.length}/1000
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/50 text-white font-semibold text-sm transition-colors"
                  >
                    <Send size={17} />

                    {actionLoading
                      ? 'Processing...'
                      : 'Confirm Rejection'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRemarks('');
                    }}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm transition-colors"
                  >
                    <X size={17} />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Reusable UI Helpers                                                        */
/* -------------------------------------------------------------------------- */

const SectionHeader = ({
  icon: Icon,
  iconClass,
  title,
  description,
}) => {
  return (
    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/30">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}
        >
          <Icon size={19} />
        </div>

        <div>
          <h2 className="font-bold text-[#123B5D] dark:text-white">
            {title}
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({
  icon: Icon,
  label,
  value,
  wide = false,
  breakAll = false,
  capitalize = false,
}) => {
  return (
    <div
      className={`rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4 hover:border-[#123B5D]/20 dark:hover:border-blue-400/20 transition-colors ${
        wide ? 'md:col-span-2' : ''
      }`}
    >
      <div className="flex gap-3">
        <Icon
          size={18}
          className="text-[#123B5D] dark:text-blue-400 mt-0.5 shrink-0"
        />

        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {label}
          </p>

          <p
            className={`text-sm font-medium text-gray-800 dark:text-gray-200 mt-1 ${
              breakAll ? 'break-all' : ''
            } ${capitalize ? 'capitalize' : ''}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

const DateInfoCard = ({ label, date }) => {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:border-[#123B5D]/20 dark:hover:border-blue-400/20 transition-colors">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <div className="flex items-center gap-2 mt-3">
        <Calendar
          size={17}
          className="text-gray-400"
        />

        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {date
            ? new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Not provided'}
        </p>
      </div>
    </div>
  );
};

const AdmissionApplicationDetailsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <AdmissionApplicationDetails confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default AdmissionApplicationDetailsWrapper;