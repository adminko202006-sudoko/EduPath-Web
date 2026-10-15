<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\AdmissionApplication;
use App\Models\ScholarshipApplication;
use App\Models\EntranceExam;
use App\Models\Announcement;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $staff = $request->user()->staff;

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 403);
        }

        if ($staff->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your staff account is inactive.',
            ], 403);
        }

        // Get the academic programs assigned to this staff member
        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        // Total applicants under assigned programs
        $totalApplicants = Applicant::whereHas(
            'admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            }
        )->count();

        // Pending applications
        $pendingApplications = AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
        ->where('status', 'pending')
        ->count();

        // Approved applications
        $approvedApplications = AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
        ->where('status', 'approved')
        ->count();

        // Rejected applications
        $rejectedApplications = AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
        ->where('status', 'rejected')
        ->count();

        // Scholarship applicants under assigned programs
        $scholarshipApplicants = ScholarshipApplication::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            }
        )->count();

        // Upcoming entrance exams for applicants under assigned programs
        $upcomingExams = EntranceExam::where(
            'exam_date',
            '>=',
            now()->toDateString()
        )
        ->where('is_active', true)
        ->whereHas('examAssignments.applicant.admissionApplications', function ($query) use ($programIds) {
            $query->whereIn('academic_program_id', $programIds);
        })
        ->count();

        // Published announcements
        $announcements = Announcement::where(
            'status',
            'published'
        )->count();

        // Recent applicants under assigned programs
        $recentApplicants = Applicant::with([
            'user',
            'admissionApplications.academicProgram'
        ])
        ->whereHas(
            'admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            }
        )
        ->latest()
        ->take(5)
        ->get();

        return response()->json([
            'success' => true,
            'message' => 'Staff dashboard data retrieved successfully.',
            'data' => [
                'total_applicants' => $totalApplicants,
                'pending_applications' => $pendingApplications,
                'approved_applications' => $approvedApplications,
                'rejected_applications' => $rejectedApplications,
                'scholarship_applicants' => $scholarshipApplicants,
                'upcoming_exams' => $upcomingExams,
                'published_announcements' => $announcements,
                'recent_applicants' => $recentApplicants,
            ],
        ]);
    }
}