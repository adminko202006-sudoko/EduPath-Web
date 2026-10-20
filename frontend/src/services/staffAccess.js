// Match Laravel's staff_permissions columns and existing Staff routes.
export const STAFF_FEATURES = [
  { label: 'Admission Applications', path: '/staff/admission-applications', permission: 'manage_admissions' },
  { label: 'Documents', path: '/staff/documents', permission: 'verify_documents' },
  { label: 'Entrance Exams', path: '/staff/exams', permission: 'manage_exams' },
  { label: 'Online Exam Review', path: '/staff/online-exams', permission: 'review_online_exams' },
  { label: 'Scholarship Applications', path: '/staff/scholarship-applications', permission: 'manage_scholarships' },
  { label: 'Announcements', path: '/staff/announcements', permission: 'manage_announcements' },
  { label: 'Notifications', path: '/staff/notifications', permission: 'send_notifications' },
  { label: 'Reports', path: '/staff/reports', permission: 'view_reports' },
];

export const hasStaffPermission = (user, permission) =>
  user?.role === 'staff' && user.staff?.status === 'active' &&
  user.staff?.permissions?.[permission] === true;

export const canAccessStaffPath = (user, pathname) => {
  if (user?.role !== 'staff' || user.staff?.status !== 'active') return false;
  const feature = STAFF_FEATURES.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`));
  return !feature || hasStaffPermission(user, feature.permission);
};

// Drop cached pages and open dialogs when access or program scope changes.
export const staffAccessKey = (user) => JSON.stringify([
  user?.id, user?.staff?.status,
  ...STAFF_FEATURES.map(({ permission }) => hasStaffPermission(user, permission)),
  (user?.staff?.academic_programs || []).map(({ id }) => id).sort((a, b) => a - b),
]);
