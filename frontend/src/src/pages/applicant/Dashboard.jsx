import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/Shared';

import {
  FileText,
  Award,
  FolderOpen,
  GraduationCap,
  ArrowRight,
  Clock3,
  Bell,
  Building2,
  RefreshCw,
  Sparkles,
  MapPin,
  BookOpen,
  UserRound,
  ChevronRight,
} from 'lucide-react';

const ApplicantDashboard = () => {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setError] = useState('');

  // Real backend data states
  const [admissionApp, setAdmissionApp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [scholarshipApps, setScholarshipApps] = useState([]);
  const [activeScholarships, setActiveScholarships] = useState([]);
  const [entranceExams, setEntranceExams] = useState([]);
  const [notifications, setNotifications] = useState([]);

  /* =========================================================
     FETCH DASHBOARD DATA
  ========================================================= */
  const fetchDashboardData = async (isRefresh = false) => {
    if (!token) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const headers = { Authorization: `Bearer ${token}` };

      // Concurrently query applicant endpoints
      const [
        admissionsRes,
        documentsRes,
        scholarshipAppsRes,
        scholarshipsRes,
        examsRes,
        notificationsRes,
      ] = await Promise.allSettled([
        api.get('/applicant/admissions', { headers }),
        api.get('/applicant/documents', { headers }),
        api.get('/applicant/scholarship-applications', { headers }),
        api.get('/applicant/scholarships', { headers }),
        api.get('/applicant/exams', { headers }),
        api.get('/applicant/notifications', { headers }),
      ]);

      // 1. Admission Application
      if (admissionsRes.status === 'fulfilled') {
        const data = admissionsRes.value.data;
        const apps = Array.isArray(data) ? data : data?.data || [];
        setAdmissionApp(apps.length > 0 ? apps[0] : null);
      }

      // 2. Documents
      if (documentsRes.status === 'fulfilled') {
        const data = documentsRes.value.data;
        setDocuments(Array.isArray(data) ? data : data?.data || []);
      }

      // 3. Scholarship Applications
      if (scholarshipAppsRes.status === 'fulfilled') {
        const data = scholarshipAppsRes.value.data;
        setScholarshipApps(Array.isArray(data) ? data : data?.data || []);
      }

      // 4. Available Scholarships
      if (scholarshipsRes.status === 'fulfilled') {
        const data = scholarshipsRes.value.data;
        setActiveScholarships(Array.isArray(data) ? data : data?.data || []);
      }

      // 5. Entrance Exams
      if (examsRes.status === 'fulfilled') {
        const data = examsRes.value.data;
        setEntranceExams(Array.isArray(data) ? data : data?.data || []);
      }

      // 6. Notifications
      if (notificationsRes.status === 'fulfilled') {
        const data = notificationsRes.value.data;
        setNotifications(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load applicant dashboard data:', err);
      setError('Unable to load some dashboard information. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  /* =========================================================
     DATE & TIME HELPERS
  ========================================================= */
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const parts = timeString.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1] || '00';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  /* =========================================================
     COMPUTED VALUES
  ========================================================= */
  const admissionStatus = admissionApp?.status || 'not_started';
  const assignedExam = entranceExams.length > 0 ? entranceExams[0] : null;

  const verifiedDocumentsCount = documents.filter(
    (doc) => doc.status === 'verified' || doc.verified_at
  ).length;

  const unreadNotificationsCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  /* =========================================================
     NEXT ACTION CALCULATION
  ========================================================= */
  const getNextAction = () => {
    if (!admissionApp) {
      return {
        badge: 'Step 1: Application',
        title: 'Start Your Admission Application',
        description:
          'Begin your journey at Trinidad Municipal College by submitting your official admission details and chosen academic program.',
        actionLabel: 'Start Application',
        actionPath: '/applicant/admission',
        color: 'border-[#F4B400] bg-amber-500/10 text-amber-900 dark:text-amber-200',
      };
    }

    if (admissionApp.status === 'draft') {
      return {
        badge: 'Draft Application',
        title: 'Complete and Submit Your Application',
        description:
          'You have an in-progress admission application. Review your program selection and submit it for college review.',
        actionLabel: 'Resume Application',
        actionPath: '/applicant/admission',
        color: 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200',
      };
    }

    if (documents.length === 0) {
      return {
        badge: 'Step 2: Documents',
        title: 'Upload Required Documents',
        description:
          'Your admission form has been received. Please upload your required admission documents (Form 138, PSA Birth Certificate, Good Moral Certificate, etc.) to proceed with verification.',
        actionLabel: 'Upload Documents',
        actionPath: '/applicant/documents',
        color: 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200',
      };
    }

    if (assignedExam) {
      return {
        badge: 'Step 3: Entrance Exam',
        title: `Exam Scheduled on ${formatDate(assignedExam.exam_date || assignedExam.date)}`,
        description: `Your entrance examination has been scheduled at ${assignedExam.venue || 'TMC Campus'}. Please review your examination room assignment and guidelines.`,
        actionLabel: 'View Exam Details',
        actionPath: '/applicant/exams',
        color: 'border-[#123B5D] bg-[#123B5D]/10 text-[#123B5D] dark:text-sky-200',
      };
    }

    if (admissionApp.status === 'under_review' || admissionApp.status === 'submitted') {
      return {
        badge: 'Official Review',
        title: 'Application Under Evaluation',
        description:
          'The TMC Admissions Office is reviewing your credentials. Check back soon for examination scheduling or document updates.',
        actionLabel: 'View Application Status',
        actionPath: '/applicant/admission',
        color: 'border-[#123B5D] bg-[#123B5D]/10 text-[#123B5D] dark:text-sky-200',
      };
    }

    if (admissionApp.status === 'approved') {
      return {
        badge: 'Admissions Approved',
        title: 'Congratulations! Application Approved',
        description:
          'You are approved for admission to Trinidad Municipal College. Check the scholarship opportunities and prepare for enrollment requirements.',
        actionLabel: 'Explore Scholarships',
        actionPath: '/applicant/scholarships',
        color: 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200',
      };
    }

    return {
      badge: 'Admission Portal',
      title: 'Keep Your Profile Updated',
      description:
        'Ensure all your contact numbers and emergency details are accurate so the college administration can reach you promptly.',
      actionLabel: 'Check My Profile',
      actionPath: '/applicant/profile',
      color: 'border-[#123B5D] bg-[#123B5D]/10 text-[#123B5D] dark:text-sky-200',
    };
  };

  const nextAction = getNextAction();

  /* =========================================================
     SKELETON LOADING STATE
  ========================================================= */
  if (loading) {
    return (
      <div className="space-y-6 page-transition">
        {/* HERO SKELETON */}
        <div className="ep-skeleton relative overflow-hidden rounded-2xl p-6 sm:p-8">
          <div className="h-6 w-40 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 h-10 w-72 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* STATS SKELETON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ep-card rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="ep-skeleton h-4 w-24" />
                  <div className="ep-skeleton h-8 w-20" />
                  <div className="ep-skeleton h-3 w-36" />
                </div>
                <div className="ep-skeleton h-12 w-12 rounded-xl shrink-0" />
              </div>
              <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>

        {/* WORKSPACE SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="ep-card rounded-2xl p-6 h-64 ep-skeleton" />
            <div className="ep-card rounded-2xl p-6 h-64 ep-skeleton" />
          </div>
          <div className="space-y-6">
            <div className="ep-card rounded-2xl p-6 h-72 ep-skeleton" />
            <div className="ep-card rounded-2xl p-6 h-48 ep-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER REAL DASHBOARD
  ========================================================= */
  return (
    <div className="space-y-8 page-transition">
      {/* =====================================================
          HERO BANNER
      ====================================================== */}
      <section className="ep-brand-gradient relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg text-white">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-amber-300/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="animate-fade-up">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">
              <Building2 className="h-3.5 w-3.5 text-[#F4B400]" />
              <span>Trinidad Municipal College • EduPath</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Applicant'}!
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Track your admission status, verify your submitted requirements, prepare for your
              entrance examination, and explore institutional scholarship grants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-white/20 transition-colors hover:bg-white/20 disabled:opacity-50"
              title="Refresh dashboard data"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          ACTION REQUIRED / NEXT STEP CALLOUT
      ====================================================== */}
      <section
        className={`ep-card rounded-2xl border-2 p-5 sm:p-6 transition-colors duration-200 animate-fade-up ${nextAction.color}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6 text-[#F4B400]" />
            </div>

            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/70 dark:bg-black/20">
                {nextAction.badge}
              </span>

              <h2 className="text-base sm:text-lg font-bold mt-1 text-gray-900 dark:text-white">
                {nextAction.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
                {nextAction.description}
              </p>
            </div>
          </div>

          <Link
            to={nextAction.actionPath}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#123B5D] hover:bg-[#0F3553] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-colors shrink-0 self-start sm:self-center"
          >
            <span>{nextAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* =====================================================
          SUMMARY STATISTIC CARDS (4 COLUMNS)
      ====================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Admission Status */}
        <div className="ep-card ep-hover-lift rounded-2xl p-5 animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Admission Status
              </p>

              <div className="mt-2.5">
                <StatusBadge
                  status={admissionStatus}
                  label={
                    admissionStatus === 'not_started'
                      ? 'Not Started'
                      : admissionStatus === 'under_review'
                      ? 'Under Review'
                      : undefined
                  }
                />
              </div>

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 truncate">
                {admissionApp?.academic_program?.name ||
                  admissionApp?.program_name ||
                  'No program chosen yet'}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
              <FileText size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Link
              to="/applicant/admission"
              className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] inline-flex items-center gap-1 transition"
            >
              <span>{admissionApp ? 'View Application' : 'Apply Now'}</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 2: Submitted Documents */}
        <div className="ep-card ep-hover-lift rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Submitted Documents
              </p>

              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#123B5D] dark:text-gray-100">
                {documents.length}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {verifiedDocumentsCount > 0
                  ? `${verifiedDocumentsCount} document${verifiedDocumentsCount === 1 ? '' : 's'} verified`
                  : 'Pending verification'}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <FolderOpen size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Link
              to="/applicant/documents"
              className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] inline-flex items-center gap-1 transition"
            >
              <span>Upload / View</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 3: Entrance Exam */}
        <div className="ep-card ep-hover-lift rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Entrance Exam
              </p>

              <p className="mt-2 text-base sm:text-lg font-bold text-[#123B5D] dark:text-gray-100 truncate">
                {assignedExam ? formatDate(assignedExam.exam_date || assignedExam.date) : 'Not Scheduled'}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                {assignedExam ? (assignedExam.venue || 'TMC Campus') : 'Awaiting schedule'}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <GraduationCap size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Link
              to="/applicant/exams"
              className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] inline-flex items-center gap-1 transition"
            >
              <span>Exam Schedule</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 4: Scholarships */}
        <div className="ep-card ep-hover-lift rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Scholarships
              </p>

              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#123B5D] dark:text-gray-100">
                {scholarshipApps.length > 0 ? scholarshipApps.length : activeScholarships.length}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {scholarshipApps.length > 0
                  ? 'Application submitted'
                  : `${activeScholarships.length} grant${activeScholarships.length === 1 ? '' : 's'} available`}
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#D9A900] dark:text-amber-300 flex items-center justify-center shrink-0">
              <Award size={22} strokeWidth={2.2} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Link
              to="/applicant/scholarships"
              className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] inline-flex items-center gap-1 transition"
            >
              <span>Browse Grants</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          TWO COLUMN WORKSPACE
      ====================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: EXAM & SCHOLARSHIPS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ENTRANCE EXAMINATION CARD */}
          <section className="ep-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <GraduationCap size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Entrance Examination Schedule
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Official TMC college admission test appointment
                  </p>
                </div>
              </div>

              <Link
                to="/applicant/exams"
                className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] inline-flex items-center gap-1 transition"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-5 sm:p-6">
              {assignedExam ? (
                <div className="rounded-xl border border-purple-200/60 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200">
                        Assigned Schedule
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                        {assignedExam.title || 'College Admission Test'}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Please arrive 30 minutes prior to your test session.
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                        Session Date
                      </p>
                      <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">
                        {formatDate(assignedExam.exam_date || assignedExam.date)}
                      </p>
                      {(assignedExam.start_time || assignedExam.time) && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {formatTime(assignedExam.start_time || assignedExam.time)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-purple-200/50 dark:border-purple-900/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>
                        <strong>Venue:</strong> {assignedExam.venue || 'Trinidad Municipal College Testing Center'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>
                        <strong>Duration:</strong>{' '}
                        {assignedExam.start_time && assignedExam.end_time
                          ? `${formatTime(assignedExam.start_time)} – ${formatTime(assignedExam.end_time)}`
                          : 'As scheduled'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/30">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Clock3 size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    No Examination Scheduled Yet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                    Once your admission requirements are verified, the Admissions Office will assign
                    your entrance examination schedule.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ACTIVE SCHOLARSHIPS CARD */}
          <section className="ep-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#D9A900] dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Award size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Scholarship Opportunities
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Institutional and government scholarship grants
                  </p>
                </div>
              </div>

              <Link
                to="/applicant/scholarships"
                className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] inline-flex items-center gap-1 transition"
              >
                <span>Explore All</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-5 sm:p-6">
              {activeScholarships.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeScholarships.slice(0, 4).map((grant) => (
                    <div
                      key={grant.id}
                      className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#142738] p-4 flex flex-col justify-between hover:border-[#123B5D]/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {grant.provider || 'TMC Grant'}
                          </span>
                          {grant.amount && (
                            <span className="text-xs font-extrabold text-[#123B5D] dark:text-sky-300">
                              ₱{Number(grant.amount).toLocaleString('en-PH')}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1.5 line-clamp-1">
                          {grant.name}
                        </h3>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {grant.description || 'Institutional grant supporting deserving students.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400">
                          {grant.application_end
                            ? `Deadline: ${formatDate(grant.application_end)}`
                            : 'Open for applicants'}
                        </span>

                        <Link
                          to={`/applicant/scholarships`}
                          className="font-bold text-[#123B5D] dark:text-sky-300 hover:underline"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">
                  No active scholarships currently accepting applications.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: NOTIFICATIONS & QUICK ACTIONS (1 COL) */}
        <div className="space-y-6">
          {/* RECENT NOTIFICATIONS */}
          <section className="ep-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#123B5D] dark:text-sky-300 flex items-center justify-center shrink-0">
                  <Bell size={17} />
                </div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Recent Notifications
                </h2>
              </div>

              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4B400] text-gray-900">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>

            <div className="p-4 divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.length > 0 ? (
                notifications.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          !item.is_read ? 'bg-[#F4B400]' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                  No notifications yet.
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#142738]/50 text-center">
              <Link
                to="/applicant/notifications"
                className="text-xs font-bold text-[#123B5D] dark:text-sky-300 hover:text-[#0F3553] transition"
              >
                View All Notifications
              </Link>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="ep-card rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Quick Actions
            </h2>

            <Link
              to="/applicant/admission"
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-[#142738] hover:border-[#123B5D]/40 transition group"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[#123B5D] dark:text-sky-300" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Admission Application
                </span>
              </div>
              <ChevronRight
                size={15}
                className="text-gray-400  transition"
              />
            </Link>

            <Link
              to="/applicant/documents"
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-[#142738] hover:border-[#123B5D]/40 transition group"
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Upload Required Documents
                </span>
              </div>
              <ChevronRight
                size={15}
                className="text-gray-400  transition"
              />
            </Link>

            <Link
              to="/applicant/programs"
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-[#142738] hover:border-[#123B5D]/40 transition group"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-[#D9A900] dark:text-amber-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Academic Programs
                </span>
              </div>
              <ChevronRight
                size={15}
                className="text-gray-400  transition"
              />
            </Link>

            <Link
              to="/applicant/profile"
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-[#142738] hover:border-[#123B5D]/40 transition group"
            >
              <div className="flex items-center gap-3">
                <UserRound size={18} className="text-[#123B5D] dark:text-sky-300" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Personal Profile
                </span>
              </div>
              <ChevronRight
                size={15}
                className="text-gray-400  transition"
              />
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;