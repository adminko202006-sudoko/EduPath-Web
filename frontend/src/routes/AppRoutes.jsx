import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazyRoute } from '../services/routePreload';

// ==========================================
// AUTH
// ==========================================

const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ApplicantVerification = lazyRoute('/applicant/verification', () => import('../pages/applicant/Verification'));
const StudentVerifications = lazyRoute('/admin/student-verifications', () => import('../pages/admin/StudentVerifications'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const VerifyResetOtp = lazy(() => import('../pages/auth/VerifyResetOtp'));

// ==========================================
// LAYOUTS
// ==========================================

import ApplicantLayout from '../layouts/ApplicantLayout';
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';



// ==========================================
// PROTECTED ROUTE
// ==========================================

import ProtectedRoute from '../components/ProtectedRoute';

// ==========================================
// APPLICANT
// ==========================================

const ApplicantDashboard = lazyRoute('/applicant/dashboard', () => import('../pages/applicant/Dashboard'));
const ApplicantProfile = lazyRoute('/applicant/profile', () => import('../pages/applicant/Profile'));
const AdmissionApplication = lazyRoute('/applicant/admission', () => import('../pages/applicant/AdmissionApplication'));
const Documents = lazyRoute('/applicant/documents', () => import('../pages/applicant/Documents'));
const ApplicantPrograms = lazyRoute('/applicant/programs', () => import('../pages/applicant/Programs'));
const EntranceExam = lazyRoute('/applicant/exams', () => import('../pages/applicant/EntranceExam'));
const Scholarships = lazyRoute('/applicant/scholarships', () => import('../pages/applicant/Scholarships'));
const ScholarshipApplication = lazyRoute('/applicant/scholarship-applications', () => import('../pages/applicant/ScholarshipApplication'));
const Notifications = lazyRoute('/applicant/notifications', () => import('../pages/applicant/Notifications'));
const ApplicantAnnouncements = lazyRoute('/applicant/announcements', () => import('../pages/applicant/Announcements'));
const Settings = lazyRoute('/applicant/settings', () => import('../pages/applicant/Settings'));
const OnlineScholarshipExam = lazyRoute('/applicant/online-scholarship-exam', () => import('../pages/applicant/OnlineScholarshipExam'));

// ==========================================
// ADMIN
// ==========================================

const AdminDashboard = lazyRoute('/admin/dashboard', () => import('../pages/admin/Dashboard'));
const AdminPrograms = lazyRoute('/admin/programs', () => import('../pages/admin/Programs'));
const StaffManagement = lazyRoute('/admin/staff', () => import('../pages/admin/StaffManagement'));
const AdminScholarships = lazyRoute('/admin/scholarships', () => import('../pages/admin/Scholarships'));
const OnlineExamManagement = lazyRoute('/admin/online-exams', () => import('../pages/admin/OnlineExamManagement'));
const AdminScholarshipApplications = lazyRoute('/admin/scholarship-applications', () => import('../pages/admin/ScholarshipApplications'));
const Requirements = lazyRoute('/admin/requirements', () => import('../pages/admin/Requirements'));
const AdminApplicants = lazyRoute('/admin/applicants', () => import('../pages/admin/Applicants'));
const ApplicantDetails = lazyRoute('/admin/applicants/:id', () => import('../pages/admin/ApplicantDetails'));
const EntranceExams = lazyRoute('/admin/exams', () => import('../pages/admin/EntranceExams'));
const Announcements = lazyRoute('/admin/announcements', () => import('../pages/admin/Announcements'));
const AdminDocuments = lazyRoute('/admin/documents', () => import('../pages/admin/Documents'));
const AdmissionApplications = lazyRoute('/admin/admission-applications', () => import('../pages/admin/AdmissionApplications'));
const AdmissionApplicationDetails = lazyRoute('/admin/admission-applications/:id', () => import('../pages/admin/AdmissionApplicationDetails'));
const ArchivedApplicants = lazyRoute('/admin/applicants/archived', () => import('../pages/admin/ArchivedApplicants'));
const AdminSettings = lazyRoute('/admin/settings', () => import('../pages/admin/Settings'));
const AdminProfile = lazyRoute('/admin/profile', () => import('../pages/admin/Profile'));
const AdminReports = lazyRoute('/admin/reports', () => import('../pages/admin/Reports'));

// ==========================================
// STAFF
// ==========================================

const StaffDashboard = lazyRoute('/staff/dashboard', () => import('../pages/staff/Dashboard'));
const StaffProfile = lazyRoute('/staff/profile', () => import('../pages/staff/Profile'));
const StaffAdmissionApplications = lazyRoute('/staff/admission-applications', () => import('../pages/staff/AdmissionApplications'));
const StaffDocuments = lazyRoute('/staff/documents', () => import('../pages/staff/Documents'));
const StaffEntranceExams = lazyRoute('/staff/exams', () => import('../pages/staff/EntranceExams'));
const StaffOnlineExams = lazyRoute('/staff/online-exams', () => import('../pages/staff/OnlineExamReview'));
const StaffAnnouncements = lazyRoute('/staff/announcements', () => import('../pages/staff/Announcements'));
const StaffNotifications = lazyRoute('/staff/notifications', () => import('../pages/staff/Notifications'));
const StaffReports = lazyRoute('/staff/reports', () => import('../pages/staff/Reports'));
const StaffSettings = lazyRoute('/staff/settings', () => import('../pages/staff/Settings'));
const ScholarshipApplications = lazyRoute('/staff/scholarship-applications', () => import('../pages/staff/ScholarshipApplications'));



const About = lazyRoute('/about', () => import('../pages/About'));
// ==========================================
// APP ROUTES
// ==========================================

const UserGuide = lazyRoute(['/applicant/guide', '/staff/guide'], () => import('../pages/help/UserGuide'));

const AppRoutes = () => {
  return (
    <Routes>

      {/* ==================================================
          PUBLIC ROUTES
          ================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/verify-reset-otp"
        element={<VerifyResetOtp />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      <Route
        path="/about"
        element={<About />}
      />



      {/* ==================================================
          APPLICANT ROUTES
          
          ApplicantLayout is mounted once for the entire
          applicant section.
          ================================================== */}

      <Route
        element={
          <ProtectedRoute role="applicant">
            <ApplicantLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/applicant/dashboard"
          element={<ApplicantDashboard />}
        />
        <Route path="/applicant/verification" element={<ApplicantVerification />} />

        <Route
          path="/applicant/profile"
          element={<ApplicantProfile />}
        />

        <Route
          path="/applicant/admission"
          element={<AdmissionApplication />}
        />

        <Route
          path="/applicant/documents"
          element={<Documents />}
        />

        <Route
          path="/applicant/programs"
          element={<ApplicantPrograms />}
        />

        <Route
          path="/applicant/exams"
          element={<EntranceExam />}
        />

        <Route
          path="/applicant/scholarships"
          element={<Scholarships />}
        />

        <Route
          path="/applicant/scholarship-applications"
          element={<ScholarshipApplication />}
        />

        <Route
          path="/applicant/notifications"
          element={<Notifications />}
        />

        <Route
          path="/applicant/announcements"
          element={<ApplicantAnnouncements />}
        />

        <Route path="/applicant/guide" element={<UserGuide />} />

        <Route
          path="/applicant/settings"
          element={<Settings />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/applicant/online-scholarship-exam"
          element={<OnlineScholarshipExam />}
        />


      </Route>


      {/* ==================================================
          ADMIN ROUTES
          
          AdminLayout is mounted once for the entire
          admin section.
          ================================================== */}

      <Route
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />
        <Route path="/admin/student-verifications" element={<StudentVerifications />} />
        <Route path="/admin/reports" element={<AdminReports />} />

        <Route
          path="/admin/programs"
          element={<AdminPrograms />}
        />

        <Route
          path="/admin/staff"
          element={<StaffManagement />}
        />

        <Route
          path="/admin/scholarships"
          element={<AdminScholarships />}
        />

        <Route
          path="/admin/online-exams"
          element={<OnlineExamManagement />}
        />

        <Route
          path="/admin/scholarship-applications"
          element={<AdminScholarshipApplications />}
        />

        <Route
          path="/admin/requirements"
          element={<Requirements />}
        />

        <Route
          path="/admin/applicants"
          element={<AdminApplicants />}
        />

        <Route
          path="/admin/applicants/:id"
          element={<ApplicantDetails />}
        />

        <Route
          path="/admin/exams"
          element={<EntranceExams />}
        />

        <Route
          path="/admin/announcements"
          element={<Announcements />}
        />

        <Route
          path="/admin/documents"
          element={<AdminDocuments />}
        />

        <Route
          path="/admin/admission-applications"
          element={<AdmissionApplications />}
        />

        <Route
          path="/admin/applicants/archived"
          element={<ArchivedApplicants />}
        />

        <Route
          path="/admin/admission-applications/:id"
          element={<AdmissionApplicationDetails />}
        />

        <Route
          path="/admin/settings"
          element={<AdminSettings />}
        />

        <Route
          path="/admin/profile"
          element={<AdminProfile />}
        />

        <Route
          path="/about"
          element={<About />}
        />  

      </Route>


      {/* ==================================================
          STAFF ROUTES
          
          StaffLayout is mounted once for the entire
          staff section.
          ================================================== */}

      <Route
        element={
          <ProtectedRoute role="staff">
            <StaffLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/staff/dashboard"
          element={<StaffDashboard />}
        />

        <Route
          path="/staff/profile"
          element={<StaffProfile />}
        />

        <Route
          path="/staff/admission-applications"
          element={<StaffAdmissionApplications />}
        />

        <Route
          path="/staff/documents"
          element={<StaffDocuments />}
        />

        <Route
          path="/staff/online-exams"
          element={<StaffOnlineExams />}
        />

        <Route
          path="/staff/exams"
          element={<StaffEntranceExams />}
        />

        <Route
          path="/staff/announcements"
          element={<StaffAnnouncements />}
        />

        <Route
          path="/staff/notifications"
          element={<StaffNotifications />}
        />

        <Route
          path="/staff/reports"
          element={<StaffReports />}
        />

        <Route
          path="/staff/scholarship-applications"
          element={<ScholarshipApplications />}
        />

        <Route path="/staff/guide" element={<UserGuide />} />

        <Route
          path="/staff/settings"
          element={<StaffSettings />}
        />

        <Route
          path="/about"
          element={<About />}
        />  

      </Route>


      {/* ==================================================
          DEFAULT ROUTES
          ================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
};

export default AppRoutes;
