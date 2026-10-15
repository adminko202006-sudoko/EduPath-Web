import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import {
  User,
  LockKeyhole,
  Bell,
  Palette,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  FileCheck2,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  Save,
  Sun,
  Moon,
  MonitorCheck,
  Shield,
} from 'lucide-react';

const PasswordToggle = ({ show, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#123B5D] transition"
    >
      {show ? (
        <EyeOff size={18} />
      ) : (
        <Eye size={18} />
      )}
    </button>
  );
};

const ToggleSwitch = ({ enabled, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        enabled
          ? 'bg-[#123B5D]'
          : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled
            ? 'translate-x-7'
            : 'translate-x-1'
        }`}
      />
    </button>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  // =========================
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
  const defaultNotifications = {
    applicationStatus: true,
    scholarshipUpdates: true,
    entranceExamUpdates: true,
    announcements: true,
  };

  const [showNotificationPreferences, setShowNotificationPreferences] =
    useState(false);

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(
        'edupath_notification_preferences'
      );

      return saved
        ? { ...defaultNotifications, ...JSON.parse(saved) }
        : defaultNotifications;
    } catch {
      return defaultNotifications;
    }
  });

  const [notificationSaved, setNotificationSaved] = useState(false);

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
      description: 'Manage your personal information',
    },
    {
      icon: LockKeyhole,
      title: 'Change Password',
      description: 'Update your account password',
    },
    {
      icon: Bell,
      title: 'Notification Preferences',
      description: 'Choose what notifications you receive',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize how EduPath looks',
    },
    {
      icon: ShieldCheck,
      title: 'Security',
      description: 'Manage account security',
    },
  ];

  // =========================
  // SETTING CLICK HANDLER
  // =========================
  const handleSettingClick = (title) => {
    if (title === 'Account Information') {
      navigate('/applicant/profile');
      return;
    }

    if (title === 'Change Password') {
      setShowPasswordForm((current) => !current);

      setShowNotificationPreferences(false);
      setShowAppearance(false);
      setShowSecurity(false);

      setPasswordSuccess('');
      setPasswordError('');

      return;
    }

    if (title === 'Notification Preferences') {
      setShowNotificationPreferences((current) => !current);

      setShowPasswordForm(false);
      setShowAppearance(false);
      setShowSecurity(false);

      setNotificationSaved(false);

      return;
    }

    if (title === 'Appearance') {
      setShowAppearance((current) => !current);

      setShowPasswordForm(false);
      setShowNotificationPreferences(false);
      setShowSecurity(false);

      setPasswordSuccess('');
      setPasswordError('');
      setNotificationSaved(false);

      return;
    }

    if (title === 'Security') {
      setShowSecurity((current) => !current);

      setShowPasswordForm(false);
      setShowNotificationPreferences(false);
      setShowAppearance(false);

      setPasswordSuccess('');
      setPasswordError('');
      setNotificationSaved(false);

      return;
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
          new_password_confirmation: confirmPassword,
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
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.current_password?.[0] ||
        error.response?.data?.errors?.new_password?.[0] ||
        'Unable to change password. Please try again.';

      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // =========================
  // NOTIFICATION HANDLERS
  // =========================
  const handleNotificationChange = (key) => {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setNotificationSaved(false);
  };

  const handleSaveNotifications = () => {
    localStorage.setItem(
      'edupath_notification_preferences',
      JSON.stringify(notifications)
    );

    setNotificationSaved(true);

    setTimeout(() => {
      setNotificationSaved(false);
    }, 3000);
  };

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
    await logout();
    navigate('/login');
  };

  // =========================
  return (
    <div className="space-y-6">

      {/* =========================
          PAGE HEADER
      ========================= */}
      <div>
        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center text-white">
            <SettingsIcon size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#123B5D]">
              Settings
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Manage your EduPath account preferences
            </p>
          </div>

        </div>
      </div>


      {/* =========================
          SETTINGS LIST
      ========================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {settingsItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={item.title}>

              <button
                type="button"
                onClick={() =>
                  handleSettingClick(item.title)
                }
                className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors duration-200"
              >

                <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center shrink-0">
                  <Icon size={21} />
                </div>

                <div className="flex-1 min-w-0">

                  <h3 className="font-semibold text-gray-800">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>

                </div>

                <ChevronRight
                  size={20}
                  className="text-gray-400 shrink-0"
                />

              </button>

              {index < settingsItems.length - 1 && (
                <div className="border-b border-gray-100 ml-[76px]" />
              )}

            </div>
          );
        })}

      </div>


      {/* =========================
          CHANGE PASSWORD
      ========================= */}
      {showPasswordForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <div className="flex items-start justify-between mb-6">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center">
                <KeyRound size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#123B5D]">
                  Change Password
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Keep your account secure with a strong password.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowPasswordForm(false)
              }
              className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition"
            >
              <X size={19} />
            </button>

          </div>


          {passwordSuccess && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
              <CheckCircle2 size={18} />
              {passwordSuccess}
            </div>
          )}


          {passwordError && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={18} />
              {passwordError}
            </div>
          )}


          <form
            onSubmit={handleChangePassword}
            className="space-y-5"
          >

            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password
              </label>

              <div className="relative">

                <input
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value
                    )
                  }
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                  placeholder="Enter current password"
                />

                <PasswordToggle
                  show={showCurrentPassword}
                  onClick={() =>
                    setShowCurrentPassword(
                      (current) => !current
                    )
                  }
                />

              </div>

            </div>


            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>

              <div className="relative">

                <input
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={8}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                  placeholder="Enter new password"
                />

                <PasswordToggle
                  show={showNewPassword}
                  onClick={() =>
                    setShowNewPassword(
                      (current) => !current
                    )
                  }
                />

              </div>

              <p className="text-xs text-gray-400 mt-2">
                Password must be at least 8 characters.
              </p>

            </div>


            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 outline-none focus:ring-2 focus:ring-[#123B5D]/20 focus:border-[#123B5D]"
                  placeholder="Confirm new password"
                />

                <PasswordToggle
                  show={showConfirmPassword}
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                />

              </div>

            </div>


            <div className="flex justify-end pt-2">

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:opacity-60 text-white px-5 py-3 rounded-xl font-semibold transition"
              >
                <KeyRound size={17} />

                {passwordLoading
                  ? 'Changing Password...'
                  : 'Change Password'}
              </button>

            </div>

          </form>

        </div>
      )}


      {/* =========================
          NOTIFICATION PREFERENCES
      ========================= */}
      {showNotificationPreferences && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <div className="flex items-start justify-between mb-6">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center">
                <Bell size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#123B5D]">
                  Notification Preferences
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Choose which updates you want to receive.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowNotificationPreferences(false)
              }
              className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition"
            >
              <X size={19} />
            </button>

          </div>


          {notificationSaved && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
              <CheckCircle2 size={18} />
              Notification preferences saved successfully.
            </div>
          )}


          <div className="space-y-1">

            {[
              {
                key: 'applicationStatus',
                icon: FileCheck2,
                title: 'Application Status',
                description:
                  'Receive updates when your admission application status changes.',
              },
              {
                key: 'scholarshipUpdates',
                icon: GraduationCap,
                title: 'Scholarship Updates',
                description:
                  'Receive scholarship announcements and application updates.',
              },
              {
                key: 'entranceExamUpdates',
                icon: ClipboardCheck,
                title: 'Entrance Exam Updates',
                description:
                  'Receive updates about entrance exam schedules and assignments.',
              },
              {
                key: 'announcements',
                icon: Megaphone,
                title: 'Announcements',
                description:
                  'Receive important announcements from Trinidad Municipal College.',
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.key}
                  className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0"
                >

                  <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center shrink-0">
                    <Icon size={19} />
                  </div>

                  <div className="flex-1">

                    <h3 className="font-semibold text-gray-800">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>

                  </div>

                  <ToggleSwitch
                    enabled={notifications[item.key]}
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
              onClick={handleSaveNotifications}
              className="flex items-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              <Save size={17} />
              Save Preferences
            </button>

          </div>

        </div>
      )}


      {/* =========================
          APPEARANCE
      ========================= */}
      {showAppearance && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <div className="flex items-start justify-between mb-6">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center">
                <Palette size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#123B5D]">
                  Appearance
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Choose how EduPath looks on your device.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowAppearance(false)
              }
              className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition"
            >
              <X size={19} />
            </button>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* LIGHT MODE */}
            <button
              type="button"
              onClick={() =>
                handleAppearanceChange('light')
              }
              className={`relative text-left rounded-2xl border-2 p-5 transition-colors duration-200 ${
                appearance === 'light'
                  ? 'border-[#123B5D] bg-[#123B5D]/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >

              {appearance === 'light' && (
                <div className="absolute top-4 right-4 text-[#123B5D]">
                  <CheckCircle2 size={21} />
                </div>
              )}

              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D9A900] flex items-center justify-center mb-4">
                <Sun size={24} />
              </div>

              <h3 className="font-bold text-gray-800">
                Light Mode
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Use the standard bright EduPath interface.
              </p>

            </button>


            {/* DARK MODE */}
            <button
              type="button"
              onClick={() =>
                handleAppearanceChange('dark')
              }
              className={`relative text-left rounded-2xl border-2 p-5 transition-colors duration-200 ${
                appearance === 'dark'
                  ? 'border-[#123B5D] bg-[#123B5D]/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >

              {appearance === 'dark' && (
                <div className="absolute top-4 right-4 text-[#123B5D]">
                  <CheckCircle2 size={21} />
                </div>
              )}

              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
                <Moon size={24} />
              </div>

              <h3 className="font-bold text-gray-800">
                Dark Mode
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Use a darker interface that is easier on the eyes.
              </p>

            </button>

          </div>


          <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">

            <CheckCircle2
              size={17}
              className="text-green-600"
            />

            <span>
              Your appearance preference is saved automatically.
            </span>

          </div>

        </div>
      )}


      {/* =========================
          SECURITY
      ========================= */}
      {showSecurity && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <div className="flex items-start justify-between mb-6">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#123B5D]">
                  Security
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Review the security of your EduPath account.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowSecurity(false)
              }
              className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition"
            >
              <X size={19} />
            </button>

          </div>


          <div className="space-y-4">

            {/* PASSWORD SECURITY */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">

              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>

              <div className="flex-1">

                <h3 className="font-semibold text-gray-800">
                  Password Security
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Your account is protected by a password.
                </p>

              </div>

              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle2 size={17} />
                Protected
              </div>

            </div>


            {/* SESSION SECURITY */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">

              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MonitorCheck size={20} />
              </div>

              <div className="flex-1">

                <h3 className="font-semibold text-gray-800">
                  Current Session
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  You are currently signed in to your EduPath account.
                </p>

              </div>

              <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
                <CheckCircle2 size={17} />
                Active
              </div>

            </div>


            {/* ACCOUNT PROTECTION */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">

              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Shield size={20} />
              </div>

              <div className="flex-1">

                <h3 className="font-semibold text-gray-800">
                  Account Protection
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Never share your password or authentication token with anyone.
                </p>

              </div>

            </div>

          </div>


          {/* SECURITY ACTIONS */}
          <div className="mt-6 pt-6 border-t border-gray-100">

            <h3 className="font-semibold text-gray-800 mb-3">
              Security Actions
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={() => {
                  setShowSecurity(false);
                  setShowPasswordForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] text-white px-5 py-3 rounded-xl font-semibold transition"
              >
                <KeyRound size={17} />
                Change Password
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 px-5 py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                <LogOut size={17} />
                Logout
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =========================
          LOGOUT
      ========================= */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <LogOut size={21} />
            </div>

            <div>

              <h2 className="font-bold text-gray-800">
                Logout
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Sign out of your EduPath account.
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 px-5 py-3 rounded-xl font-semibold transition-colors duration-200"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </div>

    </div>
  );
};

export default Settings;
