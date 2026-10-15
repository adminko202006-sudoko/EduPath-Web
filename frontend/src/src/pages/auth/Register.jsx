import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Phone,
  MapPin,
  VenusAndMars,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    phone: '',
    address: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Transformation states
  const [isEntering, setIsEntering] = useState(true);
  const [isReturning, setIsReturning] = useState(false);

  /*
   * Start the entrance transformation after the page mounts.
   * This makes the Register page feel like it is being formed
   * from the Login page.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsEntering(false);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /*
   * Reverse transformation back to Login.
   */
  const handleBackToLogin = (e) => {
    e.preventDefault();

    if (loading || isReturning) return;

    setIsReturning(true);

    setTimeout(() => {
      navigate('/login');
    }, 850);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (
      formData.password !==
      formData.password_confirmation
    ) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await register(formData);

      setSuccess(
        'Account created successfully. Redirecting to login...'
      );

      setTimeout(() => {
        setIsReturning(true);

        setTimeout(() => {
          navigate('/login');
        }, 850);
      }, 500);
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;

        const firstError = Object.values(errors)[0];

        setError(
          Array.isArray(firstError)
            ? firstError[0]
            : 'Please check your information.'
        );
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(
          'Unable to create account. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ============================================
           EDUPATH REGISTER TRANSFORMATION
        ============================================ */

        .edupath-register-page {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          isolation: isolate;
        }

        .edupath-register-content {
          position: relative;
          z-index: 20;
          transform: translateY(0) scale(1);
          opacity: 1;
          filter: blur(0);
          transition:
            transform 850ms cubic-bezier(0.76, 0, 0.24, 1),
            opacity 650ms ease,
            filter 650ms ease;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-content {
          transform: translateY(35px) scale(0.96);
          opacity: 0;
          filter: blur(8px);
        }

        .edupath-register-page.edupath-returning
          .edupath-register-content {
          transform: translateY(35px) scale(0.94);
          opacity: 0;
          filter: blur(10px);
        }

        /* Main transformation beam */

        .edupath-register-beam {
          position: fixed;
          z-index: 40;
          top: -15%;
          left: -20%;
          width: 25%;
          height: 130%;
          pointer-events: none;
          opacity: 0;
          transform: skewX(-18deg) translateX(-140vw);
          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(18, 59, 93, 0.05) 15%,
              rgba(18, 59, 93, 0.5) 45%,
              rgba(244, 180, 0, 0.85) 52%,
              rgba(255, 255, 255, 0.95) 58%,
              rgba(18, 59, 93, 0.5) 68%,
              transparent 100%
            );
          filter: blur(5px);
        }

        .edupath-register-page.edupath-entering
          .edupath-register-beam {
          animation: edupathRegisterBeamIn 850ms
            cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }

        .edupath-register-page.edupath-returning
          .edupath-register-beam {
          animation: edupathRegisterBeamOut 850ms
            cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }

        @keyframes edupathRegisterBeamIn {
          0% {
            opacity: 0;
            transform: skewX(-18deg) translateX(-140vw);
          }

          20% {
            opacity: 1;
          }

          70% {
            opacity: 0.9;
          }

          100% {
            opacity: 0;
            transform: skewX(-18deg) translateX(520vw);
          }
        }

        @keyframes edupathRegisterBeamOut {
          0% {
            opacity: 0;
            transform: skewX(-18deg) translateX(520vw);
          }

          20% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: skewX(-18deg) translateX(-140vw);
          }
        }

        /* Energy rings */

        .edupath-register-ring {
          position: fixed;
          z-index: 10;
          left: 50%;
          top: 50%;
          width: 180px;
          height: 180px;
          border-radius: 9999px;
          border: 2px solid rgba(18, 59, 93, 0.45);
          box-shadow:
            0 0 25px rgba(18, 59, 93, 0.15),
            inset 0 0 25px rgba(244, 180, 0, 0.08);
          transform:
            translate(-50%, -50%)
            scale(0);
          opacity: 0;
          pointer-events: none;
        }

        .edupath-register-ring-two {
          width: 300px;
          height: 300px;
          border-color: rgba(244, 180, 0, 0.38);
        }

        .edupath-register-ring-three {
          width: 470px;
          height: 470px;
          border-color: rgba(18, 59, 93, 0.2);
        }

        .edupath-register-page.edupath-entering
          .edupath-register-ring,
        .edupath-register-page.edupath-returning
          .edupath-register-ring {
          animation: edupathRegisterRing 850ms
            cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-ring-two {
          animation-delay: 60ms;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-ring-three {
          animation-delay: 110ms;
        }

        @keyframes edupathRegisterRing {
          0% {
            opacity: 0;
            transform:
              translate(-50%, -50%)
              scale(0.05);
          }

          25% {
            opacity: 0.9;
          }

          100% {
            opacity: 0;
            transform:
              translate(-50%, -50%)
              scale(4);
          }
        }

        /* Center flash */

        .edupath-register-flash {
          position: fixed;
          z-index: 45;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(
              circle at center,
              rgba(255, 255, 255, 0.95) 0%,
              rgba(244, 180, 0, 0.3) 12%,
              rgba(18, 59, 93, 0.12) 30%,
              transparent 65%
            );
          opacity: 0;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-flash,
        .edupath-register-page.edupath-returning
          .edupath-register-flash {
          animation: edupathRegisterFlash 850ms ease
            forwards;
        }

        @keyframes edupathRegisterFlash {
          0% {
            opacity: 0;
          }

          35% {
            opacity: 0.95;
          }

          65% {
            opacity: 0.12;
          }

          100% {
            opacity: 0;
          }
        }

        /* Top light streaks */

        .edupath-register-streak {
          position: fixed;
          z-index: 15;
          height: 2px;
          width: 55%;
          left: -60%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(18, 59, 93, 0.15),
            rgba(244, 180, 0, 0.9),
            rgba(255, 255, 255, 0.95),
            transparent
          );
          pointer-events: none;
          opacity: 0;
          transform: rotate(-12deg);
        }

        .edupath-register-streak-one {
          top: 27%;
        }

        .edupath-register-streak-two {
          top: 58%;
          width: 42%;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-streak,
        .edupath-register-page.edupath-returning
          .edupath-register-streak {
          animation: edupathRegisterStreak 850ms
            cubic-bezier(0.76, 0, 0.24, 1) forwards;
        }

        .edupath-register-streak-two {
          animation-delay: 80ms !important;
        }

        @keyframes edupathRegisterStreak {
          0% {
            opacity: 0;
            left: -60%;
          }

          20% {
            opacity: 0.8;
          }

          55% {
            opacity: 0.7;
          }

          100% {
            opacity: 0;
            left: 120%;
          }
        }

        /* Header transformation */

        .edupath-register-header {
          transform: translateY(0) scale(1);
          opacity: 1;
          transition:
            transform 850ms cubic-bezier(0.76, 0, 0.24, 1),
            opacity 600ms ease;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-header {
          transform: translateY(-35px) scale(0.9);
          opacity: 0;
        }

        .edupath-register-page.edupath-returning
          .edupath-register-header {
          transform: translateY(-35px) scale(0.9);
          opacity: 0;
        }

        /* Card */

        .edupath-register-card {
          transform-origin: center;
          transition:
            transform 850ms cubic-bezier(0.76, 0, 0.24, 1),
            opacity 650ms ease,
            filter 650ms ease;
        }

        .edupath-register-page.edupath-entering
          .edupath-register-card {
          transform:
            perspective(1400px)
            rotateX(8deg)
            rotateY(-4deg)
            translateY(45px)
            scale(0.94);
          opacity: 0;
          filter: blur(7px);
        }

        .edupath-register-page.edupath-returning
          .edupath-register-card {
          transform:
            perspective(1400px)
            rotateX(-8deg)
            rotateY(4deg)
            translateY(45px)
            scale(0.94);
          opacity: 0;
          filter: blur(8px);
        }

        /* Interactive transitions */

        .edupath-register-interactive {
          transition:
            transform 300ms ease,
            box-shadow 300ms ease,
            background-color 300ms ease,
            border-color 300ms ease,
            color 300ms ease;
        }

        .edupath-register-interactive:hover {
          transform: translateY(-1px);
        }

        .edupath-register-button {
          transition:
            transform 300ms ease,
            box-shadow 300ms ease,
            background-color 300ms ease;
        }

        .edupath-register-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 10px 24px rgba(18, 59, 93, 0.18);
        }

        .edupath-register-button:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
        }

        /* Reduced motion */

        @media (prefers-reduced-motion: reduce) {
          .edupath-register-content,
          .edupath-register-card,
          .edupath-register-header {
            transition: none !important;
          }

          .edupath-register-beam,
          .edupath-register-ring,
          .edupath-register-flash,
          .edupath-register-streak {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`
          edupath-register-page
          min-h-screen
          bg-[#F4F7FA]
          dark:bg-[#071521]
          flex
          items-center
          justify-center
          px-4
          py-10
          transition-colors
          duration-200
          ${
            isEntering
              ? 'edupath-entering'
              : ''
          }
          ${
            isReturning
              ? 'edupath-returning'
              : ''
          }
        `}
      >
        {/* Transformation Effects */}

        <div className="edupath-register-beam" />

        <div className="edupath-register-ring" />
        <div className="edupath-register-ring edupath-register-ring-two" />
        <div className="edupath-register-ring edupath-register-ring-three" />

        <div className="edupath-register-flash" />

        <div className="edupath-register-streak edupath-register-streak-one" />
        <div className="edupath-register-streak edupath-register-streak-two" />

        {/* Main Content */}

        <div className="edupath-register-content w-full max-w-3xl">

          {/* Header */}

          <div className="edupath-register-header text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#123B5D] shadow-lg mb-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#123B5D] via-[#123B5D] to-[#0F766E]" />

              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white,transparent_35%)]" />

              <GraduationCapIcon />
            </div>

            <h1 className="text-4xl font-bold text-[#123B5D] dark:text-white">
              EduPath
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Trinidad Municipal College
            </p>

            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Admission and Scholarship Management System
            </p>
          </div>

          {/* Register Card */}

          <div
            className="
              edupath-register-card
              bg-white
              dark:bg-[#0D2435]
              rounded-2xl
              shadow-md
              border
              border-gray-100
              dark:border-gray-700
              p-6
              sm:p-8
              lg:p-10
              transition-colors
              duration-200
            "
          >

            {/* Title */}

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#123B5D]/10 dark:bg-[#14B8A6]/10 text-[#123B5D] dark:text-[#5EEAD4] text-xs font-bold uppercase tracking-wide mb-3">
                <UserRound size={14} />
                Applicant Registration
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#123B5D] dark:text-white">
                Create Applicant Account
              </h2>

              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Enter your information to apply for admission and scholarships.
              </p>
            </div>

            {/* Error */}

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    Registration failed
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Success */}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    Registration successful
                  </p>

                  <p className="mt-1">
                    {success}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Personal Information */}

              <div className="mb-8">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-[#14B8A6]/10 flex items-center justify-center">
                    <UserRound
                      size={19}
                      className="text-[#123B5D] dark:text-[#5EEAD4]"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      Personal Information
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tell us about yourself.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* First Name */}

                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      First Name
                    </label>

                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      required
                      autoComplete="given-name"
                      className="edupath-register-interactive w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                    />
                  </div>

                  {/* Middle Name */}

                  <div>
                    <label
                      htmlFor="middle_name"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Middle Name
                      <span className="text-gray-400 font-normal">
                        {' '} (Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      id="middle_name"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      placeholder="Middle name"
                      autoComplete="additional-name"
                      className="edupath-register-interactive w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                    />
                  </div>

                  {/* Last Name */}

                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Last Name
                    </label>

                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      required
                      autoComplete="family-name"
                      className="edupath-register-interactive w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                  {/* Birth Date */}

                  <div>
                    <label
                      htmlFor="birth_date"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Date of Birth
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />

                      <input
                        type="date"
                        id="birth_date"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        required
                        className="edupath-register-interactive w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                      />
                    </div>
                  </div>

                  {/* Gender */}

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Gender
                    </label>

                    <div className="relative">
                      <VenusAndMars
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />

                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="edupath-register-interactive w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                      >
                        <option value="">
                          Select gender
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>

              {/* Contact Information */}

              <div className="mb-8">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 dark:bg-[#14B8A6]/10 flex items-center justify-center">
                    <Phone
                      size={19}
                      className="text-[#0F766E] dark:text-[#5EEAD4]"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      Contact Information
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Provide your current contact details.
                    </p>
                  </div>
                </div>

                {/* Phone */}

                <div className="mb-4">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 09171234567"
                      required
                      autoComplete="tel"
                      className="edupath-register-interactive w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

                {/* Address */}

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Complete Address
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-4 top-4 text-gray-400"
                    />

                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House/Street, Barangay, Municipality/City, Province"
                      required
                      rows="3"
                      autoComplete="street-address"
                      className="edupath-register-interactive w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6] transition resize-none"
                    />
                  </div>
                </div>

              </div>

              {/* Account Information */}

              <div className="mb-8">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-[#14B8A6]/10 flex items-center justify-center">
                    <Mail
                      size={19}
                      className="text-[#123B5D] dark:text-[#5EEAD4]"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      Account Information
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      This email will be used to sign in.
                    </p>
                  </div>
                </div>

                {/* Email */}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
                      className="edupath-register-interactive w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                    />
                  </div>
                </div>

              </div>

              {/* Password Information */}

              <div className="mb-7">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#123B5D]/10 dark:bg-[#14B8A6]/10 flex items-center justify-center">
                    <LockKeyhole
                      size={19}
                      className="text-[#123B5D] dark:text-[#5EEAD4]"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">
                      Account Security
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Create a secure password for your account.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Password */}

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                        minLength="8"
                        autoComplete="new-password"
                        className="edupath-register-interactive w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#123B5D] dark:hover:text-[#5EEAD4] transition"
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

                  {/* Confirm Password */}

                  <div>
                    <label
                      htmlFor="password_confirmation"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type={
                          showConfirmation
                            ? 'text'
                            : 'password'
                        }
                        id="password_confirmation"
                        name="password_confirmation"
                        value={
                          formData.password_confirmation
                        }
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        minLength="8"
                        autoComplete="new-password"
                        className="edupath-register-interactive w-full pl-11 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#102A3D] text-gray-800 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#14354B] focus:outline-none focus:ring-2 focus:ring-[#123B5D]/20 dark:focus:ring-[#14B8A6]/20 focus:border-[#123B5D] dark:focus:border-[#14B8A6]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmation(
                            !showConfirmation
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#123B5D] dark:hover:text-[#5EEAD4] transition"
                        aria-label={
                          showConfirmation
                            ? 'Hide confirmation password'
                            : 'Show confirmation password'
                        }
                      >
                        {showConfirmation ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Password must contain at least 8 characters.
                </p>

              </div>

              {/* Applicant Notice */}

              <div className="mb-6 rounded-xl bg-[#123B5D]/5 dark:bg-[#14B8A6]/5 border border-[#123B5D]/10 dark:border-[#14B8A6]/10 p-4">
                <div className="flex items-start gap-3">
                  <UserRound
                    size={18}
                    className="mt-0.5 shrink-0 text-[#123B5D] dark:text-[#5EEAD4]"
                  />

                  <p className="text-sm text-[#123B5D] dark:text-gray-200 leading-6">
                    <span className="font-bold">
                      Applicant Account:
                    </span>{' '}
                    This registration is for incoming students
                    applying for admission and scholarships at
                    Trinidad Municipal College. Applicant accounts
                    are automatically created with the Applicant role.
                  </p>
                </div>
              </div>

              {/* Register Button */}

              <button
                type="submit"
                disabled={loading || isReturning}
                className="edupath-register-button w-full inline-flex items-center justify-center gap-2 bg-[#123B5D] hover:bg-[#0F3553] disabled:bg-gray-400 text-white font-semibold py-3.5 rounded-xl shadow-sm"
              >
                {loading ? (
                  <>
                    <Sparkles
                      size={18}
                      className="animate-pulse"
                    />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserRound size={18} />
                    Create Applicant Account
                  </>
                )}
              </button>

            </form>

            {/* Back to Login */}

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={loading || isReturning}
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-[#123B5D]
                  dark:text-[#5EEAD4]
                  hover:text-[#0F3553]
                  dark:hover:text-white
                  font-bold
                  text-sm
                  transition
                  duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                <ArrowLeft
                  size={16}
                  className="transition-transform duration-200 "
                />

                <span>
                  {isReturning
                    ? 'Returning to Sign In...'
                    : 'Back to Sign In'}
                </span>
              </button>
            </div>

          </div>

          {/* Footer */}

          <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-6">
            © 2026 Trinidad Municipal College
          </p>

        </div>
      </div>
    </>
  );
};

/*
 * Small inline graduation-cap icon component.
 */
const GraduationCapIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="relative z-10 text-[#F4B400]"
  >
    <path
      d="M2 10L12 5L22 10L12 15L2 10Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M6 12.5V16.5C6 16.5 8.5 19 12 19C15.5 19 18 16.5 18 16.5V12.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M22 10V15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default Register;