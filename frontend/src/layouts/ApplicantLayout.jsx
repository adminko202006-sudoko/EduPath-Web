
import { useCallback, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import KeepAliveOutlet from '../components/KeepAliveOutlet';
import PullToRefresh from '../components/PullToRefresh';
import ApplicantOnboardingProvider from '../onboarding/ApplicantOnboardingProvider';
import { useAuth } from '../context/useAuth';
import VerificationBanner from '../components/VerificationBanner';

const ApplicantLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <ApplicantOnboardingProvider key={user.id} setMobileMenuOpen={setMobileMenuOpen}>
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
          <PullToRefresh />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-500/[0.045] to-transparent dark:from-blue-500/[0.12]" />

          <div className="relative min-h-full p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1600px] page-transition">
              <VerificationBanner />
              <KeepAliveOutlet />
            </div>
          </div>
        </main>
      </div>
    </div>
    </ApplicantOnboardingProvider>
  );
};

export default ApplicantLayout;
