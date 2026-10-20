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
    public function applicationCounts(Request $request)
    {
        $staff = $request->user()->staff;
        if (!$staff || $staff->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'An active staff profile is required.'], 403);
        }
        $programIds = $staff->academicPrograms()->pluck('academic_programs.id');
        $permissions = $staff->permissions;

        return response()->json(['success' => true, 'data' => [
            'pending_applications' => $permissions?->manage_admissions
                ? AdmissionApplication::where('status', 'pending')->whereIn('academic_program_id', $programIds)->count() : 0,
            'pending_scholarship_applications' => $permissions?->manage_scholarships
                ? ScholarshipApplication::where('status', 'pending')
                    ->whereHas('applicant.admissionApplications', fn ($query) => $query->whereIn('academic_program_id', $programIds))->count() : 0,
        ]]);
    }

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

        $permissions = $staff->permissions;
        $canReport = (bool) $permissions?->view_reports;
        $canAdmissions = $canReport || (bool) $permissions?->manage_admissions;
        $canScholarships = $canReport || (bool) $permissions?->manage_scholarships;
        $canExams = $canReport || (bool) $permissions?->manage_exams;
        $canAnnouncements = (bool) $permissions?->manage_announcements;

        // Total applicants under assigned programs
        $totalApplicants = $canAdmissions ? Applicant::whereHas(
            'admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            }
        )->count() : 0;

        // Pending applications
        $pendingApplications = $canAdmissions ? AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
        ->where('status', 'pending')
        ->count() : 0;

        // Approved applications
        $approvedApplications = $canAdmissions ? AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
        ->where('status', 'approved')
        ->count() : 0;

        // Rejected applications
        $rejectedApplications = $canAdmissions ? AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
        ->where('status', 'rejected')
        ->count() : 0;

        // Scholarship applicants under assigned programs
        $scholarshipApplicants = $canScholarships ? ScholarshipApplication::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            }
        )->count() : 0;

        // Upcoming entrance exams for applicants under assigned programs
        $upcomingExams = $canExams ? EntranceExam::where(
            'exam_date',
            '>=',
            now()->toDateString()
        )
        ->where('is_active', true)
        ->whereHas('examAssignments.applicant.admissionApplications', function ($query) use ($programIds) {
            $query->whereIn('academic_program_id', $programIds);
        })
        ->count() : 0;

        // Published announcements
        $announcements = $canAnnouncements ? Announcement::where(
            'status',
            'published'
        )->where(function ($query) {
            $query->whereNull('published_at')->orWhere('published_at', '<=', now());
        })->count() : 0;

        // Recent applicants under assigned programs
        $recentApplicants = $canAdmissions ? Applicant::with([
            'user',
            'admissionApplications' => fn ($query) => $query->whereIn('academic_program_id', $programIds)->with('academicProgram'),
        ])
        ->whereHas(
            'admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            }
        )
        ->latest()
        ->take(5)
        ->get() : collect();

        return response()->json([
            'success' => true,
            'message' => 'Staff dashboard data retrieved successfully.',
            'data' => [
                'total_applicants' => $totalApplicants,
                'pending_applications' => $pendingApplications,
                'approved_applications' => $approvedApplications,
                'rejected_applications' => $rejectedApplications,
                'scholarship_applicants' => $scholarshipApplicants,
                'pending_scholarship_applications' => $canScholarships ? ScholarshipApplication::where('status', 'pending')
                    ->whereHas('applicant.admissionApplications', fn ($query) => $query->whereIn('academic_program_id', $programIds))
                    ->count() : 0,
                'upcoming_exams' => $upcomingExams,
                'published_announcements' => $announcements,
                'recent_applicants' => $recentApplicants,
            ],
        ]);
    }
}
