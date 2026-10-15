import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

import {
  FileText,
  GraduationCap,
  CheckCircle2,
  Clock3,
  XCircle,
  Send,
  Info,
  CalendarDays,
  BookOpen,
} from 'lucide-react';

const AdmissionApplication = () => {
  const { token } = useAuth();

  const [programs, setPrograms] = useState([]);
  const [application, setApplication] = useState(null);
  const [currentAdmissionPeriod, setCurrentAdmissionPeriod] = useState(null);

  const [academicProgramId, setAcademicProgramId] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ==========================================
  // LOAD ADMISSION APPLICATION
  // ==========================================

  const loadApplication = async () => {
    try {
      const response = await api.get('/applicant/admissions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const applications = Array.isArray(data)
        ? data
        : data.data || [];

      if (applications.length > 0) {
        setApplication(applications[0]);
      } else {
        setApplication(null);
      }
    } catch (err) {
      console.error(
        'Failed to load admission application:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load admission application.'
      );
    }
  };

  // ==========================================
  // LOAD PROGRAMS
  // ==========================================

  const loadPrograms = async () => {
    try {
      const response = await api.get('/applicant/programs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setPrograms(
        Array.isArray(data)
          ? data
          : data.data || []
      );
    } catch (err) {
      console.error(
        'Failed to load programs:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load academic programs.'
      );
    }
  };

  // ==========================================
  // LOAD CURRENT ADMISSION PERIOD
  // ==========================================

  const loadCurrentAdmissionPeriod = async () => {
    try {
      setPeriodLoading(true);

      const response = await api.get(
        '/applicant/admission-period',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setCurrentAdmissionPeriod(
          response.data.data || null
        );
      } else {
        setCurrentAdmissionPeriod(null);
      }
    } catch (err) {
      console.error(
        'Failed to load current admission period:',
        err
      );

      setCurrentAdmissionPeriod(null);
    } finally {
      setPeriodLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const loadPage = async () => {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setPeriodLoading(true);
        setError('');

        await Promise.all([
          loadApplication(),
          loadPrograms(),
          loadCurrentAdmissionPeriod(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [token]);

  // ==========================================
  // SUBMIT ADMISSION APPLICATION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError('');
    setMessage('');

    // Frontend protection
    if (!currentAdmissionPeriod) {
      setError(
        'There is currently no open admission period. Please check again later.'
      );
      setSubmitting(false);
      return;
    }

    if (!academicProgramId) {
      setError(
        'Please select your preferred academic program.'
      );
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post(
        '/applicant/admissions',
        {
          academic_program_id: academicProgramId,
          remarks: remarks || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newApplication =
        response.data.data ||
        response.data.application ||
        response.data;

      setApplication(newApplication);

      setMessage(
        response.data.message ||
          'Admission application submitted successfully.'
      );

      setAcademicProgramId('');
      setRemarks('');
    } catch (err) {
      console.error(
        'Admission submission failed:',
        err
      );

      if (err.response?.data?.errors) {
        const validationErrors = Object.values(
          err.response.data.errors
        ).flat();

        setError(validationErrors.join(' '));
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to submit admission application.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return 'Not available';
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

  // ==========================================
  // GET PROGRAM NAME
  // ==========================================

  const getProgramName = () => {
    if (!application) {
      return 'Not available';
    }

    return (
      application.academic_program?.name ||
      application.program?.name ||
      application.academicProgram?.name ||
      'Not available'
    );
  };

  // ==========================================
  // GET ADMISSION PERIOD
  // ==========================================

  const admissionPeriod =
    application?.admission_period ||
    application?.admissionPeriod ||
    null;

  // ==========================================
  // STATUS CONFIGURATION
  // ==========================================

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          className: 'bg-green-100 text-green-700',
          icon: <CheckCircle2 size={15} />,
        };

      case 'rejected':
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-700',
          icon: <XCircle size={15} />,
        };

      case 'under_review':
        return {
          label: 'Under Review',
          className: 'bg-blue-100 text-blue-700',
          icon: <Clock3 size={15} />,
        };

      default:
        return {
          label: 'Pending',
          className: 'bg-amber-100 text-amber-700',
          icon: <Clock3 size={15} />,
        };
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-2">
              <div className="h-7 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 w-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-24 bg-gray-100 dark:bg-gray-700 rounded-xl"
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // EXISTING APPLICATION
  // ==========================================

  if (application) {
    const status =
      application.status || 'pending';

    const statusConfig =
      getStatusConfig(status);

    return (
      <div className="max-w-4xl mx-auto space-y-8">

        {/* HEADER */}
        <section>
          <div className="flex items-center gap-3 mb-3">

            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText
                size={22}
                className="text-[#123B5D] dark:text-blue-300"
              />
            </div>

            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#123B5D] dark:text-white">
                Admission Application
              </h1>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View the status and details of your submitted
                admission application.
              </p>
            </div>

          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">

            <CheckCircle2
              size={20}
              className="shrink-0 mt-0.5"
            />

            <p className="text-sm font-medium">
              {message}
            </p>

          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* ADMISSION PERIOD */}
        {admissionPeriod && (
          <section className="bg-gradient-to-r from-[#123B5D] to-[#1c527d] rounded-2xl shadow-sm overflow-hidden text-white">

            <div className="p-6">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-blue-100">
                    Admission Period
                  </p>

                  <h2 className="text-lg font-bold mt-1">
                    {admissionPeriod.name ||
                      'Admission Period'}
                  </h2>

                  <p className="text-sm text-blue-100 mt-1">
                    Your application belongs to this
                    admission cycle.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-xs text-blue-100">
                    Academic Year
                  </p>

                  <p className="font-bold mt-1">
                    {admissionPeriod.academic_year ||
                      'Not available'}
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-xs text-blue-100">
                    Admission Type
                  </p>

                  <p className="font-bold mt-1">
                    {admissionPeriod.admission_type ||
                      'Not available'}
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-xs text-blue-100">
                    Application Period
                  </p>

                  <p className="font-bold mt-1 text-sm">
                    {formatDate(
                      admissionPeriod.start_date
                    )}
                  </p>

                  <p className="text-xs text-blue-100 mt-0.5">
                    to{' '}
                    {formatDate(
                      admissionPeriod.end_date
                    )}
                  </p>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* APPLICATION CARD */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* CARD HEADER */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText
                size={20}
                className="text-[#123B5D] dark:text-blue-300"
              />
            </div>

            <div>
              <h2 className="font-bold text-[#123B5D] dark:text-white">
                Application Information
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Your submitted admission details
              </p>
            </div>

          </div>

          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* APPLICATION ID */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                  Application ID
                </p>

                <p className="text-lg font-bold text-[#123B5D] dark:text-white mt-2">
                  #{application.id}
                </p>

              </div>

              {/* STATUS */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                  Application Status
                </p>

                <div className="mt-2">

                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${statusConfig.className}`}
                  >
                    {statusConfig.icon}

                    {statusConfig.label}
                  </span>

                </div>

              </div>

              {/* PROGRAM */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                  Preferred Program
                </p>

                <div className="flex items-center gap-2 mt-2">

                  <GraduationCap
                    size={18}
                    className="text-[#123B5D] dark:text-blue-300"
                  />

                  <p className="font-semibold text-gray-800 dark:text-white">
                    {getProgramName()}
                  </p>

                </div>

              </div>

              {/* SUBMITTED DATE */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 p-5">

                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                  Submitted At
                </p>

                <p className="font-semibold text-gray-800 dark:text-white mt-2">
                  {formatDate(
                    application.submitted_at ||
                    application.created_at
                  )}
                </p>

              </div>

            </div>

            {/* PERIOD REFERENCE */}
            {admissionPeriod && (
              <div className="mt-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">

                <div className="flex items-start gap-3">

                  <BookOpen
                    size={19}
                    className="text-[#123B5D] dark:text-blue-300 shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="text-sm font-semibold text-[#123B5D] dark:text-blue-300">
                      Admission Cycle
                    </p>

                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This application is registered under{' '}
                      <span className="font-semibold">
                        {admissionPeriod.academic_year}
                      </span>{' '}
                      for{' '}
                      <span className="font-semibold">
                        {admissionPeriod.admission_type}
                      </span>
                      .
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* REMARKS */}
            {application.remarks && (
              <div className="mt-6">

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Remarks
                </p>

                <div className="bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 rounded-xl p-4">

                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {application.remarks}
                  </p>

                </div>

              </div>
            )}

            {/* STATUS INFORMATION */}
            <div className="mt-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">

              <Info
                size={20}
                className="text-[#123B5D] dark:text-blue-300 shrink-0 mt-0.5"
              />

              <div>

                <p className="text-sm font-semibold text-[#123B5D] dark:text-blue-300">
                  Application submitted
                </p>

                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">

                  {status === 'approved'
                    ? 'Congratulations! Your admission application has been approved.'
                    : status === 'rejected'
                    ? 'Your admission application was not approved. Please check any remarks or contact the school for more information.'
                    : status === 'under_review'
                    ? 'Your admission application is currently being reviewed. Please wait for the admission staff to complete the review.'
                    : 'Your admission application has been submitted successfully. Please wait for the admission staff to review your application.'}

                </p>

              </div>

            </div>

          </div>

        </section>

      </div>
    );
  }

  // ==========================================
  // ADMISSION APPLICATION FORM
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* HEADER */}
      <section>

        <div className="flex items-center gap-3 mb-3">

          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

            <FileText
              size={22}
              className="text-[#123B5D] dark:text-blue-300"
            />

          </div>

          <div>

            <h1 className="text-2xl lg:text-3xl font-bold text-[#123B5D] dark:text-white">
              Admission Application
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select your preferred academic program and submit
              your application.
            </p>

          </div>

        </div>

      </section>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl">

          <CheckCircle2
            size={20}
            className="shrink-0 mt-0.5"
          />

          <p className="text-sm font-medium">
            {message}
          </p>

        </div>
      )}

      {/* ADMISSION PERIOD INFORMATION */}
      <section className="bg-gradient-to-r from-[#123B5D] to-[#1c527d] rounded-2xl shadow-sm overflow-hidden text-white">

        <div className="p-6">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <CalendarDays size={20} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-blue-100">
                Current Admission Period
              </p>

              {periodLoading ? (
                <div className="mt-2 space-y-2 animate-pulse">
                  <div className="h-5 w-64 rounded bg-white/20" />
                  <div className="h-4 w-40 rounded bg-white/10" />
                </div>
              ) : currentAdmissionPeriod ? (
                <>
                  <h2 className="text-lg font-bold mt-1">
                    {currentAdmissionPeriod.name ||
                      'Admission Period'}
                  </h2>

                  <p className="text-sm text-blue-100 mt-1">
                    Current application cycle
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold mt-1">
                    No Active Admission Period
                  </h2>

                  <p className="text-sm text-blue-100 mt-1">
                    There is currently no open admission cycle.
                  </p>
                </>
              )}
            </div>

          </div>

          {periodLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 animate-pulse">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-white/10 rounded-xl p-4 h-20"
                />
              ))}

            </div>
          ) : currentAdmissionPeriod ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs text-blue-100">
                  Academic Year
                </p>

                <p className="font-bold mt-1">
                  {currentAdmissionPeriod.academic_year ||
                    'Not available'}
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs text-blue-100">
                  Admission Type
                </p>

                <p className="font-bold mt-1">
                  {currentAdmissionPeriod.admission_type ||
                    'Not available'}
                </p>
              </div>

              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs text-blue-100">
                  Application Period
                </p>

                <p className="font-bold mt-1 text-sm">
                  {formatDate(
                    currentAdmissionPeriod.start_date
                  )}
                </p>

                <p className="text-xs text-blue-100 mt-0.5">
                  to{' '}
                  {formatDate(
                    currentAdmissionPeriod.end_date
                  )}
                </p>
              </div>

            </div>
          ) : (
            <div className="mt-6 bg-white/10 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-blue-100">
                Please check again later for the next admission
                period.
              </p>
            </div>
          )}

        </div>

      </section>

      {/* APPLICATION FORM */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

        {/* FORM HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">

              <Send
                size={19}
                className="text-[#123B5D] dark:text-blue-300"
              />

            </div>

            <div>

              <h2 className="font-bold text-[#123B5D] dark:text-white">
                Application Form
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Provide your preferred academic program.
              </p>

            </div>

          </div>

        </div>

        <div className="p-6">

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ACADEMIC PROGRAM */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Preferred Academic Program
              </label>

              <select
                value={academicProgramId}
                onChange={(e) =>
                  setAcademicProgramId(e.target.value)
                }
                required
                disabled={
                  periodLoading ||
                  !currentAdmissionPeriod
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-700/50 dark:disabled:text-gray-500"
              >

                <option value="">
                  {periodLoading
                    ? 'Loading admission period...'
                    : !currentAdmissionPeriod
                    ? 'No active admission period'
                    : 'Select a program'}
                </option>

                {programs.map((program) => (
                  <option
                    key={program.id}
                    value={program.id}
                  >
                    {program.name}
                  </option>
                ))}

              </select>

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Select the academic program you would like to
                apply for.
              </p>

            </div>

            {/* REMARKS */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">

                Remarks{' '}

                <span className="text-gray-400 dark:text-gray-500 font-normal">
                  (Optional)
                </span>

              </label>

              <textarea
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value)
                }
                rows="4"
                placeholder="Enter any additional information..."
                disabled={
                  periodLoading ||
                  !currentAdmissionPeriod
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] transition disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
              />

            </div>

            {/* INFORMATION */}
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">

              <Info
                size={20}
                className="text-[#123B5D] dark:text-blue-300 shrink-0 mt-0.5"
              />

              <div>

                <p className="text-sm font-semibold text-[#123B5D] dark:text-blue-300">
                  Before you submit
                </p>

                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                  Make sure your profile information is complete
                  and accurate before submitting your admission
                  application.
                </p>

              </div>

            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end pt-2">

              <button
                type="submit"
                disabled={
                  submitting ||
                  programs.length === 0 ||
                  periodLoading ||
                  !currentAdmissionPeriod
                }
                className="inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md"
              >

                <Send size={17} />

                {submitting
                  ? 'Submitting...'
                  : !currentAdmissionPeriod && !periodLoading
                  ? 'Applications Closed'
                  : 'Submit Application'}

              </button>

            </div>

          </form>

        </div>

      </section>

    </div>
  );
};

export default AdmissionApplication;

