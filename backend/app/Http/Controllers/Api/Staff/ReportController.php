<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\Applicant;
use App\Models\ExamAssignment;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        /*
        |--------------------------------------------------------------------------
        | Admission Statistics
        |--------------------------------------------------------------------------
        */

        $totalApplicants = Applicant::whereHas(
            'admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )->count();

        $pendingApplications = AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
            ->where('status', 'pending')
            ->count();

        $approvedApplications = AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
            ->where('status', 'approved')
            ->count();

        $rejectedApplications = AdmissionApplication::whereIn(
            'academic_program_id',
            $programIds
        )
            ->where('status', 'rejected')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Scholarship Statistics
        |--------------------------------------------------------------------------
        */

        $scholarshipApplicants = ScholarshipApplication::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )->count();

        $approvedScholarships = ScholarshipApplication::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )
            ->where('status', 'approved')
            ->count();

        $pendingScholarships = ScholarshipApplication::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )
            ->where('status', 'pending')
            ->count();

        $rejectedScholarships = ScholarshipApplication::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )
            ->where('status', 'rejected')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Entrance Examination Statistics
        |--------------------------------------------------------------------------
        */

        $totalExamAssignments = ExamAssignment::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )->count();

        $scheduledExams = ExamAssignment::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )
            ->where('status', 'scheduled')
            ->count();

        $completedExams = ExamAssignment::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )
            ->where('status', 'completed')
            ->count();

        $absentExams = ExamAssignment::whereHas(
            'applicant.admissionApplications',
            function ($query) use ($programIds) {
                $query->whereIn(
                    'academic_program_id',
                    $programIds
                );
            }
        )
            ->where('status', 'absent')
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Recent Admission Applications
        |--------------------------------------------------------------------------
        */

        $recentApplications = AdmissionApplication::with([
            'applicant.user',
            'academicProgram',
        ])
            ->whereIn('academic_program_id', $programIds)
            ->latest()
            ->limit(10)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Program Summary
        |--------------------------------------------------------------------------
        */

        $programSummary = $staff->academicPrograms()
            ->withCount([
                'admissionApplications',
            ])
            ->get()
            ->map(function ($program) {
                return [
                    'id' => $program->id,
                    'name' => $program->name,
                    'code' => $program->code,
                    'total_applications' =>
                        $program->admission_applications_count,
                    'pending_applications' =>
                        $program->admissionApplications()
                            ->where('status', 'pending')
                            ->count(),
                    'approved_applications' =>
                        $program->admissionApplications()
                            ->where('status', 'approved')
                            ->count(),
                    'rejected_applications' =>
                        $program->admissionApplications()
                            ->where('status', 'rejected')
                            ->count(),
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Staff reports retrieved successfully.',
            'data' => [
                'summary' => [
                    'total_applicants' => $totalApplicants,
                    'pending_applications' => $pendingApplications,
                    'approved_applications' => $approvedApplications,
                    'rejected_applications' => $rejectedApplications,
                    'scholarship_applicants' => $scholarshipApplicants,
                    'approved_scholarships' => $approvedScholarships,
                    'pending_scholarships' => $pendingScholarships,
                    'rejected_scholarships' => $rejectedScholarships,
                    'total_exam_assignments' => $totalExamAssignments,
                    'scheduled_exams' => $scheduledExams,
                    'completed_exams' => $completedExams,
                    'absent_exams' => $absentExams,
                ],
                'programs' => $programSummary,
                'recent_applications' => $recentApplications,
            ],
        ]);
    }

    private function getActiveStaff(Request $request)
    {
        $staff = $request->user()->staff;

        if (!$staff) {
            abort(response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 403));
        }

        if ($staff->status !== 'active') {
            abort(response()->json([
                'success' => false,
                'message' => 'Your staff account is inactive.',
            ], 403));
        }

        return $staff;
    }
}
