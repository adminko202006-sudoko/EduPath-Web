
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  BriefcaseBusiness,
  Info,
  Menu,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
  LayoutDashboard,
  UserCircle,
} from 'lucide-react';

import { useAuth } from '../context/useAuth';
import ThemeToggle from './ThemeToggle';
import { ConfirmDialogHost } from './ui/ConfirmDialog';
import { useConfirmDialog } from './ui/useConfirmDialog';
import tmcLogo from '../assets/tmcLogo.jpg';
import { getServerBaseUrl } from '../services/api';
import { resolveAccountPhoto } from '../services/profilePhoto';

const ROLE_CONFIG = {
  admin: {
    label: 'Administrator',
    icon: ShieldCheck,
    dashboard: '/admin/dashboard',
  },
  staff: {
    label: 'Staff Member',
    icon: BriefcaseBusiness,
    dashboard: '/staff/dashboard',
  },
  applicant: {
    label: 'Applicant',
    icon: GraduationCap,
    dashboard: '/applicant/dashboard',
  },
};

const Navbar = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const dropdownRef = useRef(null);
  const { confirm, dialog } = useConfirmDialog();

  const role = user?.role?.toLowerCase() || 'applicant';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.applicant;
  const RoleIcon = roleConfig.icon;

  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'EduPath User';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const profilePhotoUrl = resolveAccountPhoto(user, getServerBaseUrl());

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);

    const confirmed = await confirm({
      title: 'Log out of EduPath?',
      message: 'You will need to sign in again to access your account.',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      destructive: false,
    });

    if (!confirmed) {
      return;
    }

    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="ep-topbar sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#091827]/95 dark:shadow-black/10">
      {/* Brand accent */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#123B5D] via-teal-500 to-[#F4B400]" />

      <div className="ep-topbar-inner flex h-[77px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand and mobile navigation */}
        <div className="ep-topbar-brand flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            data-tutorial-target={role === 'applicant' ? 'applicant-mobile-menu' : undefined}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors duration-200 hover:border-teal-500/40 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-teal-400/40 dark:hover:bg-slate-700 lg:hidden"
          >
            <Menu size={21} />
          </button>

          <Link
            to={roleConfig.dashboard}
            className="ep-topbar-logo group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="EduPath dashboard"
          >
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-teal-500/20 to-[#F4B400]/20 opacity-0 blur-sm transition-opacity duration-200 group-hover:opacity-100" />

              <img
                src={tmcLogo}
                alt="Trinidad Municipal College logo"
                className="relative h-11 w-11 rounded-xl border border-slate-200 bg-white object-contain p-1 shadow-sm transition-transform duration-200 dark:border-slate-700 dark:bg-slate-100 sm:h-12 sm:w-12"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-lg font-extrabold tracking-tight text-[#123B5D] dark:text-white sm:text-xl">
                  Edu<span className="text-teal-600 dark:text-teal-400">Path</span>
                </span>

                <span className="hidden rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-700 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300 sm:inline-flex">
                  TMC
                </span>
              </div>

              <p className="hidden truncate text-[10px] font-medium tracking-wide text-slate-500 dark:text-slate-400 sm:block sm:text-[11px]">
                Admission &amp; Scholarship Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Right-side actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-[#123B5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Info size={17} />
              <span>About Us</span>
            </Link>
          </div>

          <ThemeToggle />

          {/* User profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((previous) => !previous)}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              aria-label="Open user account menu"
              className={`ep-account-trigger group flex h-11 items-center gap-2 rounded-xl border px-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:gap-3 sm:px-3 ${
                dropdownOpen
                  ? 'border-teal-500/40 bg-teal-50 dark:border-teal-400/30 dark:bg-teal-400/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-slate-600 dark:hover:bg-slate-800'
              }`}
            >
              <div className="ep-account-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#123B5D] to-teal-600 text-xs font-bold text-white shadow-sm">
                {profilePhotoUrl && failedPhoto !== profilePhotoUrl ? <img src={profilePhotoUrl} alt="" onError={() => setFailedPhoto(profilePhotoUrl)} className="h-full w-full rounded-full object-cover" /> : initials || <UserCircle size={18} />}
              </div>

              <span className="ep-account-mobile-label text-[10px] font-semibold text-[#123B5D] dark:text-slate-100 sm:hidden">Profile</span>

              <div className="hidden max-w-[150px] text-left sm:block">
                <p className="truncate text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">
                  {displayName}
                </p>
                <div className="flex items-center gap-1">
                  <RoleIcon
                    size={11}
                    className="text-teal-600 dark:text-teal-400"
                  />
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    My Profile <span aria-hidden="true">·</span> {roleConfig.label}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                className="ep-account-menu absolute right-0 top-[calc(100%+12px)] z-[60] w-[min(19rem,calc(100vw-2rem))] origin-top-right animate-fade-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-[#102235] dark:shadow-black/30"
              >
                {/* Account identity */}
                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-4 dark:border-slate-700 dark:from-[#132b40] dark:to-[#102235]">
                  <div className="flex items-center gap-3">
                    <div className="ep-account-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#123B5D] to-teal-600 text-sm font-bold text-white shadow-sm">
                      {profilePhotoUrl && failedPhoto !== profilePhotoUrl ? <img src={profilePhotoUrl} alt="" onError={() => setFailedPhoto(profilePhotoUrl)} className="h-full w-full rounded-full object-cover" /> : initials || <UserCircle size={21} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user?.email || 'EduPath account'}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-300">
                        <RoleIcon size={11} />
                        {roleConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account links */}
                <div className="space-y-1 p-2">
                  <Link
                    to={roleConfig.dashboard}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#123B5D] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <LayoutDashboard
                      size={17}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    Dashboard
                  </Link>

                  <Link
                    to={`/${role}/profile`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#123B5D] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <UserRound
                      size={17}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    My Profile
                  </Link>

                  <Link
                    to={`/${role}/settings`}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#123B5D] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Settings
                      size={17}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    Account Settings
                  </Link>

                  <Link
                    to="/about"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#123B5D] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
                  >
                    <Info
                      size={17}
                      className="text-slate-400 dark:text-slate-500"
                    />
                    About EduPath
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t border-slate-100 p-2 dark:border-slate-700">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-400 dark:hover:bg-rose-400/10"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialogHost dialog={dialog} />
    </header>
  );
};

export default Navbar;
