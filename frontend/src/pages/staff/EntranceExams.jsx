import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  Search,
  Eye,
  Pencil,
  XCircle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Filter,
  GraduationCap,
  X,
  Save,
  ShieldCheck,
} from 'lucide-react';

import api from '../../services/api';
import { useConfirmDialog, ConfirmDialogHost } from '../../components/ui/ConfirmDialog';
import ModalPortal from '../../components/ui/ModalPortal';
import { useAuth } from '../../context/AuthContext';

const isUpcoming = (exam) => {
  if (!exam.exam_date) {
    return false;
  }

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const examDate = new Date(
    `${exam.exam_date}T00:00:00`
  );

  return (
    examDate >= today &&
    Boolean(exam.is_active)
  );
};

const getExamStatus = (exam) => {
  if (!exam.is_active) {
    return 'cancelled';
  }

  if (isUpcoming(exam)) {
    return 'upcoming';
  }

  return 'completed';
};

const getStatusConfig = (exam) => {
  const status = getExamStatus(exam);

  if (status === 'cancelled') {
    return {
      label: 'Cancelled',
      icon: XCircle,
      className:
        'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    };
  }

  if (status === 'upcoming') {
    return {
      label: 'Upcoming',
      icon: CheckCircle2,
      className:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    };
  }

  return {
    label: 'Completed',
    icon: Clock3,
    className:
      'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
  };
};

const StatusBadge = ({ exam }) => {
  const config = getStatusConfig(exam);
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1.5
        rounded-full
        text-xs
        font-bold
        ${config.className}
      `}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
};

const StaffEntranceExams = ({ confirm }) => {
  const { token } = useAuth();

  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [updating, setUpdating] = useState(false);

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

  const fetchExams = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await api.get('/staff/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExams(response.data?.data || []);
    } catch (err) {
      console.error(
        'Failed to load staff exams:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load entrance examinations.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchExams();
    }
  }, [token]);

  const getApplicantName = (applicant) => {
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

  const getExamPrograms = (exam) => {
    const programs = [];

    exam?.exam_assignments?.forEach((assignment) => {
      assignment?.applicant?.admission_applications?.forEach(
        (application) => {
          const program =
            application?.academic_program;

          if (
            program &&
            !programs.some(
              (item) => item.id === program.id
            )
          ) {
            programs.push(program);
          }
        }
      );
    });

    return programs;
  };

  const filteredExams = exams.filter((exam) => {
    const searchValue = search
      .toLowerCase()
      .trim();

    const title = (exam.title || '').toLowerCase();
    const venue = (exam.venue || '').toLowerCase();
    const description =
      (exam.description || '').toLowerCase();

    const programs = getExamPrograms(exam)
      .map(
        (program) =>
          `${program.name || ''} ${
            program.code || ''
          }`
      )
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !searchValue ||
      title.includes(searchValue) ||
      venue.includes(searchValue) ||
      description.includes(searchValue) ||
      programs.includes(searchValue);

    const matchesStatus =
      statusFilter === 'all' ||
      getExamStatus(exam) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) {
      return '—';
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) {
      return '—';
    }

    const [hours, minutes] =
      time.split(':');

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const openExam = (exam) => {
    setSelectedExam(exam);
  };

  const closeExam = () => {
    if (updating) {
      return;
    }

    setSelectedExam(null);
  };

  const startEditing = (exam) => {
    setEditingExam(exam);

    setForm({
      title: exam.title || '',
      description: exam.description || '',
      exam_date: exam.exam_date || '',
      start_time: exam.start_time
        ? exam.start_time.substring(0, 5)
        : '',
      end_time: exam.end_time
        ? exam.end_time.substring(0, 5)
        : '',
      venue: exam.venue || '',
      capacity:
        exam.capacity !== null &&
        exam.capacity !== undefined
          ? String(exam.capacity)
          : '',
      is_active: Boolean(
        exam.is_active
      ),
    });
  };

  const closeEditor = () => {
    if (updating) {
      return;
    }

    setEditingExam(null);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  };

  const updateExam = async (event) => {
    event.preventDefault();

    if (!editingExam) {
      return;
    }

    try {
      setUpdating(true);

      const response = await api.put(
        `/staff/exams/${editingExam.id}`,
        {
          title: form.title,
          description:
            form.description || null,
          exam_date: form.exam_date,
          start_time: form.start_time,
          end_time: form.end_time,
          venue: form.venue,
          capacity: form.capacity
            ? Number(form.capacity)
            : null,
          is_active: form.is_active,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedExam =
        response.data?.data;

      setExams((currentExams) =>
        currentExams.map((exam) =>
          exam.id === editingExam.id
            ? updatedExam || {
                ...exam,
                ...form,
              }
            : exam
        )
      );

      setEditingExam(null);
    } catch (err) {
      console.error(
        'Failed to update exam:',
        err
      );

      alert(
        err.response?.data?.message ||
          'Failed to update entrance examination.'
      );
    } finally {
      setUpdating(false);
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
      setUpdating(true);

      await api.delete(
        `/staff/exams/${exam.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setExams((currentExams) =>
        currentExams.map((item) =>
          item.id === exam.id
            ? {
                ...item,
                is_active: false,
              }
            : item
        )
      );

      if (
        selectedExam?.id === exam.id
      ) {
        setSelectedExam({
          ...selectedExam,
          is_active: false,
        });
      }
    } catch (err) {
      console.error(
        'Failed to cancel exam:',
        err
      );

      alert(
        err.response?.data?.message ||
          'Failed to cancel entrance examination.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const totalCount = exams.length;

  const activeCount = exams.filter(
    (exam) => exam.is_active
  ).length;

  const upcomingCount = exams.filter(
    (exam) => isUpcoming(exam)
  ).length;

  const applicantCount =
    exams.reduce(
      (total, exam) =>
        total +
        (exam.exam_assignments
          ?.length || 0),
      0
    );

  return (
    <div className="space-y-7 page-transition">

      {/* =====================================================
          HERO HEADER
      ===================================================== */}
      <section
        className="
          relative
          overflow-hidden
          rounded-2xl
          ep-brand-gradient
          shadow-lg
          p-6
          sm:p-8
          animate-fade-up
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-20
            w-52
            h-52
            rounded-full
            bg-white/5
            animate-float
          "
        />

        <div
          className="
            absolute
            right-24
            -bottom-24
            w-44
            h-44
            rounded-full
            bg-[#F4B400]/10
          "
        />

        <div className="relative z-10">
          <div
            className="
              inline-flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              bg-white/10
              border
              border-white/10
              text-blue-100
              text-[10px]
              font-bold
              uppercase
              tracking-[0.16em]
              mb-4
            "
          >
            <ShieldCheck size={13} />
            Examination Management
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Entrance Examinations
              </h1>

              <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-2xl">
                View and manage entrance examination schedules
                assigned to applicants in your programs.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchExams(true)
              }
              disabled={refreshing}
              className="
                self-start
                lg:self-auto
                inline-flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                bg-white/10
                hover:bg-white/20
                border
                border-white/10
                text-white
                text-sm
                font-semibold
                backdrop-blur-sm
                transition-colors
                disabled:opacity-60
              "
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
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY
      ===================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Exams',
            value: totalCount,
            description:
              'All examination schedules',
            icon: CalendarDays,
            iconBg:
              'bg-blue-50 dark:bg-blue-500/10',
            iconColor:
              'text-blue-600 dark:text-blue-400',
          },
          {
            title: 'Active Exams',
            value: activeCount,
            description:
              'Currently active schedules',
            icon: CheckCircle2,
            iconBg:
              'bg-emerald-50 dark:bg-emerald-500/10',
            iconColor:
              'text-emerald-600 dark:text-emerald-400',
          },
          {
            title: 'Upcoming',
            value: upcomingCount,
            description:
              'Scheduled from today onward',
            icon: Clock3,
            iconBg:
              'bg-amber-50 dark:bg-amber-500/10',
            iconColor:
              'text-amber-600 dark:text-amber-400',
          },
          {
            title: 'Assigned Applicants',
            value: applicantCount,
            description:
              'Across all examination schedules',
            icon: Users,
            iconBg:
              'bg-[#0F766E]/10 dark:bg-teal-400/10',
            iconColor:
              'text-[#0F766E] dark:text-teal-300',
          },
        ].map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="
                ep-card
                ep-hover-lift
                p-5
                animate-fade-up
              "
              style={{
                animationDelay: `${
                  index * 45
                }ms`,
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
                  className={`
                    w-12
                    h-12
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                    ${card.iconBg}
                  `}
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

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <div
          className="
            ep-card
            border-red-200
            dark:border-red-900/50
            p-4
            flex
            items-start
            gap-3
            animate-scale-in
          "
        >
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>

          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">
              Unable to load examinations
            </p>

            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          SEARCH & FILTER
      ===================================================== */}
      <section
        className="
          ep-card
          p-4
          sm:p-5
          animate-fade-up
        "
        style={{
          animationDelay: '180ms',
        }}
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
              Find examination schedules by title, venue, or program.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={19}
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search exam, venue, or program..."
              className="
                w-full
                pl-11
                pr-4
                py-3
                border
                border-gray-200
                dark:border-gray-700
                rounded-xl
                bg-gray-50
                dark:bg-[#142738]
                text-gray-800
                dark:text-gray-100
                text-sm
                outline-none
                focus:border-[#0F766E]
                dark:focus:border-teal-400
                focus:ring-4
                focus:ring-[#0F766E]/10
              "
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="
              lg:w-48
              px-4
              py-3
              border
              border-gray-200
              dark:border-gray-700
              rounded-xl
              bg-gray-50
              dark:bg-[#142738]
              text-gray-800
              dark:text-gray-100
              text-sm
              outline-none
              focus:border-[#0F766E]
              dark:focus:border-teal-400
              focus:ring-4
              focus:ring-[#0F766E]/10
            "
          >
            <option value="all">
              All Statuses
            </option>

            <option value="upcoming">
              Upcoming
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          {(search ||
            statusFilter !==
              'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                border
                border-gray-200
                dark:border-gray-700
                text-gray-600
                dark:text-gray-300
                text-sm
                font-semibold
                hover:bg-gray-50
                dark:hover:bg-gray-800
                transition-colors
              "
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* =====================================================
          EXAMINATION LIST
      ===================================================== */}
      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '220ms',
        }}
      >
        <div
          className="
            p-5
            sm:p-6
            border-b
            border-gray-100
            dark:border-gray-800
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-[#123B5D]/10
                dark:bg-sky-400/10
                flex
                items-center
                justify-center
              "
            >
              <CalendarDays
                size={21}
                className="text-[#123B5D] dark:text-sky-300"
              />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123B5D] dark:text-sky-300">
                Examination Schedules
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredExams.length} schedule
                {filteredExams.length !==
                1
                  ? 's'
                  : ''}{' '}
                displayed
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex
              items-center
              gap-2
              self-start
              sm:self-auto
              px-3
              py-1.5
              rounded-full
              bg-[#0F766E]/10
              dark:bg-teal-400/10
              text-[#0F766E]
              dark:text-teal-300
              text-xs
              font-bold
            "
          >
            <ShieldCheck size={14} />
            Exam Schedule
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="
                    border
                    border-gray-100
                    dark:border-gray-800
                    rounded-2xl
                    p-5
                  "
                >
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="ep-skeleton h-5 w-48 mb-3" />
                      <div className="ep-skeleton h-6 w-24 rounded-full" />
                    </div>

                    <div className="ep-skeleton w-11 h-11 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {Array.from({
                      length: 4,
                    }).map(
                      (
                        __,
                        itemIndex
                      ) => (
                        <div
                          key={
                            itemIndex
                          }
                        >
                          <div className="ep-skeleton h-3 w-16 mb-2" />
                          <div className="ep-skeleton h-4 w-28" />
                        </div>
                      )
                    )}
                  </div>

                  <div className="ep-skeleton h-10 w-full mt-6 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

        ) : filteredExams.length ===
          0 ? (

          /* Empty */
          <div className="p-10 sm:p-14 text-center">
            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-gray-100
                dark:bg-gray-800
                flex
                items-center
                justify-center
                mx-auto
                mb-4
                animate-float
              "
            >
              <CalendarDays className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              No Examinations Found
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              {search ||
              statusFilter !==
                'all'
                ? 'Try adjusting your search or filter settings.'
                : 'Entrance examinations assigned to applicants in your programs will appear here.'}
            </p>

            {(search ||
              statusFilter !==
                'all') && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-[#0F766E]
                  dark:text-teal-300
                  hover:underline
                "
              >
                Clear filters
              </button>
            )}
          </div>

        ) : (

          /* Exam Cards */
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredExams.map(
                (exam, index) => {
                  const programs =
                    getExamPrograms(
                      exam
                    );

                  return (
                    <article
                      key={exam.id}
                      className="
                        group
                        border
                        border-gray-100
                        dark:border-gray-800
                        rounded-2xl
                        overflow-hidden
                        hover:border-[#0F766E]/30
                        dark:hover:border-teal-400/30
                        hover:shadow-lg
                        transition-colors
                        duration-200
                        animate-fade-up
                      "
                      style={{
                        animationDelay: `${
                          index *
                          45
                        }ms`,
                      }}
                    >
                      {/* Card Header */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                              {exam.title ||
                                'Untitled Examination'}
                            </h3>

                            <div className="mt-3">
                              <StatusBadge
                                exam={
                                  exam
                                }
                              />
                            </div>
                          </div>

                          <div
                            className="
                              w-11
                              h-11
                              rounded-xl
                              bg-[#123B5D]/10
                              dark:bg-sky-400/10
                              text-[#123B5D]
                              dark:text-sky-300
                              flex
                              items-center
                              justify-center
                              shrink-0
                              
                              transition-transform
                            "
                          >
                            <CalendarDays
                              size={
                                21
                              }
                            />
                          </div>
                        </div>

                        {exam.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 line-clamp-2">
                            {
                              exam.description
                            }
                          </p>
                        )}

                        {/* Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                          <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-3">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={
                                  15
                                }
                                className="text-[#0F766E] dark:text-teal-300"
                              />

                              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                                Date
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">
                              {formatDate(
                                exam.exam_date
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-3">
                            <div className="flex items-center gap-2">
                              <Clock3
                                size={
                                  15
                                }
                                className="text-[#0F766E] dark:text-teal-300"
                              />

                              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                                Time
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">
                              {formatTime(
                                exam.start_time
                              )}{' '}
                              –{' '}
                              {formatTime(
                                exam.end_time
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-3">
                            <div className="flex items-center gap-2">
                              <MapPin
                                size={
                                  15
                                }
                                className="text-[#0F766E] dark:text-teal-300"
                              />

                              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                                Venue
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2 truncate">
                              {exam.venue ||
                                '—'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-3">
                            <div className="flex items-center gap-2">
                              <Users
                                size={
                                  15
                                }
                                className="text-[#0F766E] dark:text-teal-300"
                              />

                              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                                Applicants
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-2">
                              {exam.exam_assignments
                                ?.length ||
                                0}

                              {exam.capacity
                                ? ` / ${exam.capacity}`
                                : ''}
                            </p>
                          </div>
                        </div>

                        {/* Programs */}
                        {programs.length >
                          0 && (
                          <div className="mt-5">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap
                                size={
                                  15
                                }
                                className="text-[#123B5D] dark:text-sky-300"
                              />

                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                Assigned Programs
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {programs.map(
                                (
                                  program
                                ) => (
                                  <span
                                    key={
                                      program.id
                                    }
                                    className="
                                      px-2.5
                                      py-1.5
                                      rounded-lg
                                      bg-[#123B5D]/10
                                      dark:bg-sky-400/10
                                      text-[#123B5D]
                                      dark:text-sky-300
                                      text-xs
                                      font-bold
                                    "
                                  >
                                    {program.code ||
                                      program.name}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div
                          className="
                            flex
                            flex-wrap
                            justify-end
                            gap-2
                            mt-6
                            pt-5
                            border-t
                            border-gray-100
                            dark:border-gray-800
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openExam(
                                exam
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              px-3.5
                              py-2
                              rounded-lg
                              border
                              border-gray-200
                              dark:border-gray-700
                              text-gray-700
                              dark:text-gray-300
                              text-xs
                              font-bold
                              hover:bg-gray-50
                              dark:hover:bg-gray-800
                              transition-colors
                            "
                          >
                            <Eye
                              size={
                                15
                              }
                            />
                            View
                          </button>

                          {exam.is_active && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(
                                    exam
                                  )
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  px-3.5
                                  py-2
                                  rounded-lg
                                  bg-[#123B5D]
                                  hover:bg-[#0F3553]
                                  text-white
                                  text-xs
                                  font-bold
                                  shadow-sm
                                  transition-colors
                                "
                              >
                                <Pencil
                                  size={
                                    15
                                  }
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  cancelExam(
                                    exam
                                  )
                                }
                                disabled={
                                  updating
                                }
                                className="
                                  inline-flex
                                  items-center
                                  gap-2
                                  px-3.5
                                  py-2
                                  rounded-lg
                                  bg-red-50
                                  dark:bg-red-500/10
                                  text-red-700
                                  dark:text-red-300
                                  text-xs
                                  font-bold
                                  hover:bg-red-100
                                  dark:hover:bg-red-500/20
                                  transition-colors
                                  disabled:opacity-50
                                "
                              >
                                <XCircle
                                  size={
                                    15
                                  }
                                />
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          VIEW EXAM MODAL
      ===================================================== */}
      {selectedExam && (
        <ModalPortal
          onEscape={() => {
            if (!updating) closeExam();
          }}
        >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Entrance Exam Details"
          tabIndex={-1}
          className="
            fixed
            inset-0
            z-[100]
            bg-black/60
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
            animate-scale-in
          "
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !updating
            ) {
              closeExam();
            }
          }}
        >
          <div
            className="
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
              bg-white
              dark:bg-[#0F1F2D]
              rounded-2xl
              shadow-2xl
              border
              border-gray-200
              dark:border-gray-700
            "
          >
            {/* Header */}
            <div
              className="
                sticky
                top-0
                z-10
                px-5
                sm:px-6
                py-5
                bg-white
                dark:bg-[#0F1F2D]
                border-b
                border-gray-100
                dark:border-gray-800
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays
                    size={17}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Examination Details
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedExam.title}
                </h2>

                <div className="mt-3">
                  <StatusBadge
                    exam={selectedExam}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={closeExam}
                disabled={updating}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:text-gray-700
                  dark:hover:text-gray-200
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  transition-colors
                  shrink-0
                  disabled:opacity-50
                "
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">

              {/* Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-4">
                  <CalendarDays
                    size={18}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-3">
                    Date
                  </p>

                  <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {formatDate(
                      selectedExam.exam_date
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-4">
                  <Clock3
                    size={18}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-3">
                    Time
                  </p>

                  <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {formatTime(
                      selectedExam.start_time
                    )}{' '}
                    –{' '}
                    {formatTime(
                      selectedExam.end_time
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-4">
                  <MapPin
                    size={18}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-3">
                    Venue
                  </p>

                  <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {selectedExam.venue ||
                      '—'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-[#142738] p-4">
                  <Users
                    size={18}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-3">
                    Capacity
                  </p>

                  <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {selectedExam.capacity ||
                      'No limit'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedExam.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Description
                  </p>

                  <div className="mt-2 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {
                        selectedExam.description
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Programs */}
              {getExamPrograms(
                selectedExam
              ).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Assigned Programs
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {getExamPrograms(
                      selectedExam
                    ).map((program) => (
                      <span
                        key={program.id}
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          px-3
                          py-1.5
                          rounded-lg
                          bg-[#123B5D]/10
                          dark:bg-sky-400/10
                          text-[#123B5D]
                          dark:text-sky-300
                          text-xs
                          font-bold
                        "
                      >
                        <GraduationCap
                          size={13}
                        />

                        {program.code ||
                          program.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Applicants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Assigned Applicants
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {selectedExam
                        .exam_assignments
                        ?.length ||
                        0}{' '}
                      applicant(s)
                    </p>
                  </div>

                  <div className="w-9 h-9 rounded-lg bg-[#0F766E]/10 dark:bg-teal-400/10 flex items-center justify-center">
                    <Users
                      size={17}
                      className="text-[#0F766E] dark:text-teal-300"
                    />
                  </div>
                </div>

                {selectedExam.exam_assignments
                  ?.length > 0 ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedExam.exam_assignments.map(
                        (
                          assignment
                        ) => (
                          <div
                            key={
                              assignment.id
                            }
                            className="
                              p-4
                              flex
                              items-center
                              justify-between
                              gap-4
                              hover:bg-gray-50
                              dark:hover:bg-white/[0.025]
                              transition
                            "
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-[#123B5D]/10 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
                                <Users
                                  size={
                                    15
                                  }
                                  className="text-[#123B5D] dark:text-sky-300"
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {getApplicantName(
                                    assignment.applicant
                                  )}
                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {assignment
                                    .applicant
                                    ?.user
                                    ?.email ||
                                    'No email'}
                                </p>
                              </div>
                            </div>

                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 capitalize shrink-0">
                              {assignment.status ||
                                'scheduled'}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-[#142738] rounded-xl p-6 text-center">
                    <FileText
                      size={30}
                      className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
                    />

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No applicants are assigned to
                      this examination yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={closeExam}
                disabled={updating}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-gray-100
                  dark:bg-gray-800
                  text-gray-700
                  dark:text-gray-300
                  font-semibold
                  text-sm
                  hover:bg-gray-200
                  dark:hover:bg-gray-700
                  transition-colors
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* =====================================================
          EDIT EXAM MODAL
      ===================================================== */}
      {editingExam && (
        <ModalPortal
          onEscape={() => {
            if (!updating) closeEditor();
          }}
        >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Entrance Exam"
          tabIndex={-1}
          className="
            fixed
            inset-0
            z-[100]
            bg-black/60
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
            animate-scale-in
          "
        >
          <div
            className="
              bg-white
              dark:bg-[#0F1F2D]
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
              rounded-2xl
              shadow-2xl
              border
              border-gray-200
              dark:border-gray-700
            "
          >
            <div
              className="
                sticky
                top-0
                z-10
                px-5
                sm:px-6
                py-5
                bg-white
                dark:bg-[#0F1F2D]
                border-b
                border-gray-100
                dark:border-gray-800
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Pencil
                    size={16}
                    className="text-[#0F766E] dark:text-teal-300"
                  />

                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Schedule Update
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Entrance Examination
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Update the schedule and examination details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={updating}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:text-gray-700
                  dark:hover:text-gray-200
                  hover:bg-gray-100
                  dark:hover:bg-gray-800
                  disabled:opacity-50
                "
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={updateExam}
              className="p-5 sm:p-6 space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Examination Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={
                    handleChange
                  }
                  required
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    bg-white
                    dark:bg-[#142738]
                    text-gray-800
                    dark:text-gray-100
                    outline-none
                    focus:border-[#0F766E]
                    dark:focus:border-teal-400
                    focus:ring-4
                    focus:ring-[#0F766E]/10
                  "
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    bg-white
                    dark:bg-[#142738]
                    text-gray-800
                    dark:text-gray-100
                    resize-none
                    outline-none
                    focus:border-[#0F766E]
                    dark:focus:border-teal-400
                    focus:ring-4
                    focus:ring-[#0F766E]/10
                  "
                />
              </div>

              {/* Date + Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Exam Date
                  </label>

                  <input
                    type="date"
                    name="exam_date"
                    value={
                      form.exam_date
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      w-full
                      px-4
                      py-3
                      border
                      border-gray-200
                      dark:border-gray-700
                      rounded-xl
                      bg-white
                      dark:bg-[#142738]
                      text-gray-800
                      dark:text-gray-100
                      outline-none
                      focus:border-[#0F766E]
                      dark:focus:border-teal-400
                      focus:ring-4
                      focus:ring-[#0F766E]/10
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Venue
                  </label>

                  <input
                    type="text"
                    name="venue"
                    value={
                      form.venue
                    }
                    onChange={
                      handleChange
                    }
                    required
                    placeholder="Exam venue"
                    className="
                      w-full
                      px-4
                      py-3
                      border
                      border-gray-200
                      dark:border-gray-700
                      rounded-xl
                      bg-white
                      dark:bg-[#142738]
                      text-gray-800
                      dark:text-gray-100
                      outline-none
                      focus:border-[#0F766E]
                      dark:focus:border-teal-400
                      focus:ring-4
                      focus:ring-[#0F766E]/10
                    "
                  />
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="start_time"
                    value={
                      form.start_time
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      w-full
                      px-4
                      py-3
                      border
                      border-gray-200
                      dark:border-gray-700
                      rounded-xl
                      bg-white
                      dark:bg-[#142738]
                      text-gray-800
                      dark:text-gray-100
                      outline-none
                      focus:border-[#0F766E]
                      dark:focus:border-teal-400
                      focus:ring-4
                      focus:ring-[#0F766E]/10
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>

                  <input
                    type="time"
                    name="end_time"
                    value={
                      form.end_time
                    }
                    onChange={
                      handleChange
                    }
                    required
                    className="
                      w-full
                      px-4
                      py-3
                      border
                      border-gray-200
                      dark:border-gray-700
                      rounded-xl
                      bg-white
                      dark:bg-[#142738]
                      text-gray-800
                      dark:text-gray-100
                      outline-none
                      focus:border-[#0F766E]
                      dark:focus:border-teal-400
                      focus:ring-4
                      focus:ring-[#0F766E]/10
                    "
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Applicant Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={
                    form.capacity
                  }
                  onChange={
                    handleChange
                  }
                  min="1"
                  placeholder="Optional"
                  className="
                    w-full
                    px-4
                    py-3
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    bg-white
                    dark:bg-[#142738]
                    text-gray-800
                    dark:text-gray-100
                    outline-none
                    focus:border-[#0F766E]
                    dark:focus:border-teal-400
                    focus:ring-4
                    focus:ring-[#0F766E]/10
                  "
                />
              </div>

              {/* Active */}
              <label
                className="
                  flex
                  items-center
                  gap-3
                  p-4
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  cursor-pointer
                "
              >
                <input
                  type="checkbox"
                  name="is_active"
                  checked={
                    form.is_active
                  }
                  onChange={
                    handleChange
                  }
                  className="w-4 h-4 accent-[#0F766E]"
                />

                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Examination schedule is active
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Active schedules remain available for applicants.
                  </p>
                </div>
              </label>

              {/* Actions */}
              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  sm:justify-end
                  gap-3
                  pt-2
                "
              >
                <button
                  type="button"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    updating
                  }
                  className="
                    px-5
                    py-2.5
                    rounded-xl
                    border
                    border-gray-200
                    dark:border-gray-700
                    text-gray-700
                    dark:text-gray-300
                    font-semibold
                    text-sm
                    hover:bg-gray-50
                    dark:hover:bg-gray-800
                    transition-colors
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    updating
                  }
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-5
                    py-2.5
                    rounded-xl
                    bg-[#123B5D]
                    hover:bg-[#0F3553]
                    text-white
                    font-bold
                    text-sm
                    shadow-md
                    hover:shadow-lg
                    transition-colors
                    disabled:opacity-60
                  "
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
                      <Save
                        size={16}
                      />
                      Save Changes
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
};

const StaffEntranceExamsWrapper = () => {
  const { confirm, dialog } = useConfirmDialog();

  return (
    <>
      <StaffEntranceExams confirm={confirm} />

      <ConfirmDialogHost dialog={dialog} />
    </>
  );
};

export default StaffEntranceExamsWrapper;