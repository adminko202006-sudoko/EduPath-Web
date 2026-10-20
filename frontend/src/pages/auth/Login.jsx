import ErrorMessage from '../../components/ui/ErrorMessage';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  BriefcaseBusiness,
  CheckCircle2,
  AlertCircle,
  UsersRound,
  Sparkles,
  CircleCheck,
  Info,
} from 'lucide-react';

import tmcLogo from '../../assets/tmcLogo.jpg';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // =========================================================
  // REMEMBERED EMAIL
  // =========================================================
  const rememberedEmail =
    localStorage.getItem('edupath_remembered_email') || '';

  // =========================================================
  // FORM STATE
  // =========================================================
  const [formData, setFormData] = useState({
    email: rememberedEmail,
    password: '',
  });

  const [rememberMe, setRememberMe] = useState(
    rememberedEmail !== ''
  );

  const [selectedRole, setSelectedRole] = useState('applicant');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  // =========================================================
  // NAVIGATION TRANSITION
  // null | register | forgot
  // =========================================================
  const [navigationState, setNavigationState] = useState(null);

  const navigationTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);



  // =========================================================
  // PORTAL OPTIONS
  // =========================================================
  const portals = [
    {
      id: 'applicant',
      title: 'Applicant',
      subtitle: 'Students & applicants',
      icon: GraduationCap,
    },
    {
      id: 'staff',
      title: 'Staff',
      subtitle: 'TMC staff members',
      icon: BriefcaseBusiness,
    },
    {
      id: 'admin',
      title: 'Admin',
      subtitle: 'System administrators',
      icon: ShieldCheck,
    },
  ];

  // =========================================================
  // HANDLE INPUT
  // =========================================================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError('');
  };

  // =========================================================
  // HANDLE ROLE SELECTION
  // =========================================================
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
  };

  // =========================================================
  // GET DASHBOARD
  // =========================================================
  const getDashboardPath = (role) => {
    if (role === 'admin') {
      return '/admin/dashboard';
    }

    if (role === 'staff') {
      return '/staff/dashboard';
    }

    return '/applicant/dashboard';
  };

  // =========================================================
  // HANDLE LOGIN
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      // =====================================================
      // REMEMBER ME
      // =====================================================
      if (rememberMe) {
        localStorage.setItem(
          'edupath_remembered_email',
          formData.email
        );
      } else {
        localStorage.removeItem(
          'edupath_remembered_email'
        );
      }

      // =====================================================
      // LOGIN THROUGH AUTH CONTEXT
      // =====================================================
      const response = await login(formData);
      const user = response.user;

      // =====================================================
      // BACKEND ROLE IS THE REAL ROLE
      // =====================================================
      if (user.role !== selectedRole) {
        setError(
          `This account is registered as ${
            user.role === 'admin'
              ? 'an administrator'
              : user.role === 'staff'
                ? 'a staff member'
                : 'an applicant'
          }. Please select the correct portal.`
        );

        return;
      }

      // =====================================================
      // REDIRECT TO CORRECT PORTAL
      // =====================================================
      navigate(getDashboardPath(user.role));

    } catch (error) {
      console.error(error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);

      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];

        setError(
          Array.isArray(firstError)
            ? firstError[0]
            : 'Invalid login information.'
        );

      } else {
        setError(
          'Unable to sign in. Please check your email and password.'
        );
      }

    } finally {
      setLoading(false);
    }
  };


    // =========================================================
    // LOGIN → REGISTER
    // SIMPLE SMOOTH SLIDE
    // =========================================================
    const handleCreateAccount = (e) => {
      e.preventDefault();

      if (
        selectedRole !== 'applicant' ||
        navigationState ||
        loading
      ) {
        return;
      }

      setError('');
      setNavigationState('register');

      navigationTimerRef.current = setTimeout(() => {
        navigate('/register');
      }, 450);
    };


    // =========================================================
    // LOGIN → FORGOT PASSWORD
    // SIMPLE SMOOTH SLIDE
    // =========================================================
    const handleForgotPassword = (e) => {
      e.preventDefault();

      if (navigationState || loading) {
        return;
      }

      setError('');
      setNavigationState('forgot');

      navigationTimerRef.current = setTimeout(() => {
        navigate('/forgot-password');
      }, 400);
    };

  return (
    <>
      {/* =====================================================
          AUTH PAGE ANIMATION STYLES
      ====================================================== */}
      <style>{`
        @keyframes edupathFadeIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes edupathFadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes edupathFadeInRight {
          from {
            opacity: 0;
            transform: translateX(25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes edupathGlow {
          0%,
          100% {
            opacity: 0.18;
            transform: scale(0.95);
          }

          50% {
            opacity: 0.42;
            transform: scale(1.08);
          }
        }

        @keyframes edupathGlowTwo {
          0%,
          100% {
            opacity: 0.08;
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            opacity: 0.24;
            transform: translate3d(18px, -12px, 0) scale(1.08);
          }
        }

        @keyframes edupathFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes edupathShimmer {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          25% {
            opacity: 0.15;
          }

          60% {
            opacity: 0.08;
          }

          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        @keyframes edupathPulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }

        .edupath-page {
          animation: edupathFadeIn 0.8s ease-out both;
        }

        .edupath-branding {
          animation: edupathFadeInLeft 0.9s ease-out 0.05s both;
        }

        .edupath-login {
          animation: edupathFadeInRight 0.9s ease-out 0.12s both;
        }

        /* =====================================================
            LOGIN → REGISTER
            SIMPLE SMOOTH SLIDE
          ===================================================== */

          @keyframes edupathRegisterSlide {

            from {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }

            to {
              opacity: 0;
              transform: translate3d(-45px, 0, 0);
            }

          }

          @keyframes edupathRegisterBrandSlide {

            from {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }

            to {
              opacity: 0;
              transform: translate3d(-25px, 0, 0);
            }

          }

          .edupath-navigate-register .edupath-login {

            animation:
              edupathRegisterSlide
              450ms
              ease-in-out
              forwards;

            will-change:
              transform,
              opacity;

          }

          .edupath-navigate-register .edupath-branding {

            animation:
              edupathRegisterBrandSlide
              450ms
              ease-in-out
              forwards;

            will-change:
              transform,
              opacity;

          }


          /* =====================================================
            LOGIN → FORGOT PASSWORD
            SIMPLE SMOOTH SLIDE
          ===================================================== */

          @keyframes edupathForgotSlide {

            from {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }

            to {
              opacity: 0;
              transform: translate3d(35px, 0, 0);
            }

          }

          @keyframes edupathForgotBrandSlide {

            from {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }

            to {
              opacity: 0;
              transform: translate3d(20px, 0, 0);
            }

          }

          .edupath-navigate-forgot .edupath-login {

            animation:
              edupathForgotSlide
              400ms
              ease-in-out
              forwards;

            will-change:
              transform,
              opacity;

          }

          .edupath-navigate-forgot .edupath-branding {

            animation:
              edupathForgotBrandSlide
              400ms
              ease-in-out
              forwards;

            will-change:
              transform,
              opacity;

          }

        .edupath-glow {
          animation: edupathGlow 6s ease-in-out infinite;
        }

        .edupath-glow-two {
          animation: edupathGlowTwo 8s ease-in-out infinite;
        }

        .edupath-float {
          animation: edupathFloat 5s ease-in-out infinite;
        }

        .edupath-pulse {
          animation: edupathPulse 3s ease-in-out infinite;
        }

        .edupath-shimmer {
          animation: edupathShimmer 5s ease-in-out infinite;
        }

        .edupath-ease {
          transition:
            transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 300ms ease-in-out,
            background-color 300ms ease-in-out,
            border-color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            color 300ms ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .edupath-page,
          .edupath-branding,
          .edupath-login,
          .edupath-glow,
          .edupath-glow-two,
          .edupath-float,
          .edupath-pulse,
          .edupath-shimmer {
            animation: none !important;
          }

          .edupath-ease {
            transition: none !important;
          }
        }
      `}</style>

        <div
          className={`
            edupath-page
            min-h-screen
            bg-[#F4F7FA]
            dark:bg-[#071521]
            flex
            items-center
            justify-center
            p-3
            sm:p-4
            lg:p-6
            transition-colors
            duration-200

            ${
              navigationState === 'register'
                ? 'edupath-navigate-register'
                : ''
            }

            ${
              navigationState === 'forgot'
                ? 'edupath-navigate-forgot'
                : ''
            }
          `}
        >
        {/* =====================================================
            MAIN AUTH CONTAINER
        ====================================================== */}
        <div className="relative w-full max-w-7xl min-h-[680px] lg:min-h-[720px] bg-white dark:bg-[#0D2233] rounded-[2rem] shadow-[0_25px_80px_rgba(18,59,93,0.18)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col lg:flex-row">

          {/* ===================================================
              LEFT SIDE — BRANDING
          ==================================================== */}
          <div
            className="edupath-branding relative lg:w-[46%] bg-[#123B5D] overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(180deg, rgba(5, 24, 42, 0.72), rgba(8, 36, 57, 0.88)), url('/TrinidadMunicipalCollege.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 42%',
            }}
          >

            {/* -----------------------------------------------
                FADING LIGHT — MAIN
            ------------------------------------------------ */}
            <div
              className="edupath-glow absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.42) 0%, rgba(47,128,237,0.18) 35%, rgba(18,59,93,0) 72%)',
              }}
            />

            {/* -----------------------------------------------
                FADING LIGHT — SECONDARY
            ------------------------------------------------ */}
            <div
              className="edupath-glow-two absolute -bottom-48 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(244,180,0,0.28) 0%, rgba(20,184,166,0.10) 38%, rgba(18,59,93,0) 72%)',
              }}
            />

            {/* -----------------------------------------------
                MOVING LIGHT BEAM
            ------------------------------------------------ */}
            <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden pointer-events-none">
              <div
                className="edupath-shimmer absolute -left-full top-0 h-full w-[55%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  transform: 'skewX(-15deg)',
                }}
              />
            </div>

            {/* -----------------------------------------------
                DECORATIVE CIRCLES
            ------------------------------------------------ */}
            <div className="absolute -top-28 -left-28 w-80 h-80 rounded-full border-[35px] border-[#F4B400]/15 pointer-events-none" />

            <div className="absolute -bottom-36 -right-36 w-[430px] h-[430px] rounded-full border-[40px] border-[#F4B400]/10 pointer-events-none" />

            <div className="absolute top-[38%] -right-24 w-64 h-64 rounded-full bg-white/[0.035] pointer-events-none" />

            <div className="absolute bottom-[20%] -left-16 w-44 h-44 rounded-full bg-[#14B8A6]/10 pointer-events-none" />

            {/* -----------------------------------------------
                SMALL FLOATING LIGHTS
            ------------------------------------------------ */}
            <div
              className="edupath-float absolute top-[18%] right-[18%] w-3 h-3 rounded-full bg-white/30 blur-[1px] pointer-events-none"
              style={{ animationDelay: '0.5s' }}
            />

            <div
              className="edupath-float absolute top-[28%] left-[14%] w-2 h-2 rounded-full bg-[#F4B400]/70 pointer-events-none"
              style={{ animationDelay: '1.5s' }}
            />

            <div
              className="edupath-float absolute bottom-[24%] right-[13%] w-2.5 h-2.5 rounded-full bg-[#14B8A6]/60 pointer-events-none"
              style={{ animationDelay: '2s' }}
            />

            {/* -----------------------------------------------
                TOP GOLD LINE
            ------------------------------------------------ */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F4B400] via-[#FFD45A] to-transparent" />

            {/* -----------------------------------------------
                BRAND CONTENT
            ------------------------------------------------ */}
            <div className="relative z-10 min-h-full flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-12 py-12">

              {/* LOGO */}
              <div className="edupath-float mb-7">

                <div className="relative">

                  {/* Logo glow */}
                  <div className="absolute inset-0 rounded-full bg-[#F4B400]/20 blur-2xl scale-110" />

                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full bg-white p-2 shadow-[0_15px_45px_rgba(0,0,0,0.25)] ring-4 ring-[#F4B400]/60">

                    <img
                      src={tmcLogo}
                      alt="Trinidad Municipal College Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                    

                  </div>

                </div>

              </div>

              {/* WELCOME */}
              <div className="max-w-md">

                <p className="text-[#FFD45A] text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-3">
                  Welcome to
                </p>

                <h1 className="text-3xl sm:text-4xl lg:text-[2.7rem] font-bold text-white leading-tight tracking-tight">
                  Trinidad Municipal
                </h1>

                <h2 className="text-3xl sm:text-4xl lg:text-[2.7rem] font-bold text-white leading-tight tracking-tight">
                  College
                </h2>

              </div>

              {/* DIVIDER */}
              <div className="flex items-center gap-3 my-7">

                <div className="w-14 h-px bg-white/25" />

                <div className="edupath-pulse">

                  <GraduationCap
                    size={22}
                    className="text-[#F4B400]"
                  />

                </div>

                <div className="w-14 h-px bg-white/25" />

              </div>

              {/* EDUPATH */}
              <div>

                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em]">

                  <span className="text-white">
                    Edu
                  </span>

                  <span className="text-[#F4B400]">
                    Path
                  </span>

                </h2>

                <p className="text-blue-100 text-sm sm:text-base mt-2">
                  Admission and Scholarship
                </p>

                <p className="text-blue-100 text-sm sm:text-base">
                  Management System
                </p>

              </div>

              {/* FEATURES */}
              <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-9 w-full max-w-md">

                <div className="group text-center">

                  <div className="edupath-ease w-11 h-11 mx-auto rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center mb-2 group-hover:bg-white/[0.15] ">

                    <GraduationCap
                      size={20}
                      className="text-[#F4B400]"
                    />

                  </div>

                  <p className="text-[10px] sm:text-xs text-blue-100 font-medium">
                    Admission
                  </p>

                </div>

                <div className="group text-center">

                  <div className="edupath-ease w-11 h-11 mx-auto rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center mb-2 group-hover:bg-white/[0.15] ">

                    <ShieldCheck
                      size={20}
                      className="text-[#F4B400]"
                    />

                  </div>

                  <p className="text-[10px] sm:text-xs text-blue-100 font-medium">
                    Scholarships
                  </p>

                </div>

                <div className="group text-center">

                  <div className="edupath-ease w-11 h-11 mx-auto rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center mb-2 group-hover:bg-white/[0.15] ">

                    <UsersRound
                      size={20}
                      className="text-[#F4B400]"
                    />

                  </div>

                  <p className="text-[10px] sm:text-xs text-blue-100 font-medium">
                    TMC Portal
                  </p>

                </div>

              </div>

              {/* TAGLINE */}
              <div className="flex items-center gap-2 mt-9">

                <Sparkles
                  size={13}
                  className="text-[#F4B400]"
                />

                <p className="text-blue-200 text-xs">
                  Your Future. Our Mission.
                </p>

                <Sparkles
                  size={13}
                  className="text-[#F4B400]"
                />

              </div>

            </div>
          </div>


          {/* ===================================================
              RIGHT SIDE — LOGIN
          ==================================================== */}
          <div className="edupath-login lg:w-[54%] relative flex items-center justify-center bg-white dark:bg-[#0D2233] px-5 py-10 sm:px-10 lg:px-14 xl:px-16 transition-colors duration-200">

            {/* Very subtle background glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#123B5D]/[0.025] dark:bg-[#F4B400]/[0.025] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg">

            <div className="flex justify-end mb-5">
              <Link
                to="/about"
                className="
                  group
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  border
                  border-[#123B5D]/10
                  dark:border-white/10
                  bg-[#123B5D]/[0.035]
                  dark:bg-white/[0.04]
                  text-[#123B5D]
                  dark:text-gray-200
                  text-sm
                  font-semibold
                  hover:bg-[#123B5D]
                  dark:hover:bg-[#F4B400]
                  hover:text-white
                  dark:hover:text-[#123B5D]
                  hover:border-[#123B5D]
                  dark:hover:border-[#F4B400]
                  
                  hover:shadow-md
                  transition-colors
                  duration-200
                  ease-out
                "
              >
                <Info
                  size={16}
                  strokeWidth={2.2}
                  className="
                    transition-transform
                    duration-200
                    group-hover:rotate-12
                  "
                  
                />

                <span>
                  About Us
                </span>

                <ArrowRight
                  size={14}
                  className="
                    transition-transform
                    duration-200
                    
                  "
                />
              </Link>
            </div>

              {/* =================================================
                  MOBILE LOGO
              ================================================== */}
              <div className="flex lg:hidden items-center justify-center mb-8">

                <div className="relative">

                  <div className="absolute inset-0 rounded-full bg-[#F4B400]/20 blur-xl" />

                  <div className="relative w-20 h-20 rounded-full bg-white p-1.5 shadow-lg ring-2 ring-[#F4B400]">

                    <img
                      src={tmcLogo}
                      alt="Trinidad Municipal College Logo"
                      className="w-full h-full object-contain rounded-full"
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  HEADER
              ================================================== */}
              <div className="mb-7">

                <div className="flex items-center gap-3 mb-5">

                  <div className="edupath-ease w-11 h-11 rounded-xl bg-[#123B5D] flex items-center justify-center shadow-md  hover:shadow-lg">

                    <GraduationCap
                      size={22}
                      className="text-[#F4B400]"
                    />

                  </div>

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C99A00] dark:text-[#F4B400]">
                      EduPath Portal
                    </p>

                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Trinidad Municipal College
                    </p>

                  </div>

                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-[#123B5D] dark:text-white tracking-tight">
                  Welcome Back
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Sign in to access your EduPath portal.
                </p>

              </div>


              {/* =================================================
                  PORTAL SELECTOR
              ================================================== */}
              <div className="mb-6">

                <div className="flex items-center justify-between mb-3">

                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Select your portal
                  </label>

                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Choose before signing in
                  </span>

                </div>

                <div className="grid grid-cols-3 gap-2.5">

                  {portals.map((portal) => {

                    const Icon = portal.icon;

                    const isSelected =
                      selectedRole === portal.id;

                    return (
                      <button
                        key={portal.id}
                        type="button"
                        onClick={() =>
                          handleRoleChange(portal.id)
                        }
                        className={`
                          edupath-ease relative rounded-2xl border p-3 text-left
                          ${
                            isSelected
                              ? 'border-[#123B5D] bg-[#123B5D]/[0.055] shadow-sm ring-2 ring-[#123B5D]/[0.08] dark:border-[#F4B400] dark:bg-[#F4B400]/[0.08] dark:ring-[#F4B400]/[0.08]'
                              : 'border-gray-200 bg-gray-50/80  hover:border-[#123B5D]/35 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-[#F4B400]/35 dark:hover:bg-white/[0.07]'
                          }
                        `}
                      >

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5">

                            <CheckCircle2
                              size={15}
                              className="text-[#123B5D] dark:text-[#F4B400]"
                            />

                          </div>
                        )}

                        <div
                          className={`
                            edupath-ease w-9 h-9 rounded-xl flex items-center justify-center mb-2.5
                            ${
                              isSelected
                                ? 'bg-[#123B5D] text-[#F4B400] shadow-sm dark:bg-[#F4B400] dark:text-[#123B5D]'
                                : 'bg-white text-gray-500 border border-gray-100 dark:bg-white/[0.07] dark:text-gray-400 dark:border-white/10'
                            }
                          `}
                        >

                          <Icon size={18} />

                        </div>

                        <p
                          className={`
                            text-xs sm:text-sm font-bold
                            ${
                              isSelected
                                ? 'text-[#123B5D] dark:text-white'
                                : 'text-gray-700 dark:text-gray-200'
                            }
                          `}
                        >
                          {portal.title}
                        </p>

                        <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
                          {portal.subtitle}
                        </p>

                      </button>
                    );
                  })}

                </div>

              </div>


              {/* =================================================
                  ERROR MESSAGE
              ================================================== */}
              {error && (
                <ErrorMessage message={error}><div className="mb-5 flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-500/[0.08] border border-red-200 dark:border-red-500/20 px-4 py-3.5 text-sm text-red-700 dark:text-red-300 shadow-sm">

                  <AlertCircle
                    size={19}
                    className="shrink-0 mt-0.5"
                  />

                  <p className="leading-relaxed">
                    {error}
                  </p>

                </div></ErrorMessage>
              )}


              {/* =================================================
                  LOGIN FORM
              ================================================== */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}
                <div>

                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Email Address
                  </label>

                  <div className="relative group">

                    <Mail
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#123B5D] dark:group-focus-within:text-[#F4B400] transition-colors duration-200"
                    />

                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      required
                      autoComplete="email"
                      className="edupath-ease w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/80 dark:bg-white/[0.045] text-gray-800 dark:text-white placeholder:text-gray-400 outline-none focus:bg-white dark:focus:bg-white/[0.08] focus:border-[#123B5D] dark:focus:border-[#F4B400] focus:ring-4 focus:ring-[#123B5D]/[0.08] dark:focus:ring-[#F4B400]/[0.08]"
                    />

                  </div>

                </div>


                {/* PASSWORD */}
                <div>

                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Password
                  </label>

                  <div className="relative group">

                    <LockKeyhole
                      size={19}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#123B5D] dark:group-focus-within:text-[#F4B400] transition-colors duration-200"
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="edupath-ease w-full pl-11 pr-12 py-3.5 border border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50/80 dark:bg-white/[0.045] text-gray-800 dark:text-white placeholder:text-gray-400 outline-none focus:bg-white dark:focus:bg-white/[0.08] focus:border-[#123B5D] dark:focus:border-[#F4B400] focus:ring-4 focus:ring-[#123B5D]/[0.08] dark:focus:ring-[#F4B400]/[0.08]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      className="edupath-ease absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#123B5D] dark:hover:text-[#F4B400] hover:bg-gray-100 dark:hover:bg-white/10"
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >

                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>

                </div>


                {/* REMEMBER + FORGOT */}
                <div className="flex items-center justify-between gap-4">

                  <label className="flex items-center gap-2 cursor-pointer select-none group">

                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-[#123B5D] focus:ring-[#123B5D] dark:focus:ring-[#F4B400] cursor-pointer"
                    />

                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200">
                      Remember me
                    </span>

                  </label>

                  {/* All existing account roles can recover their password. */}
                  <Link
                    to="/forgot-password"
                    onClick={handleForgotPassword}
                    className={`
                      edupath-ease
                      text-sm
                      font-semibold
                      text-[#123B5D]
                      dark:text-[#F4B400]
                      hover:text-[#C99A00]
                      dark:hover:text-[#FFD45A]

                      ${
                        navigationState
                          ? 'pointer-events-none opacity-60'
                          : ''
                      }
                    `}
                  >
                    {navigationState === 'forgot'
                      ? 'Opening...'
                      : 'Forgot password?'}
                  </Link>
                </div>


                {/* =================================================
                    SIGN IN BUTTON
                ================================================== */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative overflow-hidden w-full flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3.5 rounded-2xl shadow-md hover:shadow-[0_10px_30px_rgba(18,59,93,0.25)]  disabled: transition-colors duration-200 ease-in-out mt-2"
                >

                  {/* Button shine */}
                  {!loading && (
                    <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/[0.08] group-hover:left-[130%] transition-colors duration-200 ease-in-out" />
                  )}

                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                      <span>
                        Signing in...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Sign In as{' '}
                        <span className="text-[#F4B400]">
                          {selectedRole.charAt(0).toUpperCase() +
                            selectedRole.slice(1)}
                        </span>
                      </span>

                      <ArrowRight
                        size={18}
                        className=" transition-transform duration-200 ease-in-out"
                      />
                    </>
                  )}

                </button>

              </form>


              {/* =================================================
                  REGISTRATION / STAFF / ADMIN MESSAGE
              ================================================== */}
              <div className="mt-7 pt-6 border-t border-gray-100 dark:border-white/10 text-center">

                {selectedRole === 'applicant' ? (

                  <p className="text-sm text-gray-500 dark:text-gray-400">

                    Don't have an applicant account?{' '}

                  <Link
                    to="/register"
                    onClick={handleCreateAccount}
                    className={`
                      edupath-ease
                      font-semibold
                      text-[#123B5D]
                      dark:text-[#F4B400]
                      hover:text-[#C99A00]
                      dark:hover:text-[#FFD45A]

                      ${
                        navigationState
                          ? 'pointer-events-none opacity-60'
                          : ''
                      }
                    `}
                  >
                    {navigationState === 'register'
                      ? 'Opening registration...'
                      : 'Create Applicant Account'}
                  </Link>

                  </p>

                ) : (

                  <div className="space-y-2">

                    <div className="flex items-center justify-center gap-2">

                      <CircleCheck
                        size={15}
                        className="text-[#123B5D] dark:text-[#F4B400]"
                      />

                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">

                        {selectedRole === 'staff'
                          ? 'Staff accounts are created by TMC administrators.'
                          : 'Administrator accounts are managed securely by TMC.'}

                      </p>

                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Public registration is only available for applicants.
                    </p>

                  </div>

                )}

              </div>


              {/* =================================================
                  FOOTER
              ================================================== */}
              <div className="mt-7 text-center">

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  © 2026 Trinidad Municipal College
                </p>

                <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">
                  EduPath Admission and Scholarship Management System
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
};

export default Login;
