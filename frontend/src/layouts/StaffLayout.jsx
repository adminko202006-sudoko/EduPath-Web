import ErrorMessage from '../components/ui/ErrorMessage';

import { useCallback, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import KeepAliveOutlet from '../components/KeepAliveOutlet';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { canAccessStaffPath, staffAccessKey } from '../services/staffAccess';

const StaffLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, staffAccessError } = useAuth();
  const { pathname } = useLocation();
  const allowed = canAccessStaffPath(user, pathname);
  const needsPrograms = ['/staff/admission-applications', '/staff/documents', '/staff/exams', '/staff/scholarship-applications', '/staff/notifications', '/staff/reports'].includes(pathname);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="ep-workspace flex h-screen flex-col overflow-hidden bg-[#f4f7fa] text-slate-800 transition-colors duration-200 dark:bg-[#020d26] dark:text-slate-100">
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen((previous) => !previous)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={closeMobileMenu}
        />

        <main
          id="main-content"
          className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-500/[0.045] to-transparent dark:from-blue-500/[0.12]" />

          <div className="relative min-h-full p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px] page-transition">
              {staffAccessError && <ErrorMessage message={staffAccessError}><p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{staffAccessError}</p></ErrorMessage>}
              {allowed && needsPrograms && !user?.staff?.academic_programs?.length && <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">No academic programs are assigned to your account. This feature is enabled, but applicant records remain unavailable until Admin assigns the programs you serve in Staff Management.</p>}
              {allowed ? <KeepAliveOutlet key={staffAccessKey(user)} /> : (
                <section role="alert" className="ep-card space-y-4 p-6">
                  <h1 className="text-xl font-bold">Staff access unavailable</h1>
                  <p>{user?.staff?.status === 'active' ? 'Your administrator has not enabled this feature for your account. Contact the administrator to review your permissions.' : 'Your staff profile is missing or inactive. Contact the administrator.'}</p>
                  {user?.staff?.status === 'active' && <Link className="inline-block font-semibold text-teal-700 underline dark:text-teal-300" to="/staff/dashboard">Return to Dashboard</Link>}
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
