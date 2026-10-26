import ErrorMessage from '../../components/ui/ErrorMessage';
import useNotificationPreferences from '../../hooks/useNotificationPreferences';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';

import {
  User,
  LockKeyhole,
  Bell,
  Palette,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileCheck2,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  Save,
  Sun,
  Moon,
  MonitorCheck,
  Shield,
  Loader2,
} from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="ep-page-banner relative overflow-hidden rounded-2xl ep-brand-gradient shadow-lg">
    <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
    <div className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

    <div className="relative p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
          <Icon size={24} className="text-white" />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            {title}
          </h2>

          <p className="text-blue-100 text-sm mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ToggleSwitch = ({ enabled, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    role="switch"
    aria-checked={enabled}
    aria-label={
      enabled
        ? 'Disable notification'
        : 'Enable notification'
    }
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        enabled
          ? 'bg-[#123B5D] dark:bg-blue-500'
          : 'bg-gray-300 dark:bg-slate-600'
      }`}
  >
    <span
      className={"absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 " + (
        enabled ? "translate-x-7" : "translate-x-1"
      )}
    />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();  // =========================
  // PASSWORD STATES
  // =========================
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');

  const [newPassword, setNewPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [passwordError, setPasswordError] = useState('');

  // =========================
  // NOTIFICATION STATES
  // =========================
  const [
    showNotificationPreferences,
    setShowNotificationPreferences,
  ] = useState(false);

  const { notifications, notificationSaved, setNotificationSaved, notificationError, notificationBusy, handleNotificationChange, handleSaveNotifications, reloadNotifications } = useNotificationPreferences();

  // =========================
  // APPEARANCE STATES (shared across all portals)
  // =========================
  const { theme: appearance, setTheme: setAppearance } = useTheme();
  const [showAppearance, setShowAppearance] = useState(false);

  // =========================
  // SECURITY STATE
  // =========================
  const [showSecurity, setShowSecurity] = useState(false);

  // =========================
  // SETTINGS ITEMS
  // =========================
  const settingsItems = [
    {
      icon: User,
      title: 'Account Information',
      description:
        'View your administrator account information',
    },
    {
      icon: LockKeyhole,
      title: 'Change Password',
      description:
        'Update your administrator account password',
    },
    {
      icon: Bell,
      title: 'Notification Preferences',
      description:
        'Choose which administrator notifications you receive',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description:
        'Customize how the EduPath admin panel looks',
    },
    {
      icon: ShieldCheck,
      title: 'Security',
      description:
        'Review and manage account security',
    },
  ];

  // =========================
  // SETTING CLICK HANDLER
  // =========================
  const handleSettingClick = (title) => {
    if (title === 'Account Information') {
      setShowPasswordForm(false);
      setShowNotificationPreferences(false);
      setShowAppearance(false);
      setShowSecurity(false);

      return;
    }

    if (title === 'Change Password') {
      setShowPasswordForm(
        (current) => !current
      );

      setShowNotificationPreferences(false);
      setShowAppearance(false);
      setShowSecurity(false);

      setPasswordSuccess('');
      setPasswordError('');

      return;
    }

    if (title === 'Notification Preferences') {
      setShowNotificationPreferences(
        (current) => !current
      );

      setShowPasswordForm(false);
      setShowAppearance(false);
      setShowSecurity(false);

      setNotificationSaved(false);

      return;
    }

    if (title === 'Appearance') {
      setShowAppearance(
        (current) => !current
      );

      setShowPasswordForm(false);
      setShowNotificationPreferences(false);
      setShowSecurity(false);

      setPasswordSuccess('');
      setPasswordError('');
      setNotificationSaved(false);

      return;
    }

    if (title === 'Security') {
      setShowSecurity(
        (current) => !current
      );

      setShowPasswordForm(false);
      setShowNotificationPreferences(false);
      setShowAppearance(false);

      setPasswordSuccess('');
      setPasswordError('');
      setNotificationSaved(false);
    }
  };

  // =========================
  // PASSWORD HANDLER
  // =========================
  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(
        'New password must be at least 8 characters.'
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        'New password and confirmation password do not match.'
      );

      return;
    }

    try {
      setPasswordLoading(true);

      await api.put(
        '/auth/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation:
            confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPasswordSuccess(
        'Password changed successfully.'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors
          ?.current_password?.[0] ||
        error.response?.data?.errors
          ?.new_password?.[0] ||
        'Unable to change password. Please try again.';

      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================
  // NOTIFICATION HANDLERS
  // =========================

  // =========================
  // APPEARANCE HANDLER
  // =========================
  const handleAppearanceChange = (mode) => {
    setAppearance(mode);
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="space-y-6 pb-8 page-transition">

      {/* =========================
          HERO
      ========================= */}



      {/* =========================
          SETTINGS MENU
      ========================= */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        {settingsItems.map(
          (item, index) => {
            const Icon = item.icon;

            return (
              <div key={item.title}>

                <button
                  type="button"
                  onClick={() =>
                    handleSettingClick(
                      item.title
                    )
                  }
                  className="w-full flex items-center gap-4 px-5 sm:px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors duration-200"
                >

                  <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 text-[#123B5D] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon size={21} />
                  </div>

                  <div className="flex-1 min-w-0">

                    <h3 className="font-bold text-gray-800 dark:text-white">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {item.description}
                    </p>

                  </div>

                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-slate-500 shrink-0"
                  />

                </button>

                {index <
                  settingsItems.length - 1 && (
                  <div className="border-b border-gray-100 dark:border-slate-700 ml-[76px]" />
                )}

              </div>
            );
          }
        )}

      </div>

      {/* =========================
          ACCOUNT INFORMATION
      ========================= */}
      <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

      <SectionHeader
        icon={User}
        title="Account Information"
        description="View your EduPath administrator account details."
      />

        <div className="p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <InfoField
              label="Name"
              value={
                user?.name ||
                'Administrator'
              }
            />

            <InfoField
              label="Email"
              value={
                user?.email ||
                'No email available'
              }
            />

            <InfoField
              label="Account Role"
              value={
                user?.role ||
                'Administrator'
              }
              capitalize
            />

            <div>

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Account Status
              </label>

              <div className="w-full border border-green-200 dark:border-green-500/20 rounded-xl px-4 py-3 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 flex items-center gap-2 font-semibold">
                <CheckCircle2 size={17} />
                Active
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* =========================
          CHANGE PASSWORD
      ========================= */}
      {showPasswordForm && (
        <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

      <SectionHeader
        icon={LockKeyhole}
        title="Change Password"
        description="Update your administrator account password."
      />

          <div className="p-6">

            {passwordSuccess && (
              <AlertBox
                type="success"
                message={passwordSuccess}
              />
            )}

            {passwordError && (
              <ErrorMessage message={passwordError}>
              <AlertBox
                type="error"
                message={passwordError}
              />
              </ErrorMessage>
            )}

            <form
              onSubmit={
                handleChangePassword
              }
              className="space-y-5"
            >

              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                show={showCurrentPassword}
                onToggle={() =>
                  setShowCurrentPassword(
                    (current) => !current
                  )
                }
                placeholder="Enter current password"
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                show={showNewPassword}
                onToggle={() =>
                  setShowNewPassword(
                    (current) => !current
                  )
                }
                placeholder="Enter new password"
                minLength={8}
                hint="Password must be at least 8 characters."
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                show={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword(
                    (current) => !current
                  )
                }
                placeholder="Confirm new password"
              />

              <div className="flex justify-end pt-2">

                <button
                  type="submit"
                  disabled={
                    passwordLoading
                  }
                  className="inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
                >

                  {passwordLoading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <KeyRound size={17} />
                  )}

                  {passwordLoading
                    ? 'Changing Password...'
                    : 'Change Password'}

                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================
          NOTIFICATION PREFERENCES
      ========================= */}
      {showNotificationPreferences && (
        <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

        <SectionHeader
          icon={Bell}
          title="Notification Preferences"
          description="Choose which EduPath notifications you want to receive."
        />

          <div className="p-6">

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Preferences are saved to your account and control push delivery. In-app records remain available.</p>
            {notificationError && <ErrorMessage message={notificationError}><div role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{notificationError} <button type="button" onClick={reloadNotifications} className="underline">Reload preferences</button></div></ErrorMessage>}
            {notificationBusy && !notificationError && <p role="status" className="mb-4 text-sm">Loading or saving preferences…</p>}
            {notificationSaved && (
              <AlertBox
                type="success"
                message="Notification preferences saved successfully."
              />
            )}

            <div className="space-y-1">

              {[
                {
                  key: 'applicationStatus',
                  icon: FileCheck2,
                  title: 'Application Status',
                  description:
                    'Receive updates when admission applications require administrative attention.',
                },
                {
                  key: 'scholarshipUpdates',
                  icon: GraduationCap,
                  title: 'Scholarship Updates',
                  description:
                    'Receive updates about scholarship applications and applicant activity.',
                },
                {
                  key: 'entranceExamUpdates',
                  icon: ClipboardCheck,
                  title: 'Entrance Exam Updates',
                  description:
                    'Receive updates about entrance examination schedules and assignments.',
                },
                {
                  key: 'announcements',
                  icon: Megaphone,
                  title: 'Announcements',
                  description:
                    'Receive updates about announcements published by Trinidad Municipal College.',
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                  >

                    <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 text-[#123B5D] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon size={19} />
                    </div>

                    <div className="flex-1 min-w-0">

                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {item.title}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>

                    </div>

                    <ToggleSwitch
                      disabled={notificationBusy}
                      enabled={
                        notifications[
                          item.key
                        ]
                      }
                      onClick={() =>
                        handleNotificationChange(
                          item.key
                        )
                      }
                    />

                  </div>
                );
              })}

            </div>

            <div className="flex justify-end pt-6">

              <button
                type="button"
                onClick={
                  handleSaveNotifications
                }
                disabled={notificationBusy}
                className="inline-flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
              >
                <Save size={17} />
                Save Preferences
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =========================
          APPEARANCE
      ========================= */}
      {showAppearance && (
        <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

      <SectionHeader
        icon={Palette}
        title="Appearance"
        description="Choose how EduPath looks on your device."
      />
          <div className="p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* LIGHT MODE */}
              <button
                type="button"
                onClick={() =>
                  handleAppearanceChange(
                    'light'
                  )
                }                 className={"relative text-left rounded-2xl border-2 p-5 transition-colors duration-200 " + (
                   appearance === 'light'
                     ? 'border-[#123B5D] bg-[#123B5D]/5 dark:bg-blue-500/10 shadow-md'
                     : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                 )}
              >

                {appearance ===
                  'light' && (
                  <div className="absolute top-4 right-4 text-[#123B5D] dark:text-blue-400">
                    <CheckCircle2
                      size={21}
                    />
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-[#D9A900] dark:text-amber-400 flex items-center justify-center mb-4">
                  <Sun size={24} />
                </div>

                <h3 className="font-bold text-gray-800 dark:text-white">
                  Light Mode
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 pr-5">
                  Use the standard bright EduPath administrator interface.
                </p>

                <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-3">

                  <div className="flex gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>

                  <div className="h-2 w-3/4 rounded-full bg-gray-200 dark:bg-slate-700 mb-2" />
                  <div className="h-2 w-1/2 rounded-full bg-gray-100 dark:bg-slate-800" />

                </div>

              </button>

              {/* DARK MODE */}
              <button
                type="button"
                onClick={() =>
                  handleAppearanceChange(
                    'dark'
                  )
                }                 className={"relative text-left rounded-2xl border-2 p-5 transition-colors duration-200 " + (
                   appearance === 'dark'
                     ? 'border-blue-500 bg-blue-500/10 shadow-md'
                     : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                 )}
              >

                {appearance ===
                  'dark' && (
                  <div className="absolute top-4 right-4 text-blue-400">
                    <CheckCircle2
                      size={21}
                    />
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center mb-4">
                  <Moon size={24} />
                </div>

                <h3 className="font-bold text-gray-800 dark:text-white">
                  Dark Mode
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 pr-5">
                  Use a darker interface that is easier on the eyes.
                </p>

                <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3">

                  <div className="flex gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>

                  <div className="h-2 w-3/4 rounded-full bg-slate-700 mb-2" />
                  <div className="h-2 w-1/2 rounded-full bg-slate-800" />

                </div>

              </button>

            </div>

            <div className="mt-5 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">

              <CheckCircle2
                size={17}
                className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
              />

              <span>
                Your administrator appearance preference is saved automatically and applies across the EduPath admin interface.
              </span>

            </div>

          </div>
        </div>
      )}

      {/* =========================
          SECURITY
      ========================= */}
      {showSecurity && (
        <div className="ep-card overflow-hidden rounded-2xl animate-fade-up">

      <SectionHeader
        icon={Shield}
        title="Security"
        description="Review security information for your administrator account."
      />

          <div className="p-6">

            <div className="space-y-4">

              {/* PASSWORD SECURITY */}
              <SecurityItem
                icon={KeyRound}
                iconBg="bg-green-50 dark:bg-green-500/10"
                iconClass="text-green-600 dark:text-green-400"
                title="Password Security"
                description="Your administrator account is protected by a password."
                status="Protected"
                statusClass="text-green-600 dark:text-green-400"
              />

              {/* SESSION SECURITY */}
              <SecurityItem
                icon={MonitorCheck}
                iconBg="bg-blue-50 dark:bg-blue-500/10"
                iconClass="text-blue-600 dark:text-blue-400"
                title="Current Session"
                description="You are currently signed in to your EduPath administrator account."
                status="Active"
                statusClass="text-blue-600 dark:text-blue-400"
              />

              {/* ACCOUNT PROTECTION */}
              <SecurityItem
                icon={Shield}
                iconBg="bg-purple-50 dark:bg-purple-500/10"
                iconClass="text-purple-600 dark:text-purple-400"
                title="Account Protection"
                description="Never share your administrator password or authentication token with anyone."
              />

            </div>

            {/* SECURITY ACTIONS */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">

              <h3 className="font-bold text-gray-800 dark:text-white mb-3">
                Security Actions
              </h3>

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowSecurity(false);
                    setShowPasswordForm(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold transition-colors"
                >
                  <KeyRound size={17} />
                  Change Password
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-500/20 hover:border-red-600 px-5 py-3 rounded-xl font-semibold transition-colors"
                >
                  <LogOut size={17} />
                  Logout
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* =========================
          LOGOUT
      ========================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-500/20 shadow-md overflow-hidden animate-fade-up">

        <div className="p-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            <div className="flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <LogOut size={21} />
              </div>

              <div>

                <h2 className="font-bold text-gray-800 dark:text-white">
                  Logout
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sign out of your EduPath administrator account.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white border border-red-200 dark:border-red-500/20 hover:border-red-600 px-5 py-3 rounded-xl font-semibold transition-colors"
            >
              <LogOut size={17} />
              Logout
            </button>

          </div>

        </div>
      </div>

    </div>
  );
};



/* =========================================================
   INFO FIELD
========================================================= */

const InfoField = ({
  label,
  value,
  capitalize = false,
}) => (
  <div>

    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
      {label}
    </label>

    <div
      className={`w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 ${
        capitalize
          ? 'capitalize'
          : ''
      }`}
    >
      {value}
    </div>

  </div>
);

/* =========================================================
   PASSWORD FIELD
========================================================= */

const PasswordField = ({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  minLength,
  hint,
}) => (
  <div>

    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
      {label}
    </label>

    <div className="relative">

      <input
        type={
          show
            ? 'text'
            : 'password'
        }
        value={value}
        onChange={onChange}
        required
        minLength={minLength}
        placeholder={placeholder}
        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-11 outline-none bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-blue-500/20 focus:border-[#123B5D] dark:focus:border-blue-500 transition-colors"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-[#123B5D] dark:hover:text-blue-400 transition"
      >
        {show ? (
          <EyeOff size={18} />
        ) : (
          <Eye size={18} />
        )}
      </button>

    </div>

    {hint && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        {hint}
      </p>
    )}

  </div>
);

/* =========================================================
   ALERT BOX
========================================================= */

const AlertBox = ({
  type,
  message,
}) => {
  const success = type === 'success';

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
        success
          ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
          : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
      }`}
    >
      {success ? (
        <CheckCircle2
          size={18}
          className="shrink-0 mt-0.5"
        />
      ) : (
        <AlertCircle
          size={18}
          className="shrink-0 mt-0.5"
        />
      )}

      <span className="font-medium">
        {message}
      </span>
    </div>
  );
};

/* =========================================================
   SECURITY ITEM
========================================================= */

const SecurityItem = ({
  icon: Icon,
  iconBg,
  iconClass,
  title,
  description,
  status,
  statusClass,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60">

    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
    >
      <Icon
        size={20}
        className={iconClass}
      />
    </div>

    <div className="flex-1 min-w-0">

      <h3 className="font-semibold text-gray-800 dark:text-white">
        {title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>

    </div>

    {status && (
      <div
        className={`flex items-center gap-2 text-sm font-semibold shrink-0 ${statusClass}`}
      >
        <CheckCircle2 size={17} />
        {status}
      </div>
    )}

  </div>
);

export default Settings;
