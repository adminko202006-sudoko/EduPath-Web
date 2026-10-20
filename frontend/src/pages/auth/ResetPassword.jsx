import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';

import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import api from '../../services/api';
import tmcLogo from '../../assets/tmcLogo.jpg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] =
    useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // =========================================================
  // NAVIGATION TRANSITION
  // null | login | forgot
  // =========================================================
  const [navigationState, setNavigationState] = useState(null);

  const navigationTimerRef = useRef(null);
  const loginTimerRef = useRef(null);

  // =========================================================
  // CLEANUP TIMERS
  // =========================================================
  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }

      if (loginTimerRef.current) {
        clearTimeout(loginTimerRef.current);
      }
    };
  }, []);

  // =========================================================
  // RESET PASSWORD
  // =========================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess('');
    setError('');

    if (!email || !resetToken) {
      setError(
        'Your password reset session is missing. Please request a new OTP.'
      );

      return;
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      );

      return;
    }

    if (password !== passwordConfirmation) {
      setError(
        'Password and confirmation password do not match.'
      );

      return;
    }

    if (navigationState || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        '/auth/reset-password-with-otp',
        {
          email,
          reset_token: resetToken,
          password,
          password_confirmation: passwordConfirmation,
        }
      );

      setSuccess(
        response.data?.message ||
          'Password reset successfully.'
      );

      setPassword('');
      setPasswordConfirmation('');

      // =====================================================
      // SUCCESS → LOGIN
      // =====================================================
      loginTimerRef.current = setTimeout(() => {
        setNavigationState('login');

        navigationTimerRef.current = setTimeout(() => {
          navigate('/login', {
            replace: true,
          });
        }, 450);
      }, 1500);

    } catch (err) {
      const errors = err.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors).flat()[0];

        setError(
          firstError ||
            'Unable to reset your password.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to reset your password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REQUEST NEW OTP
  // =========================================================
  const handleRequestNewOtp = (event) => {
    event.preventDefault();

    if (navigationState || loading) {
      return;
    }

    setSuccess('');
    setError('');
    setNavigationState('forgot');

    navigationTimerRef.current = setTimeout(() => {
      navigate('/forgot-password', {
        state: {
          email,
        },
      });
    }, 400);
  };

  // =========================================================
  // BACK TO LOGIN
  // =========================================================
  const handleBackToLogin = (event) => {
    event.preventDefault();

    if (navigationState || loading) {
      return;
    }

    setNavigationState('login');

    navigationTimerRef.current = setTimeout(() => {
      navigate('/login');
    }, 400);
  };

  return (
    <>
      {/* =====================================================
          PAGE ANIMATIONS
      ====================================================== */}
      <style>{`
        @keyframes resetFadeIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes resetFadeInUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes resetGlow {
          0%,
          100% {
            opacity: 0.14;
            transform: scale(0.96);
          }

          50% {
            opacity: 0.30;
            transform: scale(1.06);
          }
        }

        @keyframes resetFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes resetPulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.10);
          }
        }

        @keyframes resetShimmer {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          25% {
            opacity: 0.14;
          }

          60% {
            opacity: 0.06;
          }

          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        /* =====================================================
           NORMAL ANIMATIONS
        ====================================================== */

        .reset-page {
          animation: resetFadeIn 0.75s ease-out both;
        }

        .reset-card {
          animation: resetFadeInUp 0.75s ease-out 0.08s both;
        }

        .reset-logo {
          animation: resetFloat 5s ease-in-out infinite;
        }

        .reset-glow {
          animation: resetGlow 6s ease-in-out infinite;
        }

        .reset-pulse {
          animation: resetPulse 3s ease-in-out infinite;
        }

        .reset-shimmer {
          animation: resetShimmer 5s ease-in-out infinite;
        }

        .reset-ease {
          transition:
            transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 300ms ease-in-out,
            background-color 300ms ease-in-out,
            border-color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            color 300ms ease-in-out;
        }

        /* =====================================================
           RESET PASSWORD → LOGIN
           SIMPLE SLIDE LEFT
        ====================================================== */

        @keyframes resetLoginSlide {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }

          to {
            opacity: 0;
            transform: translate3d(-35px, 0, 0);
          }
        }

        .reset-navigate-login .reset-card {
          animation:
            resetLoginSlide
            450ms
            ease-in-out
            forwards;

          will-change:
            transform,
            opacity;
        }

        /* =====================================================
           RESET PASSWORD → FORGOT PASSWORD
           SIMPLE SLIDE RIGHT
        ====================================================== */

        @keyframes resetForgotSlide {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }

          to {
            opacity: 0;
            transform: translate3d(35px, 0, 0);
          }
        }

        .reset-navigate-forgot .reset-card {
          animation:
            resetForgotSlide
            400ms
            ease-in-out
            forwards;

          will-change:
            transform,
            opacity;
        }

        @media (max-width: 640px) {
          .reset-navigate-login .reset-card {
            animation:
              resetLoginSlide
              350ms
              ease-in-out
              forwards;
          }

          .reset-navigate-forgot .reset-card {
            animation:
              resetForgotSlide
              350ms
              ease-in-out
              forwards;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reset-page,
          .reset-card,
          .reset-logo,
          .reset-glow,
          .reset-pulse,
          .reset-shimmer {
            animation: none !important;
          }

          .reset-ease {
            transition: none !important;
          }
        }
      `}</style>


      {/* =====================================================
          PAGE
      ====================================================== */}
      <div
        className={`
          reset-page
          min-h-screen
          bg-[#F4F7FA]
          flex
          items-center
          justify-center
          px-4
          py-8
          relative
          overflow-hidden

          ${
            navigationState === 'login'
              ? 'reset-navigate-login'
              : ''
          }

          ${
            navigationState === 'forgot'
              ? 'reset-navigate-forgot'
              : ''
          }
        `}
      >

        {/* ===================================================
            BACKGROUND DECORATION
        ==================================================== */}

        <div
          className="reset-glow absolute -top-48 -right-48 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(18,59,93,0.16) 0%, rgba(244,180,0,0.08) 38%, rgba(244,247,250,0) 72%)',
          }}
        />

        <div
          className="reset-glow absolute -bottom-56 -left-56 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(244,180,0,0.13) 0%, rgba(20,184,166,0.06) 40%, rgba(244,247,250,0) 72%)',
            animationDelay: '1.5s',
          }}
        />

        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border-[28px] border-[#123B5D]/[0.035] pointer-events-none" />

        <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full border-[30px] border-[#F4B400]/[0.08] pointer-events-none" />

        {/* Floating lights */}
        <div
          className="reset-logo absolute top-[18%] left-[15%] w-2.5 h-2.5 rounded-full bg-[#F4B400]/50 pointer-events-none"
          style={{ animationDelay: '0.5s' }}
        />

        <div
          className="reset-logo absolute bottom-[20%] right-[16%] w-3 h-3 rounded-full bg-[#123B5D]/20 pointer-events-none"
          style={{ animationDelay: '1.5s' }}
        />


        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}
        <div className="relative z-10 w-full max-w-md">


          {/* =================================================
              LOGO
          ================================================== */}
          <div className="flex justify-center mb-7">

            <div className="reset-logo relative">

              {/* Logo glow */}
              <div className="absolute inset-0 rounded-full bg-[#F4B400]/20 blur-2xl scale-110" />

              <div className="relative w-24 h-24 rounded-full bg-white p-1.5 shadow-[0_12px_35px_rgba(18,59,93,0.18)] ring-2 ring-[#F4B400]/70">

                <img
                  src={tmcLogo}
                  alt="Trinidad Municipal College Logo"
                  className="w-full h-full object-contain rounded-full"
                />

              </div>

              {/* Security badge */}
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#123B5D] text-white flex items-center justify-center border-4 border-[#F4F7FA] shadow-md">

                <ShieldCheck
                  size={17}
                  className="text-[#F4B400]"
                />

              </div>

            </div>

          </div>


          {/* =================================================
              BRANDING
          ================================================== */}
          <div className="text-center mb-7">

            <div className="flex items-center justify-center gap-2 mb-2">

              <Sparkles
                size={13}
                className="text-[#F4B400]"
              />

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C99A00]">
                EduPath Portal
              </p>

              <Sparkles
                size={13}
                className="text-[#F4B400]"
              />

            </div>

            <h1 className="text-3xl font-extrabold text-[#123B5D] tracking-tight">
              Edu<span className="text-[#F4B400]">Path</span>
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Trinidad Municipal College
            </p>

          </div>


          {/* =================================================
              CARD
          ================================================== */}
          <div className="reset-card relative bg-white rounded-[1.75rem] border border-gray-100 shadow-[0_20px_60px_rgba(18,59,93,0.12)] overflow-hidden">

            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F4B400] via-[#FFD45A] to-transparent" />

            {/* Moving shine */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">

              <div
                className="reset-shimmer absolute -left-full top-0 h-full w-1/3"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(18,59,93,0.035), transparent)',
                  transform: 'skewX(-15deg)',
                }}
              />

            </div>


            <div className="relative z-10 p-7 sm:p-8">


              {/* =================================================
                  HEADER
              ================================================== */}
              <div className="text-center mb-7">

                <div className="reset-pulse mx-auto w-14 h-14 rounded-2xl bg-[#123B5D]/[0.08] text-[#123B5D] flex items-center justify-center mb-4">

                  <LockKeyhole size={26} />

                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#123B5D] tracking-tight">
                  Create New Password
                </h2>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Enter a new password for your EduPath account.
                </p>

                {email && (
                  <div className="mt-3 inline-flex max-w-full items-center rounded-full bg-[#123B5D]/[0.055] border border-[#123B5D]/[0.08] px-4 py-2">

                    <p className="text-sm font-semibold text-[#123B5D] break-all">
                      {email}
                    </p>

                  </div>
                )}

              </div>


              {/* =================================================
                  SUCCESS
              ================================================== */}
              {success && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-200 px-4 py-3.5 text-green-700 text-sm shadow-sm">

                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="leading-relaxed">
                    {success}
                  </span>

                </div>
              )}


              {/* =================================================
                  ERROR
              ================================================== */}
              {error && (
                <ErrorMessage message={error}><div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3.5 text-red-700 text-sm shadow-sm">

                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="leading-relaxed">
                    {error}
                  </span>

                </div></ErrorMessage>
              )}


              {/* =================================================
                  MISSING EMAIL
              ================================================== */}
              {!email ? (

                <div className="text-center">

                  <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">

                    <AlertCircle size={22} />

                  </div>

                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                    Your password reset session is missing.
                    Please request a new verification code.
                  </p>

                  <Link
                    to="/forgot-password"
                    onClick={handleRequestNewOtp}
                    className={`
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      bg-[#123B5D]
                      hover:bg-[#0F3553]
                      text-white
                      px-5
                      py-3
                      rounded-xl
                      font-semibold
                      shadow-md
                      hover:shadow-lg
                      transition-colors
                      duration-200
                      ${
                        navigationState
                          ? 'pointer-events-none opacity-60'
                          : ''
                      }
                    `}
                  >

                    <ArrowLeft size={17} />

                    {navigationState === 'forgot'
                      ? 'Opening...'
                      : 'Request New OTP'}

                  </Link>

                </div>

              ) : (

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* =================================================
                      NEW PASSWORD
                  ================================================== */}
                  <div>

                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      New Password
                    </label>

                    <div className="relative">

                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        disabled={loading || navigationState !== null}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError('');
                        }}
                        placeholder="Enter new password"
                        minLength={8}
                        required
                        className="reset-ease w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#123B5D]/[0.08] focus:border-[#123B5D] disabled:opacity-60 disabled:cursor-not-allowed"
                      />

                      <button
                        type="button"
                        disabled={loading || navigationState !== null}
                        onClick={() =>
                          setShowPassword(
                            (current) => !current
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#123B5D] disabled:opacity-40 transition"
                      >

                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}

                      </button>

                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Password must be at least 8 characters.
                    </p>

                  </div>


                  {/* =================================================
                      CONFIRM PASSWORD
                  ================================================== */}
                  <div>

                    <label
                      htmlFor="password_confirmation"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Confirm New Password
                    </label>

                    <div className="relative">

                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        id="password_confirmation"
                        type={
                          showPasswordConfirmation
                            ? 'text'
                            : 'password'
                        }
                        value={passwordConfirmation}
                        disabled={loading || navigationState !== null}
                        onChange={(event) => {
                          setPasswordConfirmation(
                            event.target.value
                          );

                          setError('');
                        }}
                        placeholder="Confirm new password"
                        minLength={8}
                        required
                        className="reset-ease w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-4 focus:ring-[#123B5D]/[0.08] focus:border-[#123B5D] disabled:opacity-60 disabled:cursor-not-allowed"
                      />

                      <button
                        type="button"
                        disabled={loading || navigationState !== null}
                        onClick={() =>
                          setShowPasswordConfirmation(
                            (current) => !current
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#123B5D] disabled:opacity-40 transition"
                      >

                        {showPasswordConfirmation ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}

                      </button>

                    </div>

                  </div>


                  {/* =================================================
                      PASSWORD MATCH INDICATOR
                  ================================================== */}
                  {passwordConfirmation.length > 0 && (
                    <div
                      className={`
                        flex
                        items-center
                        gap-2
                        text-xs
                        ${
                          password === passwordConfirmation
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }
                      `}
                    >

                      <div
                        className={`
                          w-1.5
                          h-1.5
                          rounded-full
                          ${
                            password === passwordConfirmation
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }
                        `}
                      />

                      {password === passwordConfirmation
                        ? 'Passwords match'
                        : 'Passwords do not match yet'}

                    </div>
                  )}


                  {/* =================================================
                      SUBMIT
                  ================================================== */}
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      navigationState !== null
                    }
                    className="group relative overflow-hidden w-full flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-2xl font-semibold shadow-md hover:shadow-[0_10px_30px_rgba(18,59,93,0.22)]  disabled: transition-colors duration-200 ease-in-out"
                  >

                    {!loading && (
                      <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/[0.08] group-hover:left-[130%] transition-colors duration-200 ease-in-out" />
                    )}

                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                        <span>
                          Resetting Password...
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />

                        <span>
                          Reset Password
                        </span>
                      </>
                    )}

                  </button>

                </form>

              )}


              {/* =================================================
                  REQUEST NEW OTP
              ================================================== */}
              {email && (
                <div className="mt-7 pt-6 border-t border-gray-100 text-center">

                  <Link
                    to="/forgot-password"
                    onClick={handleRequestNewOtp}
                    className={`
                      reset-ease
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-[#123B5D]
                      hover:text-[#C99A00]

                      ${
                        navigationState
                          ? 'pointer-events-none opacity-60'
                          : ''
                      }
                    `}
                  >

                    <ArrowLeft size={16} />

                    {navigationState === 'forgot'
                      ? 'Opening...'
                      : 'Request a new OTP'}

                  </Link>

                </div>
              )}


              {/* =================================================
                  BACK TO LOGIN
              ================================================== */}
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">

                <Link
                  to="/login"
                  onClick={handleBackToLogin}
                  className={`
                    reset-ease
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-[#123B5D]
                    hover:text-[#0F766E]

                    ${
                      navigationState
                        ? 'pointer-events-none opacity-60'
                        : ''
                    }
                  `}
                >

                  <ArrowLeft size={16} />

                  {navigationState === 'login'
                    ? 'Opening Login...'
                    : 'Back to Login'}

                </Link>

              </div>

            </div>

          </div>


          {/* =================================================
              FOOTER
          ================================================== */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Trinidad Municipal College
          </p>

          <p className="text-center text-[11px] text-gray-300 mt-1">
            EduPath Admission and Scholarship Management System
          </p>

        </div>

      </div>
    </>
  );
};

export default ResetPassword;
