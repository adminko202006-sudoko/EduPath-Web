import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { EmptyState, ErrorState } from '../../components/ui/Shared';

import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Search,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const Programs = () => {
  const { token } = useAuth();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  /* ==========================================
     LOAD PROGRAMS
  ========================================== */
  const loadPrograms = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/applicant/programs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      setPrograms(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load programs:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load academic programs. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPrograms();
    }
  }, [token]);

  /* ==========================================
     FILTER PROGRAMS
  ========================================== */
  const filteredPrograms = useMemo(() => {
    if (!searchTerm.trim()) return programs;
    const term = searchTerm.toLowerCase();
    return programs.filter(
      (prog) =>
        prog.name?.toLowerCase().includes(term) ||
        prog.code?.toLowerCase().includes(term) ||
        prog.description?.toLowerCase().includes(term)
    );
  }, [programs, searchTerm]);

  /* ==========================================
     SKELETON LOADING
  ========================================== */
  if (loading) {
    return (
      <div className="space-y-6 page-transition">
        {/* HERO SKELETON */}
        <div className="ep-skeleton relative overflow-hidden rounded-2xl p-6 sm:p-8">
          <div className="h-6 w-36 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 h-9 w-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-full max-w-xl rounded bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* SEARCH BAR SKELETON */}
        <div className="ep-card rounded-2xl p-4 flex items-center justify-between">
          <div className="ep-skeleton h-10 w-72 rounded-xl" />
          <div className="ep-skeleton h-10 w-32 rounded-xl" />
        </div>

        {/* PROGRAM CARDS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ep-card rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="ep-skeleton h-6 w-20 rounded-md" />
                <div className="ep-skeleton h-5 w-24 rounded-full" />
              </div>
              <div className="ep-skeleton h-6 w-3/4 rounded" />
              <div className="space-y-2">
                <div className="ep-skeleton h-4 w-full rounded" />
                <div className="ep-skeleton h-4 w-5/6 rounded" />
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <div className="ep-skeleton h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              <GraduationCap className="h-3.5 w-3.5 text-[#F4B400]" />
              <span>Trinidad Municipal College • Academic Offerings</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Academic Programs
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Explore our degree programs and technical courses. Choose your desired course to
              review admission requirements and proceed with your application.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPrograms(true)}
            disabled={refreshing}
            className="self-start lg:self-center inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh List'}</span>
          </button>
        </div>
      </section>

      {/* =====================================================
          ERROR STATE
      ====================================================== */}
      {error && (
        <ErrorState message={error} onRetry={() => loadPrograms(true)} />
      )}

      {/* =====================================================
          SEARCH & STATS BAR
      ====================================================== */}
      <section className="ep-card rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by program name or code (e.g. BSIT)..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/80 py-2.5 pl-10 pr-4 text-sm text-gray-800 dark:text-gray-100 outline-none transition placeholder:text-gray-400 focus:border-[#123B5D] focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#123B5D]/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Showing {filteredPrograms.length} of {programs.length} programs
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROGRAM LISTINGS
      ====================================================== */}
      {filteredPrograms.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? 'No matching programs found' : 'No academic programs available'}
          description={
            searchTerm
              ? `No courses matched "${searchTerm}". Try a different search keyword.`
              : 'There are currently no active academic programs listed.'
          }
          actionLabel={searchTerm ? 'Clear Search' : undefined}
          onAction={searchTerm ? () => setSearchTerm('') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="ep-card ep-hover-lift rounded-2xl p-6 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-[#123B5D]/10 text-[#123B5D] dark:bg-sky-400/10 dark:text-sky-300">
                    {program.code || 'DEGREE'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                    <CheckCircle2 size={12} />
                    <span>Open</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-3 leading-snug">
                  {program.name}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3 leading-relaxed">
                  {program.description ||
                    'Comprehensive academic program designed to develop practical competence and career readiness.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-400">
                  Trinidad Municipal College
                </span>

                <Link
                  to="/applicant/admission"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#123B5D] hover:bg-[#0F3553] text-white text-xs font-bold shadow-sm hover:shadow transition shrink-0"
                >
                  <span>Apply Now</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Programs;
