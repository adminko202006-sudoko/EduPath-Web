<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionController extends Controller
{
    public function index(Request $request)
    {
        $applicant = $request->user()->applicant;
        abort_unless($applicant, 403, 'Applicant profile not found.');

        $applications = AdmissionApplication::with([
            'academicProgram',
            'admissionPeriod',
            'documents',
            'histories.user',
        ])
            ->where('applicant_id', $applicant->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Admission applications retrieved successfully.',
            'data' => $applications,
        ]);
    }

    public function store(Request $request)
    {
        $applicant = $request->user()->applicant;
        abort_unless($applicant, 403, 'Applicant profile not found.');

        $validated = $request->validate([
            'academic_program_id' => 'required|exists:academic_programs,id',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $application = app(\App\Services\AdmissionSubmissionService::class)->submit(
            $applicant->id, (int) $validated['academic_program_id'], $validated['remarks'] ?? null, $request->user()
        );

        $application->load([
            'academicProgram',
            'admissionPeriod',
            'documents',
            'histories.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission application submitted successfully.',
            'data' => $application,
        ], 201);
    }

    public function show(
        Request $request,
        AdmissionApplication $application
    ) {
        $applicant = $request->user()->applicant;

        if (!$applicant || (int) $application->applicant_id !== (int) $applicant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $application->load([
            'academicProgram',
            'admissionPeriod',
            'documents',
            'histories.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission application retrieved successfully.',
            'data' => $application,
        ]);
    }

    /**
     * Withdraw a pending or rejected application while preserving its audit trail and files.
     */
    public function withdraw(
        Request $request,
        AdmissionApplication $application
    ) {
        $applicant = $request->user()->applicant;

        if (!$applicant || (int) $application->applicant_id !== (int) $applicant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        return DB::transaction(function () use ($request, $application, $applicant) {
            $lockedApplication = AdmissionApplication::whereKey($application->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedApplication || (int) $lockedApplication->applicant_id !== (int) $applicant->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access.',
                ], 403);
            }

            if (!in_array($lockedApplication->status, ['pending', 'rejected'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending or rejected admission applications can be withdrawn.',
                ], 409);
            }

            $oldStatus = $lockedApplication->status;
            $lockedApplication->update(['status' => 'withdrawn']);

            AdmissionApplicationHistory::create([
                'admission_application_id' => $lockedApplication->id,
                'user_id' => $request->user()->id,
                'action' => 'withdrawn',
                'old_status' => $oldStatus,
                'new_status' => 'withdrawn',
                'remarks' => 'Withdrawn by applicant.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Admission application withdrawn. Its history and documents have been preserved.',
                'data' => [
                    'id' => $lockedApplication->id,
                    'status' => $lockedApplication->status,
                ],
            ]);
        }, 3);
    }
}
