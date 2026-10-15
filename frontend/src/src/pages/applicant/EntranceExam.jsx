import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  CalendarDays,
  Clock3,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Award,
  Info,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EntranceExam = () => {
  const { token } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // LOAD ASSIGNED ENTRANCE EXAMS
  // ==========================================

  const loadExams = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        '/applicant/exams',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      setExams(
        Array.isArray(data)
          ? data
          : data.data || []
      );
    } catch (err) {
      console.error(
        'Failed to load entrance exams:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load entrance examination information.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    if (!token) {
      return;
    }

    loadExams();
  }, [token]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return 'Not scheduled';
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
  // FORMAT TIME
  // ==========================================

  const formatTime = (time) => {
    if (!time) {
      return 'Not scheduled';
    }

    const [hours, minutes] = time.split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  };

  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          className:
            'bg-blue-50 text-blue-700 border-blue-200',
          icon: ClipboardCheck,
          iconClass: 'text-blue-600',
        };

      case 'completed':
        return {
          label: 'Completed',
          className:
            'bg-green-50 text-green-700 border-green-200',
          icon: CheckCircle2,
          iconClass: 'text-green-600',
        };

      case 'cancelled':
        return {
          label: 'Cancelled',
          className:
            'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          iconClass: 'text-red-600',
        };

      case 'pending':
        return {
          label: 'Pending',
          className:
            'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock3,
          iconClass: 'text-amber-600',
        };

      default:
        return {
          label: status || 'Pending',
          className:
            'bg-gray-50 text-gray-700 border-gray-200',
          icon: AlertCircle,
          iconClass: 'text-gray-500',
        };
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 rounded-full border-4 border-[#123B5D]/20 border-t-[#123B5D] animate-spin" />

          <p className="mt-5 text-gray-600 font-medium">
            Loading entrance examination information...
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">

      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center shadow-sm">
            <ClipboardCheck
              size={22}
              className="text-white"
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-[#123B5D]">
              Entrance Examination
            </h1>

            <p className="mt-1 text-gray-500">
              View your assigned entrance examination schedule and details.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={loadExams}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#123B5D] rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-[#123B5D]/30 transition-colors shadow-sm"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl">

          <AlertCircle
            size={20}
            className="mt-0.5 flex-shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load examination information
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>

        </div>
      )}

      {/* SUMMARY */}
      {exams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          {/* Total */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Assigned Exams
                </p>

                <p className="text-3xl font-bold text-[#123B5D] mt-2">
                  {exams.length}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 flex items-center justify-center">
                <FileText
                  size={21}
                  className="text-[#123B5D]"
                />
              </div>

            </div>

          </div>

          {/* Scheduled */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Scheduled
                </p>

                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {
                    exams.filter(
                      (exam) =>
                        exam.status?.toLowerCase() ===
                        'scheduled'
                    ).length
                  }
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock3
                  size={21}
                  className="text-blue-600"
                />
              </div>

            </div>

          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Completed
                </p>

                <p className="text-3xl font-bold text-green-600 mt-2">
                  {
                    exams.filter(
                      (exam) =>
                        exam.status?.toLowerCase() ===
                        'completed'
                    ).length
                  }
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2
                  size={21}
                  className="text-green-600"
                />
              </div>

            </div>

          </div>

        </div>
      )}

      {/* NO EXAMS */}
      {exams.length === 0 ? (

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">

          <div className="w-20 h-20 mx-auto rounded-2xl bg-[#123B5D]/10 flex items-center justify-center">
            <ClipboardCheck
              size={38}
              className="text-[#123B5D]"
            />
          </div>

          <h2 className="text-xl font-bold text-[#123B5D] mt-6">
            No Entrance Examination Assigned
          </h2>

          <p className="text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            You currently do not have an assigned entrance examination.
            Please check again later or wait for your admission application
            to be processed.
          </p>

        </div>

      ) : (

        /* EXAM LIST */
        <div className="space-y-6">

          {exams.map((assignment) => {

            const exam = assignment.entrance_exam;

            const status = getStatusConfig(
              assignment.status
            );

            const StatusIcon = status.icon;

            return (
              <div
                key={assignment.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >

                {/* EXAM HEADER */}
                <div className="bg-[#123B5D] px-6 py-6">

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div className="flex items-start gap-4">

                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck
                          size={24}
                          className="text-white"
                        />
                      </div>

                      <div>

                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                          {exam?.title ||
                            'Entrance Examination'}
                        </h2>

                        {exam?.description && (
                          <p className="text-sm text-white/75 mt-1.5 max-w-2xl leading-relaxed">
                            {exam.description}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* STATUS */}
                    <span
                      className={`inline-flex items-center gap-2 w-fit px-3.5 py-2 rounded-full border text-sm font-semibold ${status.className}`}
                    >
                      <StatusIcon
                        size={16}
                        className={status.iconClass}
                      />

                      {status.label}
                    </span>

                  </div>

                </div>

                {/* EXAM DETAILS */}
                <div className="p-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* DATE */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">

                      <div className="flex items-center gap-2 text-gray-500">

                        <CalendarDays size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Exam Date
                        </p>

                      </div>

                      <p className="text-base font-bold text-[#123B5D] mt-2">
                        {formatDate(
                          exam?.exam_date
                        )}
                      </p>

                    </div>

                    {/* TIME */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">

                      <div className="flex items-center gap-2 text-gray-500">

                        <Clock3 size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Exam Time
                        </p>

                      </div>

                      <p className="text-base font-bold text-[#123B5D] mt-2">
                        {formatTime(
                          exam?.start_time
                        )}
                        {' - '}
                        {formatTime(
                          exam?.end_time
                        )}
                      </p>

                    </div>

                    {/* VENUE */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">

                      <div className="flex items-center gap-2 text-gray-500">

                        <MapPin size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Venue
                        </p>

                      </div>

                      <p className="text-base font-bold text-gray-800 mt-2">
                        {exam?.venue ||
                          'Not specified'}
                      </p>

                    </div>

                    {/* ASSIGNMENT ID */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">

                      <div className="flex items-center gap-2 text-gray-500">

                        <FileText size={18} />

                        <p className="text-xs font-bold uppercase tracking-wide">
                          Exam Assignment ID
                        </p>

                      </div>

                      <p className="text-base font-bold text-[#123B5D] mt-2">
                        #{assignment.id}
                      </p>

                    </div>

                  </div>

                  {/* IMPORTANT INFORMATION */}
                  <div className="mt-6 rounded-2xl bg-[#123B5D]/5 border border-[#123B5D]/10 p-5">

                    <div className="flex items-start gap-3">

                      <div className="w-9 h-9 rounded-lg bg-[#123B5D] flex items-center justify-center flex-shrink-0">
                        <Info
                          size={18}
                          className="text-white"
                        />
                      </div>

                      <div>

                        <h3 className="font-bold text-[#123B5D]">
                          Examination Information
                        </h3>

                        <ul className="text-sm text-gray-600 mt-3 space-y-2">

                          <li className="flex items-start gap-2">
                            <span className="text-[#C99A00] font-bold">
                              •
                            </span>
                            <span>
                              Please arrive at the venue before your scheduled examination time.
                            </span>
                          </li>

                          <li className="flex items-start gap-2">
                            <span className="text-[#C99A00] font-bold">
                              •
                            </span>
                            <span>
                              Bring a valid identification document.
                            </span>
                          </li>

                          <li className="flex items-start gap-2">
                            <span className="text-[#C99A00] font-bold">
                              •
                            </span>
                            <span>
                              Follow all instructions provided by the examination personnel.
                            </span>
                          </li>

                        </ul>

                      </div>

                    </div>

                  </div>

                  {/* RESULT */}
                  {(assignment.score !== null ||
                    assignment.remarks) && (

                    <div className="mt-6 rounded-2xl border border-green-100 bg-green-50/60 p-5">

                      <div className="flex items-start gap-3">

                        <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                          <Award
                            size={18}
                            className="text-white"
                          />
                        </div>

                        <div className="flex-1">

                          <h3 className="font-bold text-green-800">
                            Examination Result
                          </h3>

                          <div className="mt-4 space-y-3">

                            {assignment.score !== null && (
                              <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-green-100 px-4 py-3">

                                <span className="text-sm text-gray-600">
                                  Score
                                </span>

                                <span className="text-lg font-bold text-green-700">
                                  {assignment.score}
                                </span>

                              </div>
                            )}

                            {assignment.remarks && (
                              <div className="bg-white rounded-xl border border-green-100 px-4 py-3">

                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                  Remarks
                                </p>

                                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                                  {assignment.remarks}
                                </p>

                              </div>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                  )}

                  {/* FOOTER */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                    <div className="flex items-center gap-2 text-sm text-gray-500">

                      <StatusIcon
                        size={16}
                        className={status.iconClass}
                      />

                      <span>
                        Status:{' '}
                        <span className="font-semibold text-gray-700">
                          {status.label}
                        </span>
                      </span>

                    </div>

                    <span className="text-xs text-gray-400">
                      EduPath • Trinidad Municipal College
                    </span>

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};

export default EntranceExam;

