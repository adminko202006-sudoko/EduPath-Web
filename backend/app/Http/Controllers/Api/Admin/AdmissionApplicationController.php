<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionApplicationController extends Controller
{
    /** Create an application for an applicant during the current open period. */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'applicant_id' => 'required|integer|exists:applicants,id',
            'academic_program_id' => 'required|integer|exists:academic_programs,id',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $application = app(\App\Services\AdmissionSubmissionService::class)->submit(
            (int) $validated['applicant_id'], (int) $validated['academic_program_id'], $validated['remarks'] ?? null, $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Admission application created successfully.',
            'data' => $application->load(['applicant.user', 'academicProgram', 'documents', 'histories.user']),
        ], 201);
    }

    /**
     * Display all admission applications.
     */
    public function index(Request $request)
    {
        $query = AdmissionApplication::with([
            'applicant.user',
            'academicProgram',
            'documents',
            'histories.user',
        ]);

        // Search by applicant name or email
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->whereHas('applicant', function ($applicantQuery) use ($search) {
                    $applicantQuery
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('email', 'like', "%{$search}%");
                        });
                });

                $q->orWhereHas('academicProgram', function ($programQuery) use ($search) {
                    $programQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Sorting
        switch ($request->get('sort', 'date_desc')) {
            case 'name_asc':
                $query->join(
                    'applicants',
                    'admission_applications.applicant_id',
                    '=',
                    'applicants.id'
                )
                    ->orderBy('applicants.last_name', 'asc')
                    ->orderBy('applicants.first_name', 'asc')
                    ->select('admission_applications.*');
                break;

            case 'name_desc':
                $query->join(
                    'applicants',
                    'admission_applications.applicant_id',
                    '=',
                    'applicants.id'
                )
                    ->orderBy('applicants.last_name', 'desc')
                    ->orderBy('applicants.first_name', 'desc')
                    ->select('admission_applications.*');
                break;

            case 'date_asc':
                $query->orderBy('created_at', 'asc');
                break;

            case 'date_desc':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $applications = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Admission applications retrieved successfully.',
            'data' => $applications,
        ]);
    }

    /**
     * Display a specific admission application.
     */
    public function show(AdmissionApplication $application)
    {
        $application->load([
            'applicant.user',
            'academicProgram',
            'documents',
            'histories.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission application retrieved successfully.',
            'data' => $application,
        ]);
    }

    /** Update only editable application details; workflow status is handled by approve/reject. */
    public function update(Request $request, AdmissionApplication $application)
    {
        $validated = $request->validate([
            'academic_program_id' => 'sometimes|required|integer|exists:academic_programs,id',
            'remarks' => 'sometimes|nullable|string|max:1000',
        ]);

        if (!$validated) {
            return response()->json(['success' => false, 'message' => 'Provide at least one editable field.'], 422);
        }

        return DB::transaction(function () use ($request, $application, $validated) {
            $locked = AdmissionApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if (!in_array($locked->status, ['pending', 'rejected'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending or rejected applications can be edited.',
                ], 409);
            }

            $locked->fill($validated);
            $locked->save();

            AdmissionApplicationHistory::create([
                'admission_application_id' => $locked->id,
                'user_id' => $request->user()->id,
                'action' => 'application_updated',
                'old_status' => $locked->status,
                'new_status' => $locked->status,
                'remarks' => 'Application details updated by an administrator.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Admission application updated successfully.',
                'data' => $locked->load(['applicant.user', 'academicProgram', 'documents', 'histories.user']),
            ]);
        }, 3);
    }

    /** Withdraw instead of hard-deleting so documents and the audit trail remain intact. */
    public function destroy(Request $request, AdmissionApplication $application)
    {
        return DB::transaction(function () use ($request, $application) {
            $locked = AdmissionApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if (!in_array($locked->status, ['pending', 'rejected'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending or rejected applications can be withdrawn.',
                ], 409);
            }

            $oldStatus = $locked->status;
            $locked->update(['status' => 'withdrawn']);
            AdmissionApplicationHistory::create([
                'admission_application_id' => $locked->id,
                'user_id' => $request->user()->id,
                'action' => 'withdrawn',
                'old_status' => $oldStatus,
                'new_status' => 'withdrawn',
                'remarks' => 'Withdrawn by an administrator; record and documents retained.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Application withdrawn. Its record and documents were retained for audit.',
                'data' => ['id' => $locked->id, 'status' => $locked->status],
            ]);
        }, 3);
    }

    /**
     * Approve an admission application.
     */
    public function approve(
        Request $request,
        AdmissionApplication $application
    ) {
        if ($application->status === 'withdrawn') {
            return response()->json([
                'success' => false,
                'message' => 'A withdrawn application cannot be approved.',
            ], 409);
        }

        app(\App\Services\WorkflowDecisionService::class)->admission($application, 'approved', null, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Admission application approved successfully.',
            'data' => $application->load([
                'applicant.user',
                'academicProgram',
                'documents',
                'histories.user',
            ]),
        ]);
    }

    /**
     * Reject an admission application.
     */
    public function reject(
        Request $request,
        AdmissionApplication $application
    ) {
        if ($application->status === 'withdrawn') {
            return response()->json([
                'success' => false,
                'message' => 'A withdrawn application cannot be rejected.',
            ], 409);
        }

        $validated = $request->validate([
            'remarks' => 'nullable|string|max:1000',
        ]);

        app(\App\Services\WorkflowDecisionService::class)->admission($application, 'rejected', $validated['remarks'] ?? null, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Admission application rejected successfully.',
            'data' => $application->load([
                'applicant.user',
                'academicProgram',
                'documents',
                'histories.user',
            ]),
        ]);
    }
}
