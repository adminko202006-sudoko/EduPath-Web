<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Applicant;
use App\Models\AdmissionApplication;
use App\Models\ApplicationDocument;
use App\Models\EntranceExam;
use App\Models\AcademicProgram;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use App\Models\User;

class DashboardController extends Controller
{
    /** Sidebar polling needs counts only, not the full dashboard and its records. */
    public function applicationCounts()
    {
        return response()->json(['success' => true, 'data' => [
            'pending_applications' => AdmissionApplication::where('status', 'pending')->count(),
            'pending_scholarship_applications' => ScholarshipApplication::where('status', 'pending')->count(),
        ]]);
    }

    /**
     * Display admin dashboard statistics.
     */
    public function index()
    {
        // ==========================================
        // APPLICANTS
        // ==========================================

        $totalApplicants = Applicant::count();


        // ==========================================
        // ADMISSION APPLICATIONS
        // ==========================================

        $totalApplications = AdmissionApplication::count();

        $pendingApplications = AdmissionApplication::where(
            'status',
            'pending'
        )->count();

        $approvedApplications = AdmissionApplication::where(
            'status',
            'approved'
        )->count();

        $rejectedApplications = AdmissionApplication::where(
            'status',
            'rejected'
        )->count();


        // ==========================================
        // STAFF
        // ==========================================

        $totalStaff = User::where(
            'role',
            'staff'
        )->count();


        // ==========================================
        // ACADEMIC PROGRAMS
        // ==========================================

        $totalPrograms = AcademicProgram::count();

        $activePrograms = AcademicProgram::where(
            'is_active',
            true
        )->count();


        // ==========================================
        // DOCUMENTS
        // ==========================================

        $totalDocuments = ApplicationDocument::count();

        $pendingDocuments = ApplicationDocument::where(
            'status',
            'pending'
        )->count();

        $verifiedDocuments = ApplicationDocument::whereIn(
            'status',
            ['verified', 'approved']
        )->count();

        $rejectedDocuments = ApplicationDocument::where(
            'status',
            'rejected'
        )->count();


        // ==========================================
        // SCHOLARSHIPS
        // ==========================================

        $scholarshipApplicants = ScholarshipApplication::count();

        $activeScholarships = Scholarship::where(
            'is_active',
            true
        )->count();


        // ==========================================
        // ENTRANCE EXAMS
        // ==========================================

        $upcomingExams = EntranceExam::where(
            'exam_date',
            '>=',
            now()->toDateString()
        )
            ->where(
                'is_active',
                true
            )
            ->count();


        // ==========================================
        // ANNOUNCEMENTS
        // ==========================================

        $announcements = Announcement::where(
            'status',
            'published'
        )->count();


        // ==========================================
        // RECENT APPLICANTS
        // ==========================================

        $recentApplicants = Applicant::with('user')
            ->latest()
            ->take(5)
            ->get();


        // ==========================================
        // RESPONSE
        // ==========================================

        return response()->json([
            'success' => true,

            'message' => 'Dashboard data retrieved successfully.',

            'data' => [

                // Applicants
                'total_applicants' => $totalApplicants,

                // Staff
                'total_staff' => $totalStaff,

                // Applications
                'total_applications' => $totalApplications,
                'pending_applications' => $pendingApplications,
                'approved_applications' => $approvedApplications,
                'rejected_applications' => $rejectedApplications,

                // Academic Programs
                'total_programs' => $totalPrograms,
                'active_programs' => $activePrograms,

                // Documents
                'total_documents' => $totalDocuments,
                'pending_documents' => $pendingDocuments,
                'verified_documents' => $verifiedDocuments,
                'rejected_documents' => $rejectedDocuments,

                // Scholarships
                'scholarship_applicants' => $scholarshipApplicants,
                'pending_scholarship_applications' => ScholarshipApplication::where('status', 'pending')->count(),
                'active_scholarships' => $activeScholarships,

                // Entrance Exams
                'upcoming_exams' => $upcomingExams,

                // Announcements
                'published_announcements' => $announcements,

                // Recent Applicants
                'recent_applicants' => $recentApplicants,
            ],
        ]);
    }
}
