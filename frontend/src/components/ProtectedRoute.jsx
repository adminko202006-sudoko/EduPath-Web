import ErrorMessage from './ui/ErrorMessage';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading, sessionError, retrySession } = useAuth();

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F7FA] px-4 text-slate-800 transition-colors duration-200 dark:bg-[#071521] dark:text-slate-100">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-400/[0.07]" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-400/[0.05]" />
        </div>

        {/* Loading card */}
        <div className="relative w-full max-w-sm animate-fade-up rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-center shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0D2030]/95 dark:shadow-black/20 sm:p-10">
          {/* Animated logo */}
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#123B5D] dark:border-white/10 dark:border-t-[#F4B400]" />

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#123B5D] to-teal-700 text-xl font-extrabold text-white shadow-lg shadow-[#123B5D]/20 dark:from-[#123B5D] dark:to-[#0F766E]">
              E
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-[#123B5D] dark:text-white">
            EduPath
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Checking your session...
          </p>

          {/* Skeleton loading */}
          <div className="mt-8 space-y-3" aria-hidden="true">
            <div className="h-2 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/70" />
            <div className="mx-auto h-2 w-4/5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/70" />
            <div className="mx-auto h-2 w-3/5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700/70" />
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
            Securely verifying access
          </div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <ErrorMessage message={sessionError}><main className="flex min-h-screen items-center justify-center bg-[#F4F7FA] p-4 text-[#123B5D] dark:bg-[#071521] dark:text-slate-100">
        <section role="alert" className="ep-card w-full max-w-lg space-y-5 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-300">Trinidad Municipal College · EduPath</p>
          <h1 className="text-2xl font-bold">Unable to verify your session</h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{sessionError}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={retrySession} className="rounded-xl bg-[#123B5D] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B2941]">Try again</button>
            <Link to="/login" className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-600">Go to sign in</Link>
          </div>
        </section>
      </main></ErrorMessage>
    );
  }

  // Redirect unauthenticated users to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Keep users within their assigned role's dashboard.
  if (role && user.role !== role) {
    const dashboardByRole = {
      admin: '/admin/dashboard',
      staff: '/staff/dashboard',
      applicant: '/applicant/dashboard',
    };

    return (
      <Navigate
        to={dashboardByRole[user.role] || '/login'}
        replace
      />
    );
  }

  // Render protected content when authentication and role checks pass.
  return children;
};

export default ProtectedRoute;
