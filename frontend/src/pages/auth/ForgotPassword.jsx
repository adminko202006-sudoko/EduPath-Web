import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import api from '../../services/api';
import TmcLogo from '../../components/TmcLogo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // =========================================================
  // NAVIGATION TRANSITION
  // null | login | otp
  // =========================================================
  const [navigationState, setNavigationState] = useState(null);

  const navigationTimerRef = useRef(null);
  const otpTimerRef = useRef(null);

  // =========================================================
  // CLEANUP TIMERS
  // =========================================================
  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }

      if (otpTimerRef.current) {
        clearTimeout(otpTimerRef.current);
      }
    };
  }, []);

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (navigationState || loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email: trimmedEmail,
      });

      setMessage(
        response.data?.message ||
          'If an account exists with this email, a verification code has been sent.'
      );

      // =====================================================
      // CONTINUE TO OTP VERIFICATION
      // =====================================================
      otpTimerRef.current = setTimeout(() => {
        setNavigationState('otp');

        navigationTimerRef.current = setTimeout(() => {
          navigate('/verify-reset-otp', {
            state: {
              email: trimmedEmail,
            },
          });
        }, 400);
      }, 800);

    } catch (err) {
      const errors = err.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors).flat()[0];

        setError(
          firstError ||
            'Unable to process your password reset request.'
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Unable to process your password reset request. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // BACK TO LOGIN
  // =========================================================
  const handleBackToLogin = (e) => {
    e.preventDefault();

    if (navigationState || loading) {
      return;
    }

    setMessage('');
    setError('');
    setNavigationState('login');

    navigationTimerRef.current = setTimeout(() => {
      navigate('/login');
    }, 400);
  };

  return (
    <>
      {/* =====================================================
          AUTH PAGE ANIMATION STYLES
      ====================================================== */}
      <style>{`
        @keyframes forgotFadeIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes forgotFadeInUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes forgotGlow {
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

        @keyframes forgotFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes forgotPulse {
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

        @keyframes forgotShimmer {
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

        .forgot-page {
          animation: forgotFadeIn 0.75s ease-out both;
        }

        .forgot-card {
          animation: forgotFadeInUp 0.75s ease-out 0.08s both;
        }

        .forgot-logo {
          animation: forgotFloat 5s ease-in-out infinite;
        }

        .forgot-glow {
          animation: forgotGlow 6s ease-in-out infinite;
        }

        .forgot-pulse {
          animation: forgotPulse 3s ease-in-out infinite;
        }

        .forgot-shimmer {
          animation: forgotShimmer 5s ease-in-out infinite;
        }

        .forgot-ease {
          transition:
            transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 300ms ease-in-out,
            background-color 300ms ease-in-out,
            border-color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            color 300ms ease-in-out;
        }

        /* =====================================================
           FORGOT PASSWORD → LOGIN
           SIMPLE SMOOTH SLIDE
        ====================================================== */

        @keyframes forgotLoginSlide {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }

          to {
            opacity: 0;
            transform: translate3d(35px, 0, 0);
          }
        }

        .forgot-navigate-login .forgot-card {
          animation:
            forgotLoginSlide
            400ms
            ease-in-out
            forwards;
          will-change:
            transform,
            opacity;
        }

        /* =====================================================
           FORGOT PASSWORD → OTP
           SIMPLE SMOOTH SLIDE
        ====================================================== */

        @keyframes forgotOtpSlide {
          from {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }

          to {
            opacity: 0;
            transform: translate3d(-35px, 0, 0);
          }
        }

        .forgot-navigate-otp .forgot-card {
          animation:
            forgotOtpSlide
            400ms
            ease-in-out
            forwards;
          will-change:
            transform,
            opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .forgot-page,
          .forgot-card,
          .forgot-logo,
          .forgot-glow,
          .forgot-pulse,
          .forgot-shimmer {
            animation: none !important;
          }

          .forgot-ease {
            transition: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          PAGE
      ====================================================== */}
      <div
        className={`
          forgot-page
          min-h-screen
          bg-[#F4F7FA]
          flex
          items-center
          justify-center
          p-4
          sm:p-6
          relative
          overflow-hidden

          ${
            navigationState === 'login'
              ? 'forgot-navigate-login'
              : ''
          }

          ${
            navigationState === 'otp'
              ? 'forgot-navigate-otp'
              : ''
          }
        `}
      >

        {/* ===================================================
            BACKGROUND DECORATION
        ==================================================== */}

        <div
          className="forgot-glow absolute -top-48 -right-48 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(18,59,93,0.16) 0%, rgba(244,180,0,0.08) 38%, rgba(244,247,250,0) 72%)',
          }}
        />

        <div
          className="forgot-glow absolute -bottom-56 -left-56 w-[600px] h-[600px] rounded-full pointer-events-none"
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
          className="forgot-logo absolute top-[18%] left-[15%] w-2.5 h-2.5 rounded-full bg-[#F4B400]/50 pointer-events-none"
          style={{ animationDelay: '0.5s' }}
        />

        <div
          className="forgot-logo absolute bottom-[20%] right-[16%] w-3 h-3 rounded-full bg-[#123B5D]/20 pointer-events-none"
          style={{ animationDelay: '1.5s' }}
        />

        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}
        <div className="relative z-10 w-full max-w-md">

          {/* =================================================
              LOGO / BRANDING
          ================================================== */}
          <div className="text-center mb-8">

            <div className="flex justify-center mb-5">

              <div className="forgot-logo relative">

                {/* Logo glow */}
                <div className="absolute inset-0 rounded-full bg-[#F4B400]/20 blur-2xl scale-110" />

                <TmcLogo className="h-24 w-24 shadow-[0_12px_35px_rgba(18,59,93,0.18)] ring-2 ring-[#F4B400]/70" />

              </div>

            </div>

            <div className="flex items-center justify-center gap-2">

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

            <h1 className="text-3xl font-extrabold text-[#123B5D] mt-2 tracking-tight">
              Edu<span className="text-[#F4B400]">Path</span>
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Trinidad Municipal College
            </p>

          </div>


          {/* =================================================
              CARD
          ================================================== */}
          <div className="forgot-card relative bg-white rounded-[1.75rem] border border-gray-100 shadow-[0_20px_60px_rgba(18,59,93,0.12)] overflow-hidden">

            {/* Gold top line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F4B400] via-[#FFD45A] to-transparent" />

            {/* Moving shine */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">

              <div
                className="forgot-shimmer absolute -left-full top-0 h-full w-1/3"
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
              <div className="mb-7">

                <div className="flex items-center gap-3 mb-5">

                  <div className="forgot-ease w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center shadow-md">

                    <Mail
                      size={21}
                      className="text-[#F4B400]"
                    />

                  </div>

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C99A00]">
                      Account Recovery
                    </p>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Secure password reset
                    </p>

                  </div>

                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-[#123B5D] tracking-tight">
                  Forgot your password?
                </h2>

                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Enter the email address associated with your
                  EduPath account and we'll send you a verification
                  code to reset your password.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Available for Applicant, Staff, and Administrator accounts. If you cannot access your registered email, contact the TMC administrator for identity verification. Staff account activation and permissions remain managed by Admin.
                </p>

              </div>


              {/* =================================================
                  SUCCESS MESSAGE
              ================================================== */}
              {message && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl bg-green-50 border border-green-200 px-4 py-3.5 shadow-sm">

                  <CheckCircle2
                    size={20}
                    className="text-green-600 mt-0.5 shrink-0"
                  />

                  <p className="text-sm text-green-700 leading-relaxed">
                    {message}
                  </p>

                </div>
              )}


              {/* =================================================
                  ERROR MESSAGE
              ================================================== */}
              {error && (
                <ErrorMessage message={error}><div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3.5 shadow-sm">

                  <AlertCircle
                    size={20}
                    className="text-red-600 mt-0.5 shrink-0"
                  />

                  <p className="text-sm text-red-700 leading-relaxed">
                    {error}
                  </p>

                </div></ErrorMessage>
              )}


              {/* =================================================
                  FORM
              ================================================== */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}
                <div>

                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>

                  <div className="relative group">

                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#123B5D] transition-colors duration-200"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setMessage('');
                        setError('');
                      }}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      required
                      disabled={loading || navigationState !== null}
                      className="forgot-ease w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#123B5D] focus:ring-4 focus:ring-[#123B5D]/[0.08] disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                  </div>

                </div>


                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading || navigationState !== null}
                  className="group relative overflow-hidden w-full flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-2xl shadow-md hover:shadow-[0_10px_30px_rgba(18,59,93,0.22)]  disabled: transition-colors duration-200 ease-in-out"
                >

                  {!loading && (
                    <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/[0.08] group-hover:left-[130%] transition-colors duration-200 ease-in-out" />
                  )}

                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                      <span>
                        Sending OTP...
                      </span>
                    </>
                  ) : (
                    <>
                      <Send
                        size={18}
                        className=" transition-transform duration-200"
                      />

                      <span>
                        Send Verification Code
                      </span>
                    </>
                  )}

                </button>

              </form>


              {/* =================================================
                  BACK TO LOGIN
              ================================================== */}
              <div className="mt-7 pt-6 border-t border-gray-100 text-center">

                <Link
                  to="/login"
                  onClick={handleBackToLogin}
                  className={`
                    forgot-ease
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

                  <ArrowLeft
                    size={16}
                    className="transition-transform duration-200 "
                  />

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
          <div className="text-center mt-6">

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Trinidad Municipal College
            </p>

            <p className="text-[11px] text-gray-300 mt-1">
              EduPath Admission and Scholarship Management System
            </p>

          </div>

        </div>

      </div>
    </>
  );
};

export default ForgotPassword;
