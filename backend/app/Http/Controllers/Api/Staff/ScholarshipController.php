<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;

class ScholarshipController extends Controller
{
    /**
     * Get scholarship applications belonging to applicants
     * from the staff's assigned programs.
     */
    public function index(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $applications = ScholarshipApplication::with([
            'scholarship',
            'applicant.user',
            'applicant.admissionApplications.academicProgram',
        ])
            ->whereHas(
                'applicant.admissionApplications',
                function ($query) use ($programIds) {
                    $query->whereIn(
                        'academic_program_id',
                        $programIds
                    );
                }
            )
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Scholarship applications retrieved successfully.',
            'data' => $applications,
        ]);
    }

    /**
     * View a specific scholarship application.
     */
    public function show(
        Request $request,
        ScholarshipApplication $application
    ) {
        $this->ensureAssignedApplication(
            $request,
            $application
        );

        $application->load([
            'scholarship',
            'applicant.user',
            'applicant.admissionApplications.academicProgram',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Scholarship application retrieved successfully.',
            'data' => $application,
        ]);
    }

    /**
     * Update a scholarship application.
     */
    public function update(
        Request $request,
        ScholarshipApplication $application
    ) {
        $this->ensureAssignedApplication(
            $request,
            $application
        );

        $validated = $request->validate([
            'status' => 'required|in:pending,under_review,approved,rejected',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $application->update($validated);

        $application->load([
            'scholarship',
            'applicant.user',
            'applicant.admissionApplications.academicProgram',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Scholarship application updated successfully.',
            'data' => $application,
        ]);
    }

    /**
     * Get the active staff profile.
     */
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

    /**
     * Ensure the scholarship application belongs
     * to an applicant in an assigned program.
     */
    private function ensureAssignedApplication(
        Request $request,
        ScholarshipApplication $application
    ) {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $belongsToAssignedProgram = $application
            ->applicant
            ->admissionApplications()
            ->whereIn(
                'academic_program_id',
                $programIds
            )
            ->exists();

        if (!$belongsToAssignedProgram) {
            abort(response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to access this scholarship application.',
            ], 403));
        }
    }
}