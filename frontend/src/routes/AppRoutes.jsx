import { Routes, Route, Navigate } from 'react-router-dom';

// ==========================================
// AUTH
// ==========================================

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyResetOtp from '../pages/auth/VerifyResetOtp';

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

import ApplicantDashboard from '../pages/applicant/Dashboard';
import ApplicantProfile from '../pages/applicant/Profile';
import AdmissionApplication from '../pages/applicant/AdmissionApplication';
import Documents from '../pages/applicant/Documents';
import ApplicantPrograms from '../pages/applicant/Programs';
import EntranceExam from '../pages/applicant/EntranceExam';
import Scholarships from '../pages/applicant/Scholarships';
import ScholarshipApplication from '../pages/applicant/ScholarshipApplication';
import Notifications from '../pages/applicant/Notifications';
import ApplicantAnnouncements from '../pages/applicant/Announcements';
import Settings from '../pages/applicant/Settings';

// ==========================================
// ADMIN
// ==========================================

import AdminDashboard from '../pages/admin/Dashboard';
import AdminPrograms from '../pages/admin/Programs';
import StaffManagement from '../pages/admin/StaffManagement';
import AdminScholarships from '../pages/admin/Scholarships';
import AdminScholarshipApplications from '../pages/admin/ScholarshipApplications';
import Requirements from '../pages/admin/Requirements';
import AdminApplicants from '../pages/admin/Applicants';
import ApplicantDetails from '../pages/admin/ApplicantDetails';
import EntranceExams from '../pages/admin/EntranceExams';
import Announcements from '../pages/admin/Announcements';
import AdminDocuments from '../pages/admin/Documents';
import AdmissionApplications from '../pages/admin/AdmissionApplications';
import AdmissionApplicationDetails from '../pages/admin/AdmissionApplicationDetails';
import ArchivedApplicants from '../pages/admin/ArchivedApplicants';
import AdminSettings from '../pages/admin/Settings';
import AdminProfile from '../pages/admin/Profile';

// ==========================================
// STAFF
// ==========================================

import StaffDashboard from '../pages/staff/Dashboard';
import StaffProfile from '../pages/staff/Profile';
import StaffAdmissionApplications from '../pages/staff/AdmissionApplications';
import StaffDocuments from '../pages/staff/Documents';
import StaffEntranceExams from '../pages/staff/EntranceExams';
import StaffAnnouncements from '../pages/staff/Announcements';
import StaffNotifications from '../pages/staff/Notifications';
import StaffReports from '../pages/staff/Reports';
import StaffSettings from '../pages/staff/Settings';
import ScholarshipApplications from '../pages/staff/ScholarshipApplications';



import About from '../pages/About';
// ==========================================
// APP ROUTES
// ==========================================

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

        <Route
          path="/applicant/settings"
          element={<Settings />}
        />

        <Route
          path="/about"
          element={<About />}
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