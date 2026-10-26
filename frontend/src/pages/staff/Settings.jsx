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
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  FileCheck2,
  CalendarCheck,
  Megaphone,
  Save,
  Sun,
  Moon,
  MonitorCheck,
  Shield,
  BriefcaseBusiness,
  Building2,
  Mail,
  BadgeCheck,
  SlidersHorizontal,
  UserRoundCheck,
} from 'lucide-react';

const PasswordToggle = ({
  show,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={
      show
        ? 'Hide password'
        : 'Show password'
    }
    className="
      absolute
      right-3
      top-1/2
      -translate-y-1/2
      w-9
      h-9
      rounded-lg
      text-gray-400
      hover:text-[#123B5D]
      dark:hover:text-sky-300
      hover:bg-gray-100
      dark:hover:bg-gray-800
      flex
      items-center
      justify-center
      transition
    "
  >
    {show ? (
      <EyeOff size={18} />
    ) : (
      <Eye size={18} />
    )}
  </button>
);

const ToggleSwitch = ({
  enabled,
  onClick,
  disabled,
}) => (
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
    className={`
      relative
      w-12
      h-6
      rounded-full
      transition-colors
      duration-200
      shrink-0
      ${
        enabled
          ? 'bg-[#123B5D] dark:bg-teal-500'
          : 'bg-gray-300 dark:bg-gray-700'
      }
    `}
  >
    <span
      className={`
        absolute
        top-1
        w-4
        h-4
        rounded-full
        bg-white
        shadow-sm
        transition-transform
        duration-200
        ${
          enabled
            ? 'translate-x-7'
            : 'translate-x-1'
        }
      `}
    />
  </button>
);

const StaffSettings = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  // =========================
  // PASSWORD STATES
  // =========================
  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordSuccess, setPasswordSuccess] =
    useState('');

  const [passwordError, setPasswordError] =
    useState('');

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
  const [showSecurity, setShowSecurity] =
    useState(false);

  // =========================
  // STAFF INFORMATION
  // =========================
  const staff = user?.staff;

  const permissions =
    staff?.permissions ||
    staff?.permission ||
    {};

  const enabledPermissionCount =
    Object.values(permissions).filter(
      (value) => value === true
    ).length;

  const assignedPrograms =
    staff?.academic_programs ||
    staff?.academicPrograms ||
    [];

  // =========================
  // SETTINGS ITEMS
  // =========================
  const settingsItems = [
    {
      icon: User,
      title: 'Account Information',
      description:
        'View your staff account and employment information',
      accent:
        'bg-blue-50 text-[#123B5D] dark:bg-sky-400/10 dark:text-sky-300',
    },
    {
      icon: LockKeyhole,
      title: 'Change Password',
      description:
        'Update your password and keep your account secure',
      accent:
        'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
    },
    {
      icon: Bell,
      title: 'Notification Preferences',
      description:
        'Choose which staff updates you want to receive',
      accent:
        'bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300',
    },
    {
      icon: Palette,
      title: 'Appearance',
      description:
        'Customize how EduPath looks on your device',
      accent:
        'bg-teal-50 text-[#0F766E] dark:bg-teal-400/10 dark:text-teal-300',
    },
    {
      icon: ShieldCheck,
      title: 'Security',
      description:
        'Review your current account security',
      accent:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    },
  ];

  // =========================
  // CLOSE ALL PANELS
  // =========================
  const closeAllPanels = () => {
    setShowPasswordForm(false);
    setShowNotificationPreferences(false);
    setShowAppearance(false);
    setShowSecurity(false);
  };

  // =========================
  // SETTING CLICK HANDLER
  // =========================
  const handleSettingClick = (title) => {
    if (title === 'Account Information') {
      closeAllPanels();
      return;
    }

    if (title === 'Change Password') {
      const next = !showPasswordForm;

      closeAllPanels();
      setShowPasswordForm(next);

      setPasswordSuccess('');
      setPasswordError('');

      return;
    }

    if (title === 'Notification Preferences') {
      const next =
        !showNotificationPreferences;

      closeAllPanels();
      setShowNotificationPreferences(next);

      setNotificationSaved(false);

      return;
    }

    if (title === 'Appearance') {
      const next = !showAppearance;

      closeAllPanels();
      setShowAppearance(next);

      return;
    }

    if (title === 'Security') {
      const next = !showSecurity;

      closeAllPanels();
      setShowSecurity(next);
    }
  };

  // =========================
  // PASSWORD HANDLER
  // =========================
  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError(
        'Please enter your current password.'
      );

      return;
    }

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

      const response = await api.put(
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
        response.data?.message ||
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
        error.response?.data?.errors
          ?.current_password?.[0] ||
        error.response?.data?.errors
          ?.new_password?.[0] ||
        error.response?.data?.message ||
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
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );

      navigate('/login');
    }
  };

  // =========================
  return (
    <div className="space-y-7 page-transition">

      {/* =========================
          HERO
      ========================= */}
      <section
        className="ep-page-banner 
          relative
          overflow-hidden
          rounded-2xl
          ep-brand-gradient
          shadow-lg
          p-6
          sm:p-8
          animate-fade-up
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-24
            w-64
            h-64
            rounded-full
            bg-white/5
            animate-float
          "
        />

        <div
          className="
            absolute
            right-24
            -bottom-32
            w-56
            h-56
            rounded-full
            bg-[#F4B400]/10
          "
        />

        <div className="relative z-10">

          <div
            className="
              inline-flex
              items-center
              gap-2
              px-3
              py-1.5
              rounded-full
              bg-white/10
              border
              border-white/10
              text-blue-100
              text-[10px]
              font-bold
              uppercase
              tracking-[0.16em]
              mb-4
            "
          >
            <SettingsIcon size={13} />
            Staff Preferences
          </div>

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-5
            "
          >

            <div>

              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  lg:text-4xl
                  font-extrabold
                  tracking-tight
                  text-white
                "
              >
                Settings
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  sm:text-base
                  text-blue-100
                  max-w-2xl
                "
              >
                Manage your EduPath staff account,
                security, notifications, and appearance
                preferences.
              </p>

            </div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                bg-white/10
                border
                border-white/10
                text-white
                text-sm
                font-semibold
                backdrop-blur-sm
                self-start
                lg:self-auto
              "
            >
              <BadgeCheck
                size={17}
                className="text-[#F4B400]"
              />

              Staff Account
            </div>

          </div>

        </div>
      </section>


      {/* =========================
          ACCOUNT OVERVIEW
      ========================= */}
      <section
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
        "
      >

        {/* ACCOUNT */}
        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '50ms',
          }}
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >

            <div className="min-w-0">

              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-gray-400
                  dark:text-gray-500
                "
              >
                Account
              </p>

              <p
                className="
                  text-lg
                  font-extrabold
                  text-gray-900
                  dark:text-gray-100
                  mt-2
                  truncate
                "
              >
                {user?.name ||
                  'Staff User'}
              </p>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                  truncate
                "
              >
                {user?.email ||
                  'No email available'}
              </p>

            </div>

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-blue-50
                text-[#123B5D]
                dark:bg-sky-400/10
                dark:text-sky-300
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <UserRoundCheck
                size={21}
              />
            </div>

          </div>
        </div>


        {/* EMPLOYEE ID */}
        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '85ms',
          }}
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >

            <div>

              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-gray-400
                  dark:text-gray-500
                "
              >
                Employee ID
              </p>

              <p
                className="
                  text-lg
                  font-extrabold
                  text-gray-900
                  dark:text-gray-100
                  mt-2
                "
              >
                {staff?.employee_id ||
                  '—'}
              </p>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Staff identification
              </p>

            </div>

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-amber-50
                text-amber-600
                dark:bg-amber-400/10
                dark:text-amber-300
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <BriefcaseBusiness
                size={21}
              />
            </div>

          </div>
        </div>


        {/* PROGRAMS */}
        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '120ms',
          }}
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >

            <div>

              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-gray-400
                  dark:text-gray-500
                "
              >
                Assigned Programs
              </p>

              <p
                className="
                  text-3xl
                  font-extrabold
                  text-gray-900
                  dark:text-gray-100
                  mt-1
                "
              >
                {assignedPrograms.length}
              </p>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Program assignments
              </p>

            </div>

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-teal-50
                text-[#0F766E]
                dark:bg-teal-400/10
                dark:text-teal-300
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Building2
                size={21}
              />
            </div>

          </div>
        </div>


        {/* PERMISSIONS */}
        <div
          className="
            ep-card
            ep-hover-lift
            p-5
            animate-fade-up
          "
          style={{
            animationDelay: '155ms',
          }}
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-3
            "
          >

            <div>

              <p
                className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-gray-400
                  dark:text-gray-500
                "
              >
                Permissions
              </p>

              <p
                className="
                  text-3xl
                  font-extrabold
                  text-gray-900
                  dark:text-gray-100
                  mt-1
                "
              >
                {enabledPermissionCount}
              </p>

              <p
                className="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Enabled staff permissions
              </p>

            </div>

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-emerald-50
                text-emerald-600
                dark:bg-emerald-400/10
                dark:text-emerald-300
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <ShieldCheck
                size={21}
              />
            </div>

          </div>
        </div>

      </section>


      {/* =========================
          SETTINGS MENU
      ========================= */}
      <section
        className="
          ep-card
          overflow-hidden
          animate-fade-up
        "
        style={{
          animationDelay: '190ms',
        }}
      >

        <div
          className="
            px-5
            sm:px-6
            py-4
            border-b
            border-gray-100
            dark:border-gray-800
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-[#123B5D]/10
              dark:bg-sky-400/10
              text-[#123B5D]
              dark:text-sky-300
              flex
              items-center
              justify-center
            "
          >
            <SlidersHorizontal
              size={19}
            />
          </div>

          <div>

            <h2
              className="
                font-bold
                text-gray-900
                dark:text-gray-100
              "
            >
              Preferences
            </h2>

            <p
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
                mt-0.5
              "
            >
              Manage your staff portal preferences
            </p>

          </div>

        </div>

        <div>

          {settingsItems.map(
            (item, index) => {
              const Icon = item.icon;

              const isOpen =
                (item.title ===
                  'Change Password' &&
                  showPasswordForm) ||
                (item.title ===
                  'Notification Preferences' &&
                  showNotificationPreferences) ||
                (item.title ===
                  'Appearance' &&
                  showAppearance) ||
                (item.title ===
                  'Security' &&
                  showSecurity);

              return (
                <div key={item.title}>

                  <button
                    type="button"
                    onClick={() =>
                      handleSettingClick(
                        item.title
                      )
                    }
                    className={`
                      w-full
                      flex
                      items-center
                      gap-4
                      px-5
                      sm:px-6
                      py-5
                      text-left
                      transition-colors
                      duration-200
                      ${
                        isOpen
                          ? 'bg-gray-50 dark:bg-[#142738]'
                          : 'hover:bg-gray-50 dark:hover:bg-[#142738]/70'
                      }
                    `}
                  >

                    <div
                      className={`
                        w-11
                        h-11
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        shrink-0
                        transition-transform
                        duration-200
                        ${
                          isOpen
                            ? 'scale-105'
                            : ''
                        }
                        ${item.accent}
                      `}
                    >
                      <Icon
                        size={21}
                      />
                    </div>

                    <div className="flex-1 min-w-0">

                      <h3
                        className="
                          font-semibold
                          text-gray-800
                          dark:text-gray-100
                        "
                      >
                        {item.title}
                      </h3>

                      <p
                        className="
                          text-sm
                          text-gray-500
                          dark:text-gray-400
                          mt-1
                        "
                      >
                        {item.description}
                      </p>

                    </div>

                    <ChevronRight
                      size={20}
                      className={`
                        text-gray-400
                        shrink-0
                        transition-transform
                        duration-200
                        ${
                          isOpen
                            ? 'rotate-90 text-[#123B5D] dark:text-sky-300'
                            : ''
                        }
                      `}
                    />

                  </button>

                  {index <
                    settingsItems.length -
                      1 && (
                    <div
                      className="
                        border-b
                        border-gray-100
                        dark:border-gray-800
                        ml-[76px]
                      "
                    />
                  )}

                </div>
              );
            }
          )}

        </div>

      </section>


      {/* =========================
          ACCOUNT INFORMATION
      ========================= */}
      {!showPasswordForm &&
        !showNotificationPreferences &&
        !showAppearance &&
        !showSecurity && (
          <section
            className="
              ep-card
              p-5
              sm:p-6
              animate-fade-up
            "
            style={{
              animationDelay: '230ms',
            }}
          >

            <div
              className="
                flex
                items-start
                gap-3
                mb-6
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-blue-50
                  dark:bg-sky-400/10
                  text-[#123B5D]
                  dark:text-sky-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <User
                  size={20}
                />
              </div>

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-gray-100
                  "
                >
                  Account Information
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Your staff account and employment information.
                </p>

              </div>

            </div>


            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-4
              "
            >

              <div
                className="
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-400
                    dark:text-gray-500
                    uppercase
                    tracking-wide
                  "
                >
                  <User size={14} />
                  Full Name
                </div>

                <p
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                    mt-2
                  "
                >
                  {user?.name ||
                    'Staff User'}
                </p>
              </div>


              <div
                className="
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-400
                    dark:text-gray-500
                    uppercase
                    tracking-wide
                  "
                >
                  <Mail size={14} />
                  Email Address
                </div>

                <p
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                    mt-2
                    break-all
                  "
                >
                  {user?.email ||
                    '—'}
                </p>
              </div>


              <div
                className="
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-400
                    dark:text-gray-500
                    uppercase
                    tracking-wide
                  "
                >
                  <BriefcaseBusiness
                    size={14}
                  />
                  Employee ID
                </div>

                <p
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                    mt-2
                  "
                >
                  {staff?.employee_id ||
                    '—'}
                </p>
              </div>


              <div
                className="
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-400
                    dark:text-gray-500
                    uppercase
                    tracking-wide
                  "
                >
                  <Building2
                    size={14}
                  />
                  Department
                </div>

                <p
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                    mt-2
                  "
                >
                  {staff?.department ||
                    '—'}
                </p>
              </div>


              <div
                className="
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-400
                    dark:text-gray-500
                    uppercase
                    tracking-wide
                  "
                >
                  <User size={14} />
                  Position
                </div>

                <p
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                    mt-2
                  "
                >
                  {staff?.position ||
                    '—'}
                </p>
              </div>


              <div
                className="
                  rounded-xl
                  bg-gray-50
                  dark:bg-[#142738]
                  border
                  border-gray-100
                  dark:border-gray-800
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    text-gray-400
                    dark:text-gray-500
                    uppercase
                    tracking-wide
                  "
                >
                  <BadgeCheck
                    size={14}
                  />
                  Account Status
                </div>

                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    mt-2
                    px-3
                    py-1
                    rounded-full
                    bg-emerald-50
                    dark:bg-emerald-400/10
                    text-emerald-700
                    dark:text-emerald-300
                    text-xs
                    font-bold
                  "
                >
                  <CheckCircle2
                    size={13}
                  />

                  {staff?.status
                    ? staff.status
                        .charAt(0)
                        .toUpperCase() +
                      staff.status.slice(1)
                    : 'Active'}
                </span>
              </div>

            </div>

          </section>
        )}


      {/* =========================
          CHANGE PASSWORD
      ========================= */}
      {showPasswordForm && (
        <section
          className="
            ep-card
            p-5
            sm:p-6
            animate-scale-in
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
              mb-6
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-amber-50
                  dark:bg-amber-400/10
                  text-amber-600
                  dark:text-amber-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <KeyRound
                  size={20}
                />
              </div>

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-gray-100
                  "
                >
                  Change Password
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Keep your staff account secure with a strong password.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowPasswordForm(
                  false
                )
              }
              className="
                w-9
                h-9
                rounded-lg
                text-gray-400
                hover:bg-gray-100
                dark:hover:bg-gray-800
                hover:text-gray-700
                dark:hover:text-gray-200
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <X size={19} />
            </button>

          </div>


          {passwordSuccess && (
            <div
              className="
                mb-5
                flex
                items-center
                gap-3
                rounded-xl
                bg-emerald-50
                dark:bg-emerald-400/10
                border
                border-emerald-200
                dark:border-emerald-400/20
                px-4
                py-3
                text-emerald-700
                dark:text-emerald-300
                text-sm
              "
            >
              <CheckCircle2
                size={18}
              />

              {passwordSuccess}
            </div>
          )}


          {passwordError && (
            <ErrorMessage message={passwordError}><div
              className="
                mb-5
                flex
                items-start
                gap-3
                rounded-xl
                bg-red-50
                dark:bg-red-400/10
                border
                border-red-200
                dark:border-red-400/20
                px-4
                py-3
                text-red-700
                dark:text-red-300
                text-sm
              "
            >
              <AlertCircle
                size={18}
                className="shrink-0 mt-0.5"
              />

              {passwordError}
            </div></ErrorMessage>
          )}


          <form
            onSubmit={
              handleChangePassword
            }
            className="space-y-5"
          >

            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-200
                  mb-2
                "
              >
                Current Password
              </label>

              <div className="relative">

                <input
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    currentPassword
                  }
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value
                    )
                  }
                  required
                  className="
                    w-full
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    px-4
                    py-3
                    pr-12
                    outline-none
                    bg-white
                    dark:bg-[#101f2d]
                    text-gray-900
                    dark:text-gray-100
                    placeholder:text-gray-400
                    focus:ring-2
                    focus:ring-[#123B5D]/20
                    dark:focus:ring-sky-400/20
                    focus:border-[#123B5D]
                    dark:focus:border-sky-400
                  "
                  placeholder="Enter current password"
                />

                <PasswordToggle
                  show={
                    showCurrentPassword
                  }
                  onClick={() =>
                    setShowCurrentPassword(
                      (current) =>
                        !current
                    )
                  }
                />

              </div>

            </div>


            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-200
                  mb-2
                "
              >
                New Password
              </label>

              <div className="relative">

                <input
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    newPassword
                  }
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={8}
                  className="
                    w-full
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    px-4
                    py-3
                    pr-12
                    outline-none
                    bg-white
                    dark:bg-[#101f2d]
                    text-gray-900
                    dark:text-gray-100
                    placeholder:text-gray-400
                    focus:ring-2
                    focus:ring-[#123B5D]/20
                    dark:focus:ring-sky-400/20
                    focus:border-[#123B5D]
                    dark:focus:border-sky-400
                  "
                  placeholder="Enter new password"
                />

                <PasswordToggle
                  show={
                    showNewPassword
                  }
                  onClick={() =>
                    setShowNewPassword(
                      (current) =>
                        !current
                    )
                  }
                />

              </div>

              <p
                className="
                  text-xs
                  text-gray-400
                  dark:text-gray-500
                  mt-2
                "
              >
                Password must be at least 8 characters.
              </p>

            </div>


            <div>

              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  dark:text-gray-200
                  mb-2
                "
              >
                Confirm New Password
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                  className="
                    w-full
                    border
                    border-gray-200
                    dark:border-gray-700
                    rounded-xl
                    px-4
                    py-3
                    pr-12
                    outline-none
                    bg-white
                    dark:bg-[#101f2d]
                    text-gray-900
                    dark:text-gray-100
                    placeholder:text-gray-400
                    focus:ring-2
                    focus:ring-[#123B5D]/20
                    dark:focus:ring-sky-400/20
                    focus:border-[#123B5D]
                    dark:focus:border-sky-400
                  "
                  placeholder="Confirm new password"
                />

                <PasswordToggle
                  show={
                    showConfirmPassword
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                />

              </div>

            </div>


            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:justify-end
                gap-3
                pt-2
              "
            >

              <button
                type="button"
                onClick={() =>
                  setShowPasswordForm(
                    false
                  )
                }
                className="
                  px-5
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  text-gray-600
                  dark:text-gray-300
                  font-semibold
                  hover:bg-gray-50
                  dark:hover:bg-gray-800
                  transition
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  passwordLoading
                }
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-[#123B5D]
                  hover:bg-[#0F3553]
                  dark:bg-sky-700
                  dark:hover:bg-sky-600
                  disabled:opacity-60
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  transition
                "
              >
                <KeyRound
                  size={17}
                />

                {passwordLoading
                  ? 'Changing Password...'
                  : 'Change Password'}
              </button>

            </div>

          </form>

        </section>
      )}


      {/* =========================
          NOTIFICATION PREFERENCES
      ========================= */}
      {showNotificationPreferences && (
        <section
          className="
            ep-card
            p-5
            sm:p-6
            animate-scale-in
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
              mb-6
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-purple-50
                  dark:bg-purple-400/10
                  text-purple-600
                  dark:text-purple-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Bell size={20} />
              </div>

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-gray-100
                  "
                >
                  Notification Preferences
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Choose which staff updates you want to receive.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowNotificationPreferences(
                  false
                )
              }
              className="
                w-9
                h-9
                rounded-lg
                text-gray-400
                hover:bg-gray-100
                dark:hover:bg-gray-800
                hover:text-gray-700
                dark:hover:text-gray-200
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <X size={19} />
            </button>

          </div>


          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Preferences are saved to your account and control push delivery. In-app records remain available.</p>
            {notificationError && <ErrorMessage message={notificationError}><div role="alert" className="mb-4 text-sm text-red-700 dark:text-red-300">{notificationError} <button type="button" onClick={reloadNotifications} className="underline">Reload preferences</button></div></ErrorMessage>}
            {notificationBusy && !notificationError && <p role="status" className="mb-4 text-sm">Loading or saving preferences…</p>}
            {notificationSaved && (
            <div
              className="
                mb-5
                flex
                items-center
                gap-3
                rounded-xl
                bg-emerald-50
                dark:bg-emerald-400/10
                border
                border-emerald-200
                dark:border-emerald-400/20
                px-4
                py-3
                text-emerald-700
                dark:text-emerald-300
                text-sm
              "
            >
              <CheckCircle2
                size={18}
              />

              Notification preferences saved successfully.
            </div>
          )}


          <div>

            {[
              {
                key: 'applicationUpdates',
                icon: FileCheck2,
                title: 'Application Updates',
                description:
                  'Receive updates about admission applications assigned to you.',
              },
              {
                key: 'documentUpdates',
                icon: FileCheck2,
                title: 'Document Updates',
                description:
                  'Receive updates when applicant documents require review.',
              },
              {
                key: 'entranceExamUpdates',
                icon: CalendarCheck,
                title: 'Entrance Exam Updates',
                description:
                  'Receive updates about entrance examination schedules and assignments.',
              },
              {
                key: 'announcements',
                icon: Megaphone,
                title: 'Announcements',
                description:
                  'Receive important announcements from Trinidad Municipal College.',
              },
            ].map((item) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={item.key}
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-center
                    gap-4
                    py-4
                    border-b
                    border-gray-100
                    dark:border-gray-800
                    last:border-b-0
                  "
                >

                  <div
                    className="
                      w-10
                      h-10
                      rounded-xl
                      bg-[#123B5D]/10
                      dark:bg-sky-400/10
                      text-[#123B5D]
                      dark:text-sky-300
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <Icon size={19} />
                  </div>

                  <div className="flex-1">

                    <h3
                      className="
                        font-semibold
                        text-gray-800
                        dark:text-gray-100
                      "
                    >
                      {item.title}
                    </h3>

                    <p
                      className="
                        text-sm
                        text-gray-500
                        dark:text-gray-400
                        mt-1
                      "
                    >
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


          <div
            className="
              flex
              justify-end
              pt-6
            "
          >
            <button
              type="button"
              onClick={
                handleSaveNotifications
              }
                disabled={notificationBusy}
              className="
                flex
                items-center
                justify-center
                gap-2
                bg-[#123B5D]
                hover:bg-[#0F3553]
                dark:bg-sky-700
                dark:hover:bg-sky-600
                text-white
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
              "
            >
              <Save size={17} />
              Save Preferences
            </button>
          </div>

        </section>
      )}


      {/* =========================
          APPEARANCE
      ========================= */}
      {showAppearance && (
        <section
          className="
            ep-card
            p-5
            sm:p-6
            animate-scale-in
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
              mb-6
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-teal-50
                  dark:bg-teal-400/10
                  text-[#0F766E]
                  dark:text-teal-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Palette
                  size={20}
                />
              </div>

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-gray-100
                  "
                >
                  Appearance
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Choose how EduPath looks on your device.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowAppearance(
                  false
                )
              }
              className="
                w-9
                h-9
                rounded-lg
                text-gray-400
                hover:bg-gray-100
                dark:hover:bg-gray-800
                hover:text-gray-700
                dark:hover:text-gray-200
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <X size={19} />
            </button>

          </div>


          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-4
            "
          >

            {/* LIGHT MODE */}
            <button
              type="button"
              onClick={() =>
                setAppearance(
                  'light'
                )
              }
              className={`
                relative
                text-left
                rounded-2xl
                border-2
                p-5
                transition-colors
                duration-200
                ${
                  appearance ===
                  'light'
                    ? 'border-[#123B5D] bg-[#123B5D]/5 dark:bg-sky-400/5 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }
              `}
            >

              {appearance ===
                'light' && (
                <div
                  className="
                    absolute
                    top-4
                    right-4
                    text-[#123B5D]
                    dark:text-sky-300
                  "
                >
                  <CheckCircle2
                    size={21}
                  />
                </div>
              )}

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-amber-50
                  text-[#D9A900]
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >
                <Sun size={24} />
              </div>

              <h3
                className="
                  font-bold
                  text-gray-800
                  dark:text-gray-100
                "
              >
                Light Mode
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Use the standard bright EduPath interface.
              </p>

            </button>


            {/* DARK MODE */}
            <button
              type="button"
              onClick={() =>
                setAppearance(
                  'dark'
                )
              }
              className={`
                relative
                text-left
                rounded-2xl
                border-2
                p-5
                transition-colors
                duration-200
                ${
                  appearance ===
                  'dark'
                    ? 'border-[#123B5D] bg-[#123B5D]/5 dark:bg-sky-400/5 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }
              `}
            >

              {appearance ===
                'dark' && (
                <div
                  className="
                    absolute
                    top-4
                    right-4
                    text-[#123B5D]
                    dark:text-sky-300
                  "
                >
                  <CheckCircle2
                    size={21}
                  />
                </div>
              )}

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-slate-100
                  dark:bg-slate-800
                  text-slate-700
                  dark:text-slate-200
                  flex
                  items-center
                  justify-center
                  mb-4
                "
              >
                <Moon size={24} />
              </div>

              <h3
                className="
                  font-bold
                  text-gray-800
                  dark:text-gray-100
                "
              >
                Dark Mode
              </h3>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Use a darker interface that is easier on the eyes.
              </p>

            </button>

          </div>


          <div
            className="
              mt-5
              flex
              items-center
              gap-2
              text-sm
              text-gray-500
              dark:text-gray-400
            "
          >

            <CheckCircle2
              size={17}
              className="text-emerald-600 dark:text-emerald-400"
            />

            <span>
              Your appearance preference is saved automatically.
            </span>

          </div>

        </section>
      )}


      {/* =========================
          SECURITY
      ========================= */}
      {showSecurity && (
        <section
          className="
            ep-card
            p-5
            sm:p-6
            animate-scale-in
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
              mb-6
            "
          >

            <div
              className="
                flex
                items-start
                gap-3
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-emerald-50
                  dark:bg-emerald-400/10
                  text-emerald-600
                  dark:text-emerald-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <ShieldCheck
                  size={20}
                />
              </div>

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-gray-100
                  "
                >
                  Security
                </h2>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Review the security of your EduPath staff account.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowSecurity(
                  false
                )
              }
              className="
                w-9
                h-9
                rounded-lg
                text-gray-400
                hover:bg-gray-100
                dark:hover:bg-gray-800
                hover:text-gray-700
                dark:hover:text-gray-200
                flex
                items-center
                justify-center
                transition
                shrink-0
              "
            >
              <X size={19} />
            </button>

          </div>


          <div className="space-y-3">

            {/* PASSWORD SECURITY */}
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                gap-4
                p-4
                rounded-xl
                border
                border-gray-100
                dark:border-gray-800
                bg-gray-50
                dark:bg-[#142738]
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-emerald-50
                  dark:bg-emerald-400/10
                  text-emerald-600
                  dark:text-emerald-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <KeyRound size={20} />
              </div>

              <div className="flex-1">

                <h3
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                  "
                >
                  Password Security
                </h3>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Your staff account is protected by a password.
                </p>

              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-emerald-600
                  dark:text-emerald-400
                  text-sm
                  font-semibold
                "
              >
                <CheckCircle2
                  size={17}
                />
                Protected
              </div>

            </div>


            {/* SESSION SECURITY */}
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                gap-4
                p-4
                rounded-xl
                border
                border-gray-100
                dark:border-gray-800
                bg-gray-50
                dark:bg-[#142738]
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-blue-50
                  dark:bg-sky-400/10
                  text-blue-600
                  dark:text-sky-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <MonitorCheck
                  size={20}
                />
              </div>

              <div className="flex-1">

                <h3
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                  "
                >
                  Current Session
                </h3>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  You are currently signed in to your EduPath staff account.
                </p>

              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-blue-600
                  dark:text-sky-300
                  text-sm
                  font-semibold
                "
              >
                <CheckCircle2
                  size={17}
                />
                Active
              </div>

            </div>


            {/* ACCOUNT PROTECTION */}
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                gap-4
                p-4
                rounded-xl
                border
                border-gray-100
                dark:border-gray-800
                bg-gray-50
                dark:bg-[#142738]
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-purple-50
                  dark:bg-purple-400/10
                  text-purple-600
                  dark:text-purple-300
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Shield size={20} />
              </div>

              <div className="flex-1">

                <h3
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-gray-100
                  "
                >
                  Account Protection
                </h3>

                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  Never share your password or authentication token with anyone.
                </p>

              </div>

            </div>

          </div>


          {/* SECURITY ACTIONS */}
          <div
            className="
              mt-6
              pt-6
              border-t
              border-gray-100
              dark:border-gray-800
            "
          >

            <h3
              className="
                font-semibold
                text-gray-800
                dark:text-gray-100
                mb-3
              "
            >
              Security Actions
            </h3>

            <div
              className="
                flex
                flex-col
                sm:flex-row
                gap-3
              "
            >

              <button
                type="button"
                onClick={() => {
                  setShowSecurity(
                    false
                  );
                  setShowPasswordForm(
                    true
                  );
                }}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-[#123B5D]
                  hover:bg-[#0F3553]
                  dark:bg-sky-700
                  dark:hover:bg-sky-600
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  transition
                "
              >
                <KeyRound
                  size={17}
                />

                Change Password
              </button>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-red-50
                  dark:bg-red-400/10
                  text-red-600
                  dark:text-red-300
                  hover:bg-red-600
                  dark:hover:bg-red-600
                  hover:text-white
                  border
                  border-red-200
                  dark:border-red-400/20
                  hover:border-red-600
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  transition-colors
                  duration-200
                "
              >
                <LogOut
                  size={17}
                />

                Logout
              </button>

            </div>

          </div>

        </section>
      )}


      {/* =========================
          ASSIGNED PROGRAMS
      ========================= */}
      {assignedPrograms.length >
        0 && (
        <section
          className="
            ep-card
            p-5
            sm:p-6
            animate-fade-up
          "
          style={{
            animationDelay: '270ms',
          }}
        >

          <div
            className="
              flex
              items-start
              gap-3
              mb-5
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-teal-50
                dark:bg-teal-400/10
                text-[#0F766E]
                dark:text-teal-300
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Building2
                size={20}
              />
            </div>

            <div>

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-900
                  dark:text-gray-100
                "
              >
                Assigned Academic Programs
              </h2>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Programs currently assigned to your staff account.
              </p>

            </div>

          </div>


          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-3
            "
          >

            {assignedPrograms.map(
              (program) => (
                <div
                  key={program.id}
                  className="
                    rounded-xl
                    border
                    border-gray-100
                    dark:border-gray-800
                    bg-gray-50
                    dark:bg-[#142738]
                    p-4
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >

                    <div>

                      <p
                        className="
                          font-bold
                          text-gray-900
                          dark:text-gray-100
                        "
                      >
                        {program.name ||
                          'Academic Program'}
                      </p>

                      {program.code && (
                        <span
                          className="
                            inline-flex
                            mt-2
                            px-2.5
                            py-1
                            rounded-lg
                            bg-white
                            dark:bg-gray-800
                            border
                            border-gray-100
                            dark:border-gray-700
                            text-gray-600
                            dark:text-gray-300
                            text-[10px]
                            font-bold
                          "
                        >
                          {program.code}
                        </span>
                      )}

                    </div>

                    <BadgeCheck
                      size={19}
                      className="
                        text-emerald-500
                        shrink-0
                      "
                    />

                  </div>

                </div>
              )
            )}

          </div>

        </section>
      )}


      {/* =========================
          LOGOUT
      ========================= */}
      <section
        className="
          rounded-2xl
          border
          border-red-100
          dark:border-red-400/10
          bg-white
          dark:bg-[#0D1E2C]
          shadow-sm
          p-5
          sm:p-6
          animate-fade-up
        "
      >

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-4
          "
        >

          <div
            className="
              flex
              items-center
              gap-4
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-red-50
                dark:bg-red-400/10
                text-red-600
                dark:text-red-300
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <LogOut
                size={21}
              />
            </div>

            <div>

              <h2
                className="
                  font-bold
                  text-gray-800
                  dark:text-gray-100
                "
              >
                Sign Out
              </h2>

              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                  mt-1
                "
              >
                Sign out of your EduPath staff account.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="
              flex
              items-center
              justify-center
              gap-2
              bg-red-50
              dark:bg-red-400/10
              text-red-600
              dark:text-red-300
              hover:bg-red-600
              dark:hover:bg-red-600
              hover:text-white
              border
              border-red-200
              dark:border-red-400/20
              hover:border-red-600
              px-5
              py-3
              rounded-xl
              font-semibold
              transition-colors
              duration-200
            "
          >
            <LogOut
              size={17}
            />

            Logout
          </button>

        </div>

      </section>

    </div>
  );
};

export default StaffSettings;
