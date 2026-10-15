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
  GraduationCap,
  Award,
  ClipboardList,
  Pencil,
  Save,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  FileCheck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SkeletonBox = ({ className = '' }) => (
  <div
    className={`ep-skeleton rounded-xl ${className}`}
  />
);

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
  iconBg,
  progressClass,
}) => (
  <div className="ep-card ep-hover-lift animate-fade-up rounded-2xl p-5 relative overflow-hidden">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </p>

        <p className="text-3xl font-extrabold text-[#123B5D] dark:text-white mt-2">
          {value}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>

      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <Icon size={21} className={iconClass} />
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-800">
      <div
        className={`h-full w-2/3 bg-gradient-to-r ${progressClass}`}
      />
    </div>
  </div>
);

const ApplicantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [applicant, setApplicant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    phone: '',
    address: '',
  });

  const loadApplicant = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      if (isRefresh) {
        setRefreshing(true);
      }

      setError('');

      const response = await api.get(
        `/admin/applicants/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      const applicantData = data.data || data;

      setApplicant(applicantData);

      setFormData({
        first_name: applicantData.first_name || '',
        middle_name: applicantData.middle_name || '',
        last_name: applicantData.last_name || '',
        birth_date: applicantData.birth_date
          ? applicantData.birth_date.substring(0, 10)
          : '',
        gender: applicantData.gender || '',
        phone: applicantData.phone || '',
        address: applicantData.address || '',
      });
    } catch (err) {
      console.error(
        'Failed to load applicant:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load applicant details.'
      );
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }

      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!token || !id) {
      return;
    }

    loadApplicant();
  }, [token, id]);

  const formatName = () => {
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

  const getInitials = () => {
    const name = formatName();

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

  const formatDate = (date) => {
    if (!date) {
      return 'Not provided';
    }

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = () => {
    setSaveError('');
    setSaveSuccess('');

    setFormData({
      first_name: applicant.first_name || '',
      middle_name: applicant.middle_name || '',
      last_name: applicant.last_name || '',
      birth_date: applicant.birth_date
        ? applicant.birth_date.substring(0, 10)
        : '',
      gender: applicant.gender || '',
      phone: applicant.phone || '',
      address: applicant.address || '',
    });

    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await api.put(
        `/admin/applicants/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      const updatedApplicant =
        data.data || data;

      setApplicant(updatedApplicant);

      setFormData({
        first_name:
          updatedApplicant.first_name || '',
        middle_name:
          updatedApplicant.middle_name || '',
        last_name:
          updatedApplicant.last_name || '',
        birth_date:
          updatedApplicant.birth_date
            ? updatedApplicant.birth_date.substring(
                0,
                10
              )
            : '',
        gender:
          updatedApplicant.gender || '',
        phone:
          updatedApplicant.phone || '',
        address:
          updatedApplicant.address || '',
      });

      setSaveSuccess(
        'Applicant information updated successfully.'
      );

      setIsEditing(false);
    } catch (err) {
      console.error(
        'Failed to update applicant:',
        err
      );

      if (err.response?.data?.errors) {
        const errors =
          err.response.data.errors;

        const firstError =
          Object.values(errors)[0];

        setSaveError(
          Array.isArray(firstError)
            ? firstError[0]
            : 'Please check the information provided.'
        );
      } else {
        setSaveError(
          err.response?.data?.message ||
            'Failed to update applicant information.'
        );
      }
    } finally {
      setSaving(false);
    }
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
          label: 'Pending',
          className:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
          icon: Clock,
        };
    }
  };

  const admissionApplications =
    applicant?.admission_applications || [];

  const scholarshipApplications =
    applicant?.scholarship_applications || [];

  const examAssignments =
    applicant?.exam_assignments || [];

  const totalApplications =
    admissionApplications.length;

  const approvedApplications =
    admissionApplications.filter(
      (application) =>
        application.status === 'approved'
    ).length;

  const pendingApplications =
    admissionApplications.filter(
      (application) =>
        !application.status ||
        application.status === 'pending'
    ).length;

  const scholarshipCount =
    scholarshipApplications.length;

  if (loading) {
    return (
      <div className="space-y-6 pb-8 page-transition">

        {/* Hero Skeleton */}
        <div className="relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <SkeletonBox className="w-16 h-16 rounded-2xl bg-white/10" />

                <div className="space-y-3">
                  <SkeletonBox className="w-32 h-3 bg-white/10" />
                  <SkeletonBox className="w-64 h-7 bg-white/10" />
                  <SkeletonBox className="w-32 h-3 bg-white/10" />
                </div>
              </div>

              <SkeletonBox className="w-36 h-11 rounded-xl bg-white/10" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="ep-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <SkeletonBox className="w-24 h-3" />
                  <SkeletonBox className="w-14 h-8" />
                  <SkeletonBox className="w-28 h-3" />
                </div>

                <SkeletonBox className="w-11 h-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Content Skeletons */}
        {[1, 2, 3].map((section) => (
          <div
            key={section}
            className="ep-card rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <SkeletonBox className="w-10 h-10 rounded-xl" />

                <div className="space-y-2">
                  <SkeletonBox className="w-40 h-4" />
                  <SkeletonBox className="w-56 h-3" />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <SkeletonBox className="w-full h-20 rounded-xl" />
              <SkeletonBox className="w-full h-20 rounded-xl" />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-center gap-3 py-4 text-gray-500 dark:text-gray-400">
          <Loader2
            size={20}
            className="animate-spin text-[#123B5D] dark:text-blue-400"
          />

          <span className="text-sm font-semibold">
            Loading applicant details...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 page-transition">

        <button
          type="button"
          onClick={() =>
            navigate('/admin/applicants')
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] dark:text-blue-400 hover:text-[#0F3553] dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft size={17} />
          Back to Applicants
        </button>

        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertCircle
                size={21}
                className="text-red-600 dark:text-red-400"
              />
            </div>

            <div>
              <h2 className="font-bold text-red-800 dark:text-red-300">
                Unable to load applicant
              </h2>

              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadApplicant(true)
                }
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="space-y-6 page-transition">

        <button
          type="button"
          onClick={() =>
            navigate('/admin/applicants')
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#123B5D] dark:text-blue-400 hover:text-[#0F3553] dark:hover:text-blue-300"
        >
          <ArrowLeft size={17} />
          Back to Applicants
        </button>

        <div className="ep-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center animate-float">
            <User
              size={30}
              className="text-gray-400 dark:text-gray-500"
            />
          </div>

          <h2 className="text-xl font-bold text-[#123B5D] dark:text-white">
            Applicant Not Found
          </h2>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            The requested applicant could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 page-transition">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg">

        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative p-6 sm:p-8">

          <div className="mb-5">
            <button
              type="button"
              onClick={() =>
                navigate('/admin/applicants')
              }
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft size={17} />
              Back to Applicants
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-center gap-4">

              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-xl">
                {getInitials()}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-bold mb-3">
                  <ShieldCheck size={14} />
                  Applicant Profile
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {formatName()}
                </h1>

                <p className="text-blue-100 text-sm mt-1">
                  Applicant #{applicant.id}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  loadApplicant(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />
                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4B400] hover:bg-[#D9A900] text-[#123B5D] font-bold text-sm transition-colors shadow-sm"
                >
                  <Pencil size={16} />
                  Edit Applicant
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Success */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <CheckCircle
              size={20}
              className="text-green-600 dark:text-green-400 shrink-0"
            />

            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              {saveSuccess}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <StatCard
          title="Admission Applications"
          value={totalApplications}
          description="Applications submitted"
          icon={GraduationCap}
          iconClass="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          progressClass="from-blue-500 to-cyan-400"
        />

        <StatCard
          title="Pending Applications"
          value={pendingApplications}
          description="Awaiting review"
          icon={Clock}
          iconClass="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          progressClass="from-amber-500 to-yellow-400"
        />

        <StatCard
          title="Approved"
          value={approvedApplications}
          description="Approved applications"
          icon={CheckCircle}
          iconClass="text-green-600 dark:text-green-400"
          iconBg="bg-green-50 dark:bg-green-500/10"
          progressClass="from-green-500 to-emerald-400"
        />

        <StatCard
          title="Scholarships"
          value={scholarshipCount}
          description="Scholarship applications"
          icon={Award}
          iconClass="text-purple-600 dark:text-purple-400"
          iconBg="bg-purple-50 dark:bg-purple-500/10"
          progressClass="from-purple-500 to-pink-400"
        />

      </div>

      {/* Edit Applicant */}
      {isEditing && (
        <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

          <div className="ep-brand-gradient px-6 py-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <Pencil
                  size={19}
                  className="text-white"
                />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Edit Applicant
                </h2>

                <p className="text-xs text-blue-100 mt-0.5">
                  Update the applicant's personal information.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">

            {saveError && (
              <div className="mb-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={19}
                    className="text-red-600 dark:text-red-400 mt-0.5 shrink-0"
                  />

                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {saveError}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSave}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {[
                  {
                    name: 'first_name',
                    label: 'First Name',
                    required: true,
                  },
                  {
                    name: 'middle_name',
                    label: 'Middle Name',
                  },
                  {
                    name: 'last_name',
                    label: 'Last Name',
                    required: true,
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      {field.label}
                    </label>

                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Birth Date
                  </label>

                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition-colors"
                  >
                    <option value="">
                      Select Gender
                    </option>
                    <option value="male">
                      Male
                    </option>
                    <option value="female">
                      Female
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter complete address"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-400/20 focus:border-[#123B5D] dark:focus:border-blue-400 transition-colors resize-none"
                  />
                </div>

              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        <SectionHeader
          icon={User}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconClass="text-[#123B5D] dark:text-blue-400"
          title="Personal Information"
          description="Applicant's personal details"
        />

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <InfoTile
              label="First Name"
              value={
                applicant.first_name ||
                'Not provided'
              }
            />

            <InfoTile
              label="Middle Name"
              value={
                applicant.middle_name ||
                'Not provided'
              }
            />

            <InfoTile
              label="Last Name"
              value={
                applicant.last_name ||
                'Not provided'
              }
            />

            <InfoTile
              label="Birth Date"
              value={formatDate(
                applicant.birth_date
              )}
              icon={Calendar}
            />

            <InfoTile
              label="Gender"
              value={
                applicant.gender ||
                'Not provided'
              }
              icon={User}
              capitalize
            />

            <InfoTile
              label="Phone"
              value={
                applicant.phone ||
                'Not provided'
              }
              icon={Phone}
            />

            <InfoTile
              label="Address"
              value={
                applicant.address ||
                'Not provided'
              }
              icon={MapPin}
              wide
            />

          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        <SectionHeader
          icon={Mail}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconClass="text-[#C99A00] dark:text-amber-400"
          title="Account Information"
          description="Applicant account details"
        />

        <div className="p-6">
          <InfoTile
            label="Email Address"
            value={
              applicant.user?.email ||
              'Not provided'
            }
            icon={Mail}
            wide
          />
        </div>
      </div>

      {/* Admission Applications */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        <SectionHeader
          icon={GraduationCap}
          iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconClass="text-[#123B5D] dark:text-blue-400"
          title="Admission Applications"
          description="Admission applications submitted by this applicant"
        />

        <div className="p-6">

          {admissionApplications.length === 0 ? (
            <EmptySection
              icon={GraduationCap}
              title="No admission applications found"
              description="This applicant has not submitted an admission application yet."
            />
          ) : (
            <div className="space-y-3">
              {admissionApplications.map(
                (application) => {
                  const statusConfig =
                    getStatusConfig(
                      application.status
                    );

                  const StatusIcon =
                    statusConfig.icon;

                  return (
                    <div
                      key={application.id}
                      className="ep-card ep-hover-lift rounded-xl p-4 border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div className="flex items-start gap-3">

                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                            <FileText
                              size={18}
                              className="text-[#123B5D] dark:text-blue-400"
                            />
                          </div>

                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">
                              {application.academic_program?.name ||
                                'Academic Program'}
                            </p>

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Application #
                              {application.id}
                            </p>

                            {application.academic_program?.code && (
                              <span className="inline-flex mt-2 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-[#A87C00] dark:text-amber-400 text-xs font-bold">
                                {
                                  application
                                    .academic_program
                                    .code
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full border text-xs font-bold ${statusConfig.className}`}
                        >
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>

                      </div>

                      {application.documents && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400">
                          <FileCheck size={14} />

                          Documents submitted:

                          <span className="font-bold text-gray-700 dark:text-gray-200">
                            {application.documents.length}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scholarship Applications */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        <SectionHeader
          icon={Award}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconClass="text-[#C99A00] dark:text-amber-400"
          title="Scholarship Applications"
          description="Scholarships applied for by this applicant"
        />

        <div className="p-6">

          {scholarshipApplications.length === 0 ? (
            <EmptySection
              icon={Award}
              title="No scholarship applications found"
              description="This applicant has not applied for a scholarship yet."
            />
          ) : (
            <div className="space-y-3">
              {scholarshipApplications.map(
                (application) => {
                  const statusConfig =
                    getStatusConfig(
                      application.status
                    );

                  const StatusIcon =
                    statusConfig.icon;

                  return (
                    <div
                      key={application.id}
                      className="ep-card ep-hover-lift rounded-xl p-4 border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div className="flex items-start gap-3">

                          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Award
                              size={18}
                              className="text-[#C99A00] dark:text-amber-400"
                            />
                          </div>

                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">
                              {application.scholarship?.name ||
                                'Scholarship'}
                            </p>

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Application #
                              {application.id}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full border text-xs font-bold ${statusConfig.className}`}
                        >
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entrance Exams */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        <SectionHeader
          icon={ClipboardList}
          iconBg="bg-purple-50 dark:bg-purple-500/10"
          iconClass="text-purple-600 dark:text-purple-400"
          title="Entrance Exams"
          description="Entrance exam assignments for this applicant"
        />

        <div className="p-6">

          {examAssignments.length === 0 ? (
            <EmptySection
              icon={ClipboardList}
              title="No entrance exam assignments found"
              description="No entrance exam has been assigned to this applicant."
            />
          ) : (
            <div className="space-y-3">
              {examAssignments.map(
                (assignment) => {
                  const statusConfig =
                    getStatusConfig(
                      assignment.status
                    );

                  const StatusIcon =
                    statusConfig.icon;

                  return (
                    <div
                      key={assignment.id}
                      className="ep-card ep-hover-lift rounded-xl p-4 border border-gray-100 dark:border-slate-700"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div className="flex items-start gap-3">

                          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                            <ClipboardList
                              size={18}
                              className="text-purple-600 dark:text-purple-400"
                            />
                          </div>

                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">
                              {assignment.entrance_exam?.title ||
                                assignment.entrance_exam?.name ||
                                'Entrance Exam'}
                            </p>

                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Assignment #
                              {assignment.id}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full border text-xs font-bold ${statusConfig.className}`}
                        >
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>

                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const SectionHeader = ({
  icon: Icon,
  iconBg,
  iconClass,
  title,
  description,
}) => (
  <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800/40">
    <div className="flex items-center gap-3">

      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <Icon
          size={19}
          className={iconClass}
        />
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

const InfoTile = ({
  label,
  value,
  icon: Icon,
  wide = false,
  capitalize = false,
}) => (
  <div
    className={`${
      wide ? 'md:col-span-2' : ''
    } rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/50 p-4`}
  >
    <div className="flex items-start gap-3">

      {Icon && (
        <Icon
          size={17}
          className="text-[#123B5D] dark:text-blue-400 mt-0.5 shrink-0"
        />
      )}

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>

        <p
          className={`text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 ${
            capitalize ? 'capitalize' : ''
          } break-words`}
        >
          {value}
        </p>
      </div>

    </div>
  </div>
);

const EmptySection = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="text-center py-8">

    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center animate-float">
      <Icon
        size={24}
        className="text-gray-400 dark:text-gray-500"
      />
    </div>

    <p className="font-bold text-gray-700 dark:text-gray-200">
      {title}
    </p>

    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
      {description}
    </p>

  </div>
);

export default ApplicantDetails;