<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use Illuminate\Http\Request;

class AdmissionApplicationController extends Controller
{
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

    /**
     * Approve an admission application.
     */
    public function approve(
        Request $request,
        AdmissionApplication $application
    ) {
        $oldStatus = $application->status;

        $application->update([
            'status' => 'approved',
        ]);

        AdmissionApplicationHistory::create([
            'admission_application_id' => $application->id,
            'user_id' => $request->user()->id,
            'action' => 'status_updated',
            'old_status' => $oldStatus,
            'new_status' => 'approved',
            'remarks' => null,
        ]);

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
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:1000',
        ]);

        $oldStatus = $application->status;

        $application->update([
            'status' => 'rejected',
            'remarks' => $validated['remarks'] ?? null,
        ]);

        AdmissionApplicationHistory::create([
            'admission_application_id' => $application->id,
            'user_id' => $request->user()->id,
            'action' => 'status_updated',
            'old_status' => $oldStatus,
            'new_status' => 'rejected',
            'remarks' => $validated['remarks'] ?? null,
        ]);

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