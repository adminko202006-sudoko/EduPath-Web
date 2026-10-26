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
            'applicant.admissionApplications' => fn ($query) => $query->whereIn('academic_program_id', $programIds)->with('academicProgram'),
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
            'applicant.admissionApplications' => fn ($query) => $query->whereIn('academic_program_id', $request->user()->staff->academicPrograms()->pluck('academic_programs.id'))->with('academicProgram'),
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

        if (in_array($application->status, ['approved', 'rejected'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'This application has an Admin review decision and can no longer be changed by Staff. The final scholarship award is recorded separately.',
            ], 409);
        }

        $validated = $request->validate([
            'staff_recommendation' => 'required|in:recommended,not_recommended,needs_information',
            'staff_recommendation_remarks' => 'nullable|string|max:2000',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($application,$request,$validated) {
            $locked=ScholarshipApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            abort_if(in_array($locked->status,['approved','rejected'],true),409,'This application has a final Admin review decision.');
            $old=$locked->staff_recommendation;
            $locked->fill($validated);
            $locked->staff_recommended_by=$request->user()->staff->id;
            $locked->staff_recommended_at=now();
            if($locked->status==='pending')$locked->status='under_review';
            $locked->save();
            app(\App\Services\WorkflowDecisionService::class)->event('scholarship',$locked->id,'staff_recommendation',$old,$locked->staff_recommendation,$locked->staff_recommendation_remarks,$request->user());
            $application->setRawAttributes($locked->getAttributes(),true);
        });

        $application->load([
            'scholarship',
            'applicant.user',
            'applicant.admissionApplications' => fn ($query) => $query->whereIn('academic_program_id', $request->user()->staff->academicPrograms()->pluck('academic_programs.id'))->with('academicProgram'),
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
