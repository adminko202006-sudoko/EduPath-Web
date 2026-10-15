import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Pencil,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';

const StaffExams = ({ confirm }) => {
  const { token } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingExam, setEditingExam] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    capacity: '',
    is_active: true,
  });

  const loadExams = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/staff/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExams(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load staff exams:', err);

      setError(
        err.response?.data?.message ||
          'Failed to load entrance exams.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadExams();
    }
  }, [token]);

  const formatDate = (date) => {
    if (!date) {
      return 'Not available';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not available';
    }

    return parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) {
      return 'Not available';
    }

    const [hours, minutes] = time
      .substring(0, 5)
      .split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getAssignedApplicants = (exam) => {
    return exam.exam_assignments || [];
  };

  const getApplicantName = (assignment) => {
    const applicant = assignment?.applicant;

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

  const getApplicantProgram = (assignment) => {
    const applicant = assignment?.applicant;

    const admission =
      applicant?.admission_applications?.[0];

    return (
      admission?.academic_program?.code ||
      admission?.academic_program?.name ||
      'No Program'
    );
  };

  const openEdit = (exam) => {
    setEditingExam(exam);

    setForm({
      title: exam.title || '',
      description: exam.description || '',
      exam_date: exam.exam_date
        ? exam.exam_date.substring(0, 10)
        : '',
      start_time: exam.start_time
        ? exam.start_time.substring(0, 5)
        : '',
      end_time: exam.end_time
        ? exam.end_time.substring(0, 5)
        : '',
      venue: exam.venue || '',
      capacity: exam.capacity || '',
      is_active: Boolean(exam.is_active),
    });

    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const cancelEdit = () => {
    if (saving) {
      return;
    }

    setEditingExam(null);

    setForm({
      title: '',
      description: '',
      exam_date: '',
      start_time: '',
      end_time: '',
      venue: '',
      capacity: '',
      is_active: true,
    });
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingExam) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        title: form.title,
        description: form.description || null,
        exam_date: form.exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        capacity: form.capacity
          ? Number(form.capacity)
          : null,
        is_active: form.is_active,
      };

      const response = await api.put(
        `/staff/exams/${editingExam.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          'Entrance exam updated successfully.'
      );

      cancelEdit();
      await loadExams();
    } catch (err) {
      console.error('Failed to update exam:', err);

      const validationErrors =
        err.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)[0]?.[0];

        setError(
          firstError ||
            'Please check the form fields.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to update entrance exam.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelExam = async (exam) => {
    const confirmed = await confirm({
      title: 'Cancel Examination',
      message: `Are you sure you want to cancel "${exam.title}"?`,
      confirmLabel: 'Cancel Exam',
    });

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const response = await api.delete(
        `/staff/exams/${exam.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          'Entrance exam cancelled successfully.'
      );

      await loadExams();
    } catch (err) {
      console.error('Failed to cancel exam:', err);

      setError(
        err.response?.data?.message ||
          'Failed to cancel entrance exam.'
      );
    }
  };

  const activeCount = exams.filter(
    (exam) => exam.is_active
  ).length;

  const inactiveCount = exams.filter(
    (exam) => !exam.is_active
  ).length;

  const upcomingCount = exams.filter((exam) => {
    if (!exam.exam_date) {
      return false;
    }

    const examDate = new Date(exam.exam_date);
    const today = new Date();

    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return examDate >= today && exam.is_active;
  }).length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#123B5D] flex items-center justify-center mb-4">
            <ClipboardList
              size={28}
              className="text-[#F4B400] animate-pulse"
            />
          </div>

          <p className="text-gray-600 font-medium">
            Loading entrance exams...
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center">
              <ClipboardList
                size={23}
                className="text-[#F4B400]"
              />
            </div>

            <h1 className="text-3xl font-bold text-[#123B5D]">
              Entrance Exams
            </h1>
          </div>

          <p className="text-gray-600">
            View and manage entrance examinations for applicants
            assigned to your program.
          </p>
        </div>

        <button
          type="button"
          onClick={loadExams}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl">
          <CheckCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Success
            </p>

            <p className="text-sm mt-1">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Exams
              </p>

              <p className="text-3xl font-bold text-[#123B5D] mt-2">
                {exams.length}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList
                size={21}
                className="text-[#123B5D]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Exams
              </p>

              <p className="text-3xl font-bold text-green-600 mt-2">
                {activeCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle
                size={21}
                className="text-green-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Upcoming
              </p>

              <p className="text-3xl font-bold text-[#C99A00] mt-2">
                {upcomingCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-yellow-50 flex items-center justify-center">
              <CalendarDays
                size={21}
                className="text-[#C99A00]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cancelled
              </p>

              <p className="text-3xl font-bold text-gray-600 mt-2">
                {inactiveCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
              <XCircle
                size={21}
                className="text-gray-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Edit Form */}
      {editingExam && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="bg-[#123B5D] px-6 py-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Pencil
                  size={20}
                  className="text-[#F4B400]"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Edit Entrance Exam
                </h2>

                <p className="text-sm text-blue-100 mt-0.5">
                  Update the selected examination schedule.
                </p>
              </div>

            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-6"
          >

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Exam Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D] resize-none"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Examination Schedule
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Exam Date
                  </label>

                  <input
                    type="date"
                    name="exam_date"
                    value={form.exam_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    End Time
                  </label>

                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
                  />
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Venue
                </label>

                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20"
                />
              </div>

            </div>

            <div className="flex items-center gap-3">

              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />

              <label className="text-sm font-semibold text-gray-700">
                Exam is active
              </label>

            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil size={18} />
                    Update Exam
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
              >
                Cancel
              </button>

            </div>

          </form>
        </div>
      )}

      {/* Empty State */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
            <ClipboardList
              size={30}
              className="text-[#123B5D]"
            />
          </div>

          <h2 className="text-xl font-bold text-[#123B5D]">
            No Entrance Exams
          </h2>

          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            There are currently no entrance examinations
            assigned to applicants in your program.
          </p>

        </div>
      ) : (
        <div>

          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#123B5D]">
                Exam Schedules
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Entrance examinations connected to your assigned programs.
              </p>
            </div>
          </div>

          <div className="space-y-6">

            {exams.map((exam) => {
              const assignments =
                getAssignedApplicants(exam);

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
                >

                  {/* Exam Header */}
                  <div className="px-6 py-5 border-b border-gray-100">

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                      <div className="flex items-start gap-4">

                        <div className="w-12 h-12 shrink-0 rounded-xl bg-[#123B5D] flex items-center justify-center">
                          <ClipboardList
                            size={22}
                            className="text-[#F4B400]"
                          />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide font-semibold text-[#C99A00]">
                            Entrance Examination
                          </p>

                          <h2 className="text-xl font-bold text-[#123B5D] mt-1">
                            {exam.title}
                          </h2>

                          <p className="text-xs text-gray-400 mt-1">
                            Exam #{exam.id}
                          </p>
                        </div>

                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 w-fit px-3.5 py-2 rounded-full text-xs font-semibold border ${
                          exam.is_active
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {exam.is_active ? (
                          <CheckCircle size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}

                        {exam.is_active
                          ? 'Active'
                          : 'Cancelled'}
                      </span>

                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">

                    {exam.description && (
                      <div className="flex items-start gap-3 mb-5">
                        <FileText
                          size={18}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />

                        <p className="text-sm text-gray-600 leading-6">
                          {exam.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <CalendarDays size={16} />
                          <span className="text-xs font-medium">
                            Exam Date
                          </span>
                        </div>

                        <p className="text-sm font-bold text-gray-800">
                          {formatDate(exam.exam_date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <Clock size={16} />
                          <span className="text-xs font-medium">
                            Time
                          </span>
                        </div>

                        <p className="text-sm font-bold text-gray-800">
                          {formatTime(exam.start_time)}
                          {' - '}
                          {formatTime(exam.end_time)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <MapPin size={16} />
                          <span className="text-xs font-medium">
                            Venue
                          </span>
                        </div>

                        <p className="text-sm font-bold text-gray-800">
                          {exam.venue || 'Not specified'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                          <Users size={16} />
                          <span className="text-xs font-medium">
                            Capacity
                          </span>
                        </div>

                        <p className="text-sm font-bold text-gray-800">
                          {exam.capacity || 'Unlimited'}
                        </p>
                      </div>

                    </div>

                    {/* Assigned Applicants */}
                    <div className="mt-6 pt-5 border-t border-gray-100">

                      <div className="flex items-center gap-2 mb-4">
                        <UserRound
                          size={18}
                          className="text-[#123B5D]"
                        />

                        <h3 className="font-bold text-[#123B5D]">
                          Assigned Applicants
                        </h3>

                        <span className="text-xs font-semibold bg-blue-50 text-[#123B5D] px-2.5 py-1 rounded-full">
                          {assignments.length}
                        </span>
                      </div>

                      {assignments.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No applicants are assigned to this examination.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                          {assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-3 bg-gray-50"
                            >

                              <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#123B5D]">
                                  <UserRound size={17} />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {getApplicantName(
                                      assignment
                                    )}
                                  </p>

                                  <p className="text-xs text-gray-500">
                                    {getApplicantProgram(
                                      assignment
                                    )}
                                  </p>
                                </div>

                              </div>

                              <span className="text-xs font-medium text-gray-500 capitalize">
                                {assignment.status ||
                                  'scheduled'}
                              </span>

                            </div>
                          ))}

                        </div>
                      )}

                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-5 border-t border-gray-100">

                      <div className="text-sm text-gray-500">
                        Only exams connected to your assigned programs are shown.
                      </div>

                      <div className="flex flex-wrap gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(exam)
                          }
                          className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-2.5 rounded-xl font-semibold transition"
                        >
                          <Pencil size={17} />
                          Edit
                        </button>

                        {exam.is_active && (
                          <button
                            type="button"
                            onClick={() =>
                              cancelExam(exam)
                            }
                            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
                          >
                            <XCircle size={17} />
                            Cancel Exam
                          </button>
                        )}

                      </div>

                    </div>

                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

    </div>
  );
};

const StaffExamsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <StaffExams confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default StaffExamsWrapper;