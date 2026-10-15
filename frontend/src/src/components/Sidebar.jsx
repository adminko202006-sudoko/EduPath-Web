
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  UserRound,
  GraduationCap,
  Award,
  FileText,
  CalendarDays,
  Megaphone,
  Bell,
  Settings,
  Info,
  BriefcaseBusiness,
  X,
  ChevronRight,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const NAVIGATION = {
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Programs', path: '/admin/programs', icon: BookOpen, permission: 'programs' },
    { label: 'Staff Management', path: '/admin/staff', icon: BriefcaseBusiness, permission: 'staff' },
    { label: 'Requirements', path: '/admin/requirements', icon: ClipboardList, permission: 'requirements' },
    { label: 'Applicants', path: '/admin/applicants', icon: Users, permission: 'applicants' },
    { label: 'Admission Applications', path: '/admin/admission-applications', icon: GraduationCap, permission: 'admission_applications' },
    { label: 'Scholarships', path: '/admin/scholarships', icon: Award, permission: 'scholarships' },
    { label: 'Scholarship Applications', path: '/admin/scholarship-applications', icon: FileText, permission: 'scholarship_applications' },
    { label: 'Entrance Exams', path: '/admin/exams', icon: CalendarDays, permission: 'exams' },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone, permission: 'announcements' },
    { label: 'Documents', path: '/admin/documents', icon: FileText, permission: 'documents' },
    { label: 'My Profile', path: '/admin/profile', icon: UserRound },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
    { label: 'About EduPath', path: '/admin/about', icon: Info },
  ],

  staff: [
    { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'Programs', path: '/staff/programs', icon: BookOpen, permission: 'programs' },
    { label: 'Requirements', path: '/staff/requirements', icon: ClipboardList, permission: 'requirements' },
    { label: 'Applicants', path: '/staff/applicants', icon: Users, permission: 'applicants' },
    { label: 'Admission Applications', path: '/staff/admission-applications', icon: GraduationCap, permission: 'admission_applications' },
    { label: 'Scholarships', path: '/staff/scholarships', icon: Award, permission: 'scholarships' },
    { label: 'Scholarship Applications', path: '/staff/scholarship-applications', icon: FileText, permission: 'scholarship_applications' },
    { label: 'Entrance Exams', path: '/staff/exams', icon: CalendarDays, permission: 'exams' },
    { label: 'Announcements', path: '/staff/announcements', icon: Megaphone, permission: 'announcements' },
    { label: 'Documents', path: '/staff/documents', icon: FileText, permission: 'documents' },
    { label: 'My Profile', path: '/staff/profile', icon: UserRound },
    { label: 'Settings', path: '/staff/settings', icon: Settings },
    { label: 'About EduPath', path: '/staff/about', icon: Info },
  ],

  applicant: [
    { label: 'Dashboard', path: '/applicant/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/applicant/profile', icon: UserRound },
    { label: 'Programs', path: '/applicant/programs', icon: BookOpen },
    { label: 'Admission Application', path: '/applicant/admission', icon: GraduationCap },
    { label: 'My Documents', path: '/applicant/documents', icon: ClipboardList },
    { label: 'Scholarships', path: '/applicant/scholarships', icon: Award },
    { label: 'Scholarship Applications', path: '/applicant/scholarship-applications', icon: FileText },
    { label: 'Entrance Exams', path: '/applicant/exams', icon: CalendarDays },
    { label: 'Notifications', path: '/applicant/notifications', icon: Bell, notifications: true },
    { label: 'Announcements', path: '/applicant/announcements', icon: Megaphone },
    { label: 'Settings', path: '/applicant/settings', icon: Settings },
    { label: 'About EduPath', path: '/applicant/about', icon: Info },
  ],
};

const ROLE_DETAILS = {
  admin: {
    label: 'Administrator',
    description: 'System management',
    icon: ShieldCheck,
  },
  staff: {
    label: 'Staff Portal',
    description: 'Office workspace',
    icon: BriefcaseBusiness,
  },
  applicant: {
    label: 'Applicant Portal',
    description: 'Your admission journey',
    icon: GraduationCap,
  },
};

const Sidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const { user, token } = useAuth();
  const location = useLocation();

  const role = user?.role?.toLowerCase() || 'applicant';
  const roleDetails = ROLE_DETAILS[role] || ROLE_DETAILS.applicant;

  const [unreadCount, setUnreadCount] = useState(0);

  const staffPermissions =
    user?.staff?.permissions ||
    user?.staff?.permission ||
    {};

  const navigationItems = useMemo(() => {
    const items = NAVIGATION[role] || NAVIGATION.applicant;

    if (role !== 'staff') {
      return items;
    }

    return items.filter((item) => {
      if (!item.permission) return true;

      // Keep the existing permission model: staff only see authorized sections.
      return Boolean(staffPermissions[item.permission]);
    });
  }, [role, staffPermissions]);

  const fetchUnreadNotifications = useCallback(async () => {
    if (role !== 'applicant' || !token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/applicant/notifications',
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const result = await response.json();

      const notifications = Array.isArray(result)
        ? result
        : result?.data || result?.notifications || [];

      setUnreadCount(
        notifications.filter(
          (notification) =>
            notification.is_read === false ||
            notification.is_read === 0 ||
            notification.is_read === '0'
        ).length
      );
    } catch (error) {
      console.error('Unable to load notification count:', error);
    }
  }, [role, token]);

  useEffect(() => {
    fetchUnreadNotifications();

    if (role !== 'applicant' || !token) return undefined;

    const intervalId = window.setInterval(fetchUnreadNotifications, 30000);

    const handleNotificationsUpdated = () => {
      fetchUnreadNotifications();
    };

    window.addEventListener(
      'notificationsUpdated',
      handleNotificationsUpdated
    );

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        'notificationsUpdated',
        handleNotificationsUpdated
      );
    };
  }, [fetchUnreadNotifications, role, token]);

  useEffect(() => {
    onCloseMobile();
  }, [location.pathname]);

  const isActiveRoute = (path) => {
    if (path.endsWith('/dashboard')) {
      return location.pathname === path;
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const renderNavigation = () => (
    <nav
      aria-label="Main navigation"
      className="space-y-1.5"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveRoute(item.path);

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            aria-current={active ? 'page' : undefined}
            className={() =>
              `
                group relative flex min-h-[46px] items-center gap-3
                overflow-hidden rounded-xl px-3 py-2.5
                text-[13px] font-semibold
                transition-colors duration-200
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-teal-500
                ${
                  active
                    ? 'bg-gradient-to-r from-[#123B5D] to-[#15536B] text-white shadow-md shadow-[#123B5D]/15 dark:from-teal-500/15 dark:to-blue-500/10 dark:text-teal-300 dark:shadow-none'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#123B5D] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                }
              `
            }
          >
            {active && (
              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#F4B400]" />
            )}

            <span
              className={`
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-lg transition-colors duration-200
                ${
                  active
                    ? 'bg-white/10 text-white dark:bg-teal-400/10 dark:text-teal-300'
                    : 'text-slate-400 group-hover:bg-white group-hover:text-[#123B5D] dark:text-slate-500 dark:group-hover:bg-slate-700 dark:group-hover:text-teal-300'
                }
              `}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.9} />
            </span>

            <span className="min-w-0 flex-1 truncate">
              {item.label}
            </span>

            {item.notifications && unreadCount > 0 && (
              <span
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}

            {!item.notifications && active && (
              <ChevronRight
                size={15}
                className="shrink-0 text-white/70 dark:text-teal-300"
              />
            )}

            {!active && item.notifications && unreadCount > 0 && (
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0B1A29]"
                aria-hidden="true"
              />
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`
          fixed bottom-0 left-0 top-20 z-[70]
          flex w-[280px] flex-col
          border-r border-slate-200/80
          bg-white transition-colors duration-200 ease-out
          dark:border-slate-800 dark:bg-[#0B1A29]
          lg:sticky lg:top-20 lg:z-30
          lg:h-[calc(100vh-80px)] lg:translate-x-0
          ${
            mobileOpen
              ? 'translate-x-0 shadow-2xl shadow-black/20'
              : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
        {/* Mobile sidebar header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Navigation
          </span>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        {/* Role information */}
        <div className="shrink-0 px-4 pb-4 pt-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/70 p-3.5 dark:border-slate-700/80 dark:from-[#102438] dark:via-[#102235] dark:to-teal-950/30">
            <div className="pointer-events-none absolute -right-5 -top-8 h-24 w-24 rounded-full bg-teal-400/10 blur-2xl" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-teal-600 text-white shadow-md shadow-teal-900/10">
                <roleDetails.icon size={20} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {roleDetails.label}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {roleDetails.description}
                </p>
              </div>

              <span
                className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"
                title="Portal active"
              />
            </div>
          </div>
        </div>

        {/* Scrollable links */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
          <div className="mb-2 flex items-center justify-between px-3 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Workspace
            </span>

            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
              {navigationItems.length} sections
            </span>
          </div>

          {renderNavigation()}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#123B5D] dark:border-slate-700 dark:bg-slate-800 dark:text-teal-300">
              <CircleHelp size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Need assistance?
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                Trinidad Municipal College
              </p>
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-600">
            EduPath <span className="text-teal-600 dark:text-teal-400">•</span> TMC
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
