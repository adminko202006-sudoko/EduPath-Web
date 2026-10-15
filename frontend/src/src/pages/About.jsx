import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  HandHeart,
  Info,
  Landmark,
  Maximize2,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  School,
  ShieldCheck,
  Sparkles,
  UsersRound,
  UserRoundCheck,
  BriefcaseBusiness,
  X,
} from 'lucide-react';

import tmcLogo from '../assets/tmcLogo.jpg';

import campusImage from '../assets/about/tmc-campus.jpg';
import studentsImage from '../assets/about/tmc-students.jpg';
import facultyImage from '../assets/about/tmc-faculty.jpg';
import classroomImage from '../assets/about/tmc-classroom.jpg';
import activitiesImage from '../assets/about/tmc-activities.jpg';
import communityImage from '../assets/about/tmc-community.jpg';

const About = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const images = [
    {
      id: 'campus',
      title: 'TMC Campus',
      description:
        'The Trinidad Municipal College campus and learning environment.',
      image: campusImage,
    },
    {
      id: 'students',
      title: 'Students',
      description:
        'Students pursuing their educational goals at Trinidad Municipal College.',
      image: studentsImage,
    },
    {
      id: 'faculty',
      title: 'Faculty and Staff',
      description:
        'Faculty and staff supporting students throughout their academic journey.',
      image: facultyImage,
    },
    {
      id: 'classroom',
      title: 'Learning Environment',
      description:
        'A learning environment designed to support academic development.',
      image: classroomImage,
    },
    {
      id: 'activities',
      title: 'School Activities',
      description:
        'Academic, student, and community activities at the college.',
      image: activitiesImage,
    },
    {
      id: 'community',
      title: 'Community Engagement',
      description:
        'Activities that connect the college with its surrounding community.',
      image: communityImage,
    },
  ];

  const features = [
    {
      icon: ClipboardCheck,
      title: 'Admission Management',
      description:
        'A centralized digital process for submitting and monitoring admission applications.',
    },
    {
      icon: FileCheck2,
      title: 'Document Management',
      description:
        'Upload, review, verify, and monitor admission documents in one place.',
    },
    {
      icon: Award,
      title: 'Scholarship Management',
      description:
        'Discover scholarship opportunities and manage scholarship applications.',
    },
    {
      icon: GraduationCap,
      title: 'Entrance Examinations',
      description:
        'Keep track of entrance examination schedules, assignments, and status.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Portal',
      description:
        'Role-based access helps keep applicant, staff, and administrative information protected.',
    },
    {
      icon: Sparkles,
      title: 'Digital Experience',
      description:
        'A modern and organized platform designed to make the admission journey easier.',
    },
  ];

  const beneficiaries = [
    {
      icon: GraduationCap,
      title: 'Applicants',
      description:
        'Incoming students can create an account, submit admission applications, manage requirements, upload documents, monitor examination schedules, and receive important notifications.',
      badge: 'Primary Users',
    },
    {
      icon: Award,
      title: 'Scholarship Applicants',
      description:
        'Students can discover available scholarship opportunities, review eligibility information, submit applications, upload supporting documents, and monitor their scholarship application status.',
      badge: 'Student Services',
    },
    {
      icon: ClipboardCheck,
      title: 'Admission Staff',
      description:
        'Admission personnel can review applications, verify submitted documents, monitor applicant progress, and manage admission-related information more efficiently.',
      badge: 'Operations',
    },
    {
      icon: HandHeart,
      title: 'Scholarship Staff',
      description:
        'Scholarship personnel can manage scholarship applications, review applicant information and documents, and monitor scholarship processing.',
      badge: 'Student Support',
    },
    {
      icon: ShieldCheck,
      title: 'Administrators',
      description:
        'Administrators can manage programs, requirements, scholarships, announcements, examinations, applicants, staff access, and system information.',
      badge: 'System Management',
    },
  ];

  const values = [
    {
      icon: UsersRound,
      title: 'Student-Centered',
      description:
        'Designed around the needs of applicants throughout the admission process.',
    },
    {
      icon: HandHeart,
      title: 'Service',
      description:
        'Helping applicants access important admission information and services more conveniently.',
    },
    {
      icon: ShieldCheck,
      title: 'Integrity',
      description:
        'Supporting organized handling of applications, documents, and academic information.',
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description:
        'Using technology to create a more accessible and efficient admission experience.',
    },
  ];

  // ==========================================
  // IMAGE VIEWER
  // ==========================================

  const openImage = (image) => {
    setSelectedImage(image);
    setZoom(1);
    setPosition({
      x: 0,
      y: 0,
    });
  };

  const closeImage = () => {
    setSelectedImage(null);
    setZoom(1);
    setPosition({
      x: 0,
      y: 0,
    });
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({
      x: 0,
      y: 0,
    });
  };

  const zoomIn = () => {
    setZoom((current) =>
      Math.min(
        Number((current + 0.25).toFixed(2)),
        4
      )
    );
  };

  const zoomOut = () => {
    setZoom((current) => {
      const next = Math.max(
        Number((current - 0.25).toFixed(2)),
        0.5
      );

      if (next <= 1) {
        setPosition({
          x: 0,
          y: 0,
        });
      }

      return next;
    });
  };

  const changeImage = (direction) => {
    if (!selectedImage) {
      return;
    }

    const currentIndex = images.findIndex(
      (image) => image.id === selectedImage.id
    );

    if (currentIndex === -1) {
      return;
    }

    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % images.length
        : (currentIndex - 1 + images.length) %
          images.length;

    setSelectedImage(images[nextIndex]);

    setZoom(1);

    setPosition({
      x: 0,
      y: 0,
    });
  };

  // ==========================================
  // KEYBOARD CONTROLS
  // ==========================================

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeImage();
      }

      if (event.key === 'ArrowRight') {
        changeImage('next');
      }

      if (event.key === 'ArrowLeft') {
        changeImage('previous');
      }

      if (event.key === '+') {
        zoomIn();
      }

      if (event.key === '=') {
        zoomIn();
      }

      if (event.key === '-') {
        zoomOut();
      }

      if (event.key === '0') {
        resetZoom();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );

      document.body.style.overflow = '';
    };
  }, [selectedImage, zoom]);

  // ==========================================
  // MOUSE DRAG / PAN
  // ==========================================

  const handleMouseDown = (event) => {
    if (zoom <= 1) {
      return;
    }

    event.preventDefault();

    setIsDragging(true);

    dragStart.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
  };

  const handleMouseMove = (event) => {
    if (!isDragging || zoom <= 1) {
      return;
    }

    setPosition({
      x: event.clientX - dragStart.current.x,
      y: event.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-8 pb-10 page-transition">

      {/* ==========================================
          HERO
      ========================================== */}

      <section className="relative overflow-hidden rounded-2xl bg-[#123B5D] shadow-sm">

        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />

        <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#F4B400]/10" />

        <div className="relative p-7 sm:p-10 lg:p-12">

          <div className="max-w-4xl">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider">

              <Info size={14} />

              About EduPath

            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-5 leading-tight">
              Connecting Students to Their Educational Journey
            </h1>

            <p className="text-blue-100 text-base sm:text-lg leading-relaxed mt-5 max-w-3xl">
              EduPath is the digital admission and scholarship
              management platform designed for Trinidad Municipal
              College. It brings important admission services,
              requirements, documents, scholarships, and
              examinations together in one organized portal.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">

              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[#F4B400] hover:bg-[#D9A000] text-white font-semibold px-5 py-3 rounded-xl transition-colors duration-200  hover:shadow-lg"
              >
                Get Started

                <ArrowRight size={17} />

              </Link>

              <a
                href="#gallery"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold px-5 py-3 rounded-xl transition-colors duration-200"
              >
                Explore Gallery

                <Maximize2 size={17} />

              </a>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          TMC INTRODUCTION
      ========================================== */}

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <div className="lg:col-span-3 ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-7">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-12 h-12 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center">

              <Landmark
                size={23}
                className="text-[#123B5D] dark:text-blue-400"
              />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#F4B400]">
                Trinidad Municipal College
              </p>

              <h2 className="text-2xl font-bold text-[#123B5D] dark:text-white mt-1">
                About TMC
              </h2>

            </div>

          </div>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Trinidad Municipal College is the educational
            institution represented within the EduPath system.
            EduPath provides a centralized digital environment
            where applicants can interact with admission-related
            services and monitor their application journey.
          </p>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
            The platform is designed to reduce unnecessary
            manual processes and make important admission
            information easier to access and manage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">

            <div className="p-4 rounded-xl bg-[#F4F7FA] dark:bg-gray-800">

              <School
                size={21}
                className="text-[#123B5D] dark:text-blue-400"
              />

              <h3 className="font-bold text-gray-800 dark:text-white mt-3">
                Education
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Supporting students throughout their educational journey.
              </p>

            </div>

            <div className="p-4 rounded-xl bg-[#F4F7FA] dark:bg-gray-800">

              <BookOpen
                size={21}
                className="text-[#123B5D] dark:text-blue-400"
              />

              <h3 className="font-bold text-gray-800 dark:text-white mt-3">
                Learning
              </h3>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Encouraging accessible and organized academic services.
              </p>

            </div>

          </div>

        </div>

        <div className="lg:col-span-2 ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">

          <div className="h-full min-h-[320px] relative">

            <img
              src={campusImage}
              alt="Trinidad Municipal College campus"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#123B5D]/90 via-[#123B5D]/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6">

              <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-lg mb-4">

                <img
                  src={tmcLogo}
                  alt="Trinidad Municipal College logo"
                  className="w-full h-full object-contain rounded-xl"
                />

              </div>

              <h3 className="text-2xl font-bold text-white">
                Trinidad Municipal College
              </h3>

              <p className="text-blue-100 text-sm mt-1">
                Education • Service • Community
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          ABOUT EDUPATH
      ========================================== */}

      <section className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">

        <div className="p-7 sm:p-8">

          <div className="flex items-center gap-3 mb-7">

            <div className="w-12 h-12 rounded-xl bg-[#F4B400]/10 flex items-center justify-center">

              <Sparkles
                size={23}
                className="text-[#D9A000]"
              />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#F4B400]">
                The Platform
              </p>

              <h2 className="text-2xl font-bold text-[#123B5D] dark:text-white mt-1">
                What is EduPath?
              </h2>

            </div>

          </div>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl">
            EduPath is a web-based admission and scholarship
            management system created to organize the different
            processes involved in student applications. Instead
            of managing admission information through disconnected
            processes, the platform provides one central location
            for applicants, staff, and administrators.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">

            {features.map((feature) => {

              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[#123B5D]/20 dark:hover:border-blue-500/20 hover:shadow-md transition-colors duration-200"
                >

                  <div className="w-11 h-11 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center  transition-transform duration-200">

                    <Icon
                      size={21}
                      className="text-[#123B5D] dark:text-blue-400"
                    />

                  </div>

                  <h3 className="font-bold text-gray-800 dark:text-white mt-4">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                    {feature.description}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

      </section>

      {/* ==========================================
          BENEFICIARIES
      ========================================== */}

      <section
        id="beneficiaries"
        className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
      >

        <div className="p-7 sm:p-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div className="max-w-3xl">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center">

                  <UsersRound
                    size={23}
                    className="text-[#123B5D] dark:text-blue-400"
                  />

                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-[#F4B400]">
                    Who We Serve
                  </p>

                  <h2 className="text-2xl font-bold text-[#123B5D] dark:text-white mt-1">
                    Who Benefits from EduPath?
                  </h2>

                </div>

              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-5">
                EduPath connects applicants and school personnel
                through one centralized admission and scholarship
                management platform. Each user group benefits from
                features designed around their role in the admission
                and scholarship process.
              </p>

            </div>

            <div className="inline-flex items-center gap-2 self-start lg:self-auto px-4 py-2.5 rounded-xl bg-[#F4F7FA] dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">

              <UserRoundCheck size={15} />

              Connected Services

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">

            {beneficiaries.map((beneficiary) => {

              const Icon = beneficiary.icon;

              return (
                <div
                  key={beneficiary.title}
                  className="group relative p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-[#123B5D]/20 dark:hover:border-blue-500/20 hover:shadow-md  transition-colors duration-200"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="w-12 h-12 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0  transition-transform duration-200">

                      <Icon
                        size={22}
                        className="text-[#123B5D] dark:text-blue-400"
                      />

                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full bg-[#F4B400]/10 text-[#B88600] dark:text-[#F4C542] border border-[#F4B400]/15 whitespace-nowrap">
                      {beneficiary.badge}
                    </span>

                  </div>

                  <h3 className="font-bold text-gray-800 dark:text-white text-lg mt-5">
                    {beneficiary.title}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                    {beneficiary.description}
                  </p>

                </div>
              );
            })}

          </div>

          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-[#123B5D]/5 dark:bg-blue-500/10 border border-[#123B5D]/10 dark:border-blue-500/20">

            <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0">

              <BriefcaseBusiness
                size={18}
                className="text-[#123B5D] dark:text-blue-400"
              />

            </div>

            <div>

              <p className="text-sm font-semibold text-[#123B5D] dark:text-blue-300">
                One platform, connected processes
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                EduPath brings applicant services and institutional
                admission and scholarship processes together in one
                organized digital environment.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          GALLERY
      ========================================== */}

      <section
        id="gallery"
        className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden"
      >

        <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-gray-800">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-xl bg-[#123B5D]/10 dark:bg-blue-500/10 flex items-center justify-center">

                <Maximize2
                  size={22}
                  className="text-[#123B5D] dark:text-blue-400"
                />

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-[#F4B400]">
                  TMC Gallery
                </p>

                <h2 className="text-2xl font-bold text-[#123B5D] dark:text-white mt-1">
                  Explore Our College
                </h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Click any image to view it in full screen.
                </p>

              </div>

            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F4F7FA] dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">

              <MousePointer2 size={14} />

              Click to enlarge

            </div>

          </div>

        </div>

        <div className="p-5 sm:p-7">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {images.map((image, index) => {

              const featured =
                index === 0 ||
                index === 5;

              return (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => openImage(image)}
                  className={`group relative overflow-hidden rounded-2xl text-left border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 ${
                    featured
                      ? 'lg:col-span-1'
                      : ''
                  }`}
                >

                  <div className="aspect-[4/3] overflow-hidden">

                    <img
                      src={image.image}
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-200 "
                    />

                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-200" />

                  <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100  scale-90 transition-colors duration-200">

                    <Maximize2 size={18} />

                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5">

                    <p className="text-white font-bold text-lg">
                      {image.title}
                    </p>

                    <p className="text-white/75 text-xs mt-1 line-clamp-2">
                      {image.description}
                    </p>

                  </div>

                </button>
              );
            })}

          </div>

        </div>

      </section>

      {/* ==========================================
          VALUES
      ========================================== */}

      <section className="ep-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">

        <div className="p-7 sm:p-8">

          <div className="text-center max-w-2xl mx-auto">

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#F4B400]/10">

              <Award
                size={23}
                className="text-[#D9A000]"
              />

            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#F4B400] mt-4">
              Our Approach
            </p>

            <h2 className="text-2xl font-bold text-[#123B5D] dark:text-white mt-1">
              What EduPath Stands For
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              The platform is designed around a simple goal:
              making admission services organized and accessible.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">

            {values.map((value) => {

              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="text-center p-5 rounded-2xl bg-[#F4F7FA] dark:bg-gray-800  transition-transform duration-200"
                >

                  <div className="w-12 h-12 mx-auto rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">

                    <Icon
                      size={22}
                      className="text-[#123B5D] dark:text-blue-400"
                    />

                  </div>

                  <h3 className="font-bold text-gray-800 dark:text-white mt-4">
                    {value.title}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                    {value.description}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

      </section>

      {/* ==========================================
          CTA
      ========================================== */}

      <section className="bg-[#123B5D] rounded-2xl p-7 sm:p-8 shadow-sm">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="flex items-center gap-2 text-[#F4B400]">

              <CheckCircle2 size={19} />

              <span className="text-sm font-bold">
                Start Your Journey
              </span>

            </div>

            <h2 className="text-2xl font-bold text-white mt-2">
              Ready to begin your admission journey?
            </h2>

            <p className="text-blue-100 text-sm mt-2 max-w-2xl">
              Create an account and use EduPath to manage your
              admission requirements and application information.
            </p>

          </div>

          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-[#F4B400] hover:bg-[#D9A000] text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200  hover:shadow-lg whitespace-nowrap"
          >
            Create Account

            <ArrowRight size={18} />

          </Link>

        </div>

      </section>

      {/* ==========================================
          IMAGE LIGHTBOX
      ========================================== */}

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeImage();
            }
          }}
        >

          {/* TOP BAR */}

          <div className="absolute top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-5 flex items-center justify-between gap-3 z-20">

            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 text-white">

              <p className="font-bold text-sm">
                {selectedImage.title}
              </p>

              <p className="text-xs text-white/60 mt-0.5">
                {images.findIndex(
                  (image) =>
                    image.id === selectedImage.id
                ) + 1}{' '}
                / {images.length}
              </p>

            </div>

            <button
              type="button"
              onClick={closeImage}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors duration-200"
              aria-label="Close image viewer"
            >
              <X size={22} />
            </button>

          </div>

          {/* PREVIOUS */}

          <button
            type="button"
            onClick={() =>
              changeImage('previous')
            }
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black/50 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors duration-200"
            aria-label="Previous image"
          >

            <ChevronLeft size={25} />

          </button>

          {/* IMAGE AREA */}

          <div className="w-full h-full flex items-center justify-center overflow-hidden">

            <img
              src={selectedImage.image}
              alt={selectedImage.title}
              draggable={false}
              onMouseDown={handleMouseDown}
              className={`max-w-[92vw] max-h-[78vh] sm:max-w-[88vw] sm:max-h-[82vh] object-contain rounded-lg select-none ${
                zoom > 1
                  ? isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-default'
              }`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging
                  ? 'none'
                  : 'transform 250ms ease-out',
              }}
            />

          </div>

          {/* NEXT */}

          <button
            type="button"
            onClick={() =>
              changeImage('next')
            }
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-black/50 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-colors duration-200"
            aria-label="Next image"
          >

            <ChevronRight size={25} />

          </button>

          {/* BOTTOM CONTROLS */}

          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20">

            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/65 backdrop-blur-md border border-white/10 rounded-2xl p-2">

              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                className="w-10 h-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                aria-label="Zoom out"
              >
                <Minus size={19} />
              </button>

              <button
                type="button"
                onClick={resetZoom}
                className="min-w-[68px] h-10 rounded-xl px-3 text-white hover:bg-white/10 font-semibold text-sm transition"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= 4}
                className="w-10 h-10 rounded-xl text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                aria-label="Zoom in"
              >
                <Plus size={19} />
              </button>

              <div className="w-px h-6 bg-white/15 mx-1" />

              <button
                type="button"
                onClick={resetZoom}
                className="w-10 h-10 rounded-xl text-white hover:bg-white/10 flex items-center justify-center transition"
                title="Reset image"
                aria-label="Reset image"
              >
                <RotateCcw size={18} />
              </button>

            </div>

          </div>

          {/* ZOOM HINT */}

          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-[11px] whitespace-nowrap hidden sm:block">

            Use + / − to zoom • Drag when zoomed • ← / → to navigate • Esc to close

          </div>

        </div>
      )}

    </div>
  );
};

export default About;

