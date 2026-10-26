import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';

import api from '../../services/api';
import TmcLogo from '../../components/TmcLogo';

const VerifyResetOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || '';

  const [email] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // =========================================================
  // NAVIGATION TRANSITION
  // null | forgot | reset
  // =========================================================
  const [navigationState, setNavigationState] = useState(null);

  const navigationTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  // =========================================================
  // CLEANUP TIMERS
  // =========================================================
  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // =========================================================
  // HANDLE OTP VERIFICATION
  // =========================================================
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setSuccess('');
    setError('');

    if (!email) {
      setError(
        'Your password reset session is missing. Please request a new OTP.'
      );
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (navigationState || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        '/auth/verify-reset-otp',
        {
          email,
          otp,
        }
      );

      const resetToken = response.data?.reset_token;
      if (!resetToken) throw new Error('The reset session could not be created. Please request a new code.');

      setSuccess(
        response.data?.message ||
          'Verification code verified successfully.'
      );

      // =====================================================
      // MOVE TO RESET PASSWORD
      // =====================================================
      resetTimerRef.current = setTimeout(() => {
        setNavigationState('reset');

        navigationTimerRef.current = setTimeout(() => {
          navigate('/reset-password', {
            state: {
              email,
              resetToken,
            },
          });
        }, 400);
      }, 800);

    } catch (err) {
      const message =
        err.response?.data?.errors?.otp?.[0] ||
        err.response?.data?.message ||
        'Unable to verify the verification code.';

      setError(message);
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

  return (
    <>
      {/* =====================================================
          AUTH PAGE ANIMATION STYLES
      ====================================================== */}
      <style>{`
        @keyframes otpFadeIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes otpFadeInUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes otpGlow {
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

        @keyframes otpFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes otpPulse {
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

        @keyframes otpShimmer {
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
           NORMAL PAGE ANIMATIONS
        ====================================================== */

        .otp-page {
          animation: otpFadeIn 0.75s ease-out both;
        }

        .otp-card {
          animation: otpFadeInUp 0.75s ease-out 0.08s both;
        }

        .otp-logo {
          animation: otpFloat 5s ease-in-out infinite;
        }

        .otp-glow {
          animation: otpGlow 6s ease-in-out infinite;
        }

        .otp-pulse {
          animation: otpPulse 3s ease-in-out infinite;
        }

        .otp-shimmer {
          animation: otpShimmer 5s ease-in-out infinite;
        }

        .otp-ease {
          transition:
            transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 300ms ease-in-out,
            background-color 300ms ease-in-out,
            border-color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            color 300ms ease-in-out;
        }

        /* =====================================================
           OTP → RESET PASSWORD
           SIMPLE SMOOTH SLIDE LEFT
        ====================================================== */

        @keyframes otpResetSlide {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }

          to {
            opacity: 0;
            transform: translate3d(-35px, 0, 0);
          }
        }

        .otp-navigate-reset .otp-card {
          animation:
            otpResetSlide
            400ms
            ease-in-out
            forwards;

          will-change:
            transform,
            opacity;
        }

        /* =====================================================
           OTP → FORGOT PASSWORD
           SIMPLE SMOOTH SLIDE RIGHT
        ====================================================== */

        @keyframes otpForgotSlide {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }

          to {
            opacity: 0;
            transform: translate3d(35px, 0, 0);
          }
        }

        .otp-navigate-forgot .otp-card {
          animation:
            otpForgotSlide
            400ms
            ease-in-out
            forwards;

          will-change:
            transform,
            opacity;
        }

        @media (max-width: 640px) {
          .otp-navigate-reset .otp-card {
            animation:
              otpResetSlide
              350ms
              ease-in-out
              forwards;
          }

          .otp-navigate-forgot .otp-card {
            animation:
              otpForgotSlide
              350ms
              ease-in-out
              forwards;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .otp-page,
          .otp-card,
          .otp-logo,
          .otp-glow,
          .otp-pulse,
          .otp-shimmer {
            animation: none !important;
          }

          .otp-ease {
            transition: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          PAGE
      ====================================================== */}
      <div
        className={`
          otp-page
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
            navigationState === 'reset'
              ? 'otp-navigate-reset'
              : ''
          }

          ${
            navigationState === 'forgot'
              ? 'otp-navigate-forgot'
              : ''
          }
        `}
      >

        {/* ===================================================
            BACKGROUND DECORATION
        ==================================================== */}

        <div
          className="otp-glow absolute -top-48 -right-48 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(18,59,93,0.16) 0%, rgba(244,180,0,0.08) 38%, rgba(244,247,250,0) 72%)',
          }}
        />

        <div
          className="otp-glow absolute -bottom-56 -left-56 w-[600px] h-[600px] rounded-full pointer-events-none"
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
          className="otp-logo absolute top-[18%] left-[15%] w-2.5 h-2.5 rounded-full bg-[#F4B400]/50 pointer-events-none"
          style={{ animationDelay: '0.5s' }}
        />

        <div
          className="otp-logo absolute bottom-[20%] right-[16%] w-3 h-3 rounded-full bg-[#123B5D]/20 pointer-events-none"
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

            <div className="otp-logo relative">

              {/* Logo glow */}
              <div className="absolute inset-0 rounded-full bg-[#F4B400]/20 blur-2xl scale-110" />

              <TmcLogo className="h-24 w-24 shadow-[0_12px_35px_rgba(18,59,93,0.18)] ring-2 ring-[#F4B400]/70" />

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
          <div className="otp-card relative bg-white rounded-[1.75rem] border border-gray-100 shadow-[0_20px_60px_rgba(18,59,93,0.12)] overflow-hidden">

            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F4B400] via-[#FFD45A] to-transparent" />

            {/* Moving shine */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">

              <div
                className="otp-shimmer absolute -left-full top-0 h-full w-1/3"
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

                <div className="otp-pulse mx-auto w-14 h-14 rounded-2xl bg-[#123B5D]/[0.08] text-[#123B5D] flex items-center justify-center mb-4">

                  <KeyRound size={26} />

                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#123B5D] tracking-tight">
                  Verify OTP
                </h2>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Enter the 6-digit verification code sent to your
                  email.
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
                  FORM
              ================================================== */}
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >

                <div>

                  <label
                    htmlFor="otp"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Verification Code
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    disabled={loading || navigationState !== null}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);

                      setOtp(value);
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="000000"
                    className="otp-ease w-full border border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl sm:text-3xl font-bold tracking-[0.45em] text-[#123B5D] bg-gray-50 placeholder:text-gray-300 outline-none focus:bg-white focus:ring-4 focus:ring-[#123B5D]/[0.08] focus:border-[#123B5D] disabled:opacity-60 disabled:cursor-not-allowed"
                  />

                  <div className="flex items-center justify-center gap-2 mt-3">

                    <div className="w-1.5 h-1.5 rounded-full bg-[#F4B400]" />

                    <p className="text-xs text-gray-400">
                      The code expires after 10 minutes.
                    </p>

                    <div className="w-1.5 h-1.5 rounded-full bg-[#F4B400]" />

                  </div>

                </div>


                {/* =================================================
                    VERIFY BUTTON
                ================================================== */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    otp.length !== 6 ||
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
                        Verifying...
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />

                      <span>
                        Verify OTP
                      </span>
                    </>
                  )}

                </button>

              </form>


              {/* =================================================
                  REQUEST NEW OTP
              ================================================== */}
              <div className="mt-7 pt-6 border-t border-gray-100 text-center">

                <Link
                  to="/forgot-password"
                  onClick={handleRequestNewOtp}
                  className={`
                    otp-ease
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

export default VerifyResetOtp;
