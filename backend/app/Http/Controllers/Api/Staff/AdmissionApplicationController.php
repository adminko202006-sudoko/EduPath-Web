<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use Illuminate\Http\Request;

class AdmissionApplicationController extends Controller
{
    private function getAssignedProgramIds(Request $request)
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

        return $staff->academicPrograms()
            ->pluck('academic_programs.id');
    }

    public function index(Request $request)
    {
        $programIds = $this->getAssignedProgramIds($request);

        $query = AdmissionApplication::with([
            'applicant.user',
            'academicProgram',
            'documents',
            'histories.user',
        ])->whereIn('academic_program_id', $programIds);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->whereHas('applicant', function ($applicantQuery) use ($search) {
                    $applicantQuery
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });

                $q->orWhereHas('academicProgram', function ($programQuery) use ($search) {
                    $programQuery->where(
                        'name',
                        'like',
                        "%{$search}%"
                    );
                });
            });
        }

        if (
            $request->filled('status') &&
            $request->status !== 'all'
        ) {
            $query->where(
                'status',
                $request->status
            );
        }

        switch ($request->get('sort', 'date_desc')) {
            case 'name_asc':
                $query->join(
                    'applicants',
                    'admission_applications.applicant_id',
                    '=',
                    'applicants.id'
                )
                    ->orderBy(
                        'applicants.last_name',
                        'asc'
                    )
                    ->orderBy(
                        'applicants.first_name',
                        'asc'
                    )
                    ->select(
                        'admission_applications.*'
                    );
                break;

            case 'name_desc':
                $query->join(
                    'applicants',
                    'admission_applications.applicant_id',
                    '=',
                    'applicants.id'
                )
                    ->orderBy(
                        'applicants.last_name',
                        'desc'
                    )
                    ->orderBy(
                        'applicants.first_name',
                        'desc'
                    )
                    ->select(
                        'admission_applications.*'
                    );
                break;

            case 'date_asc':
                $query->orderBy(
                    'created_at',
                    'asc'
                );
                break;

            case 'date_desc':
            default:
                $query->orderBy(
                    'created_at',
                    'desc'
                );
                break;
        }

        $applications = $query->get();

        return response()->json([
            'success' => true,
            'message' =>
                'Admission applications retrieved successfully.',
            'data' => $applications,
        ]);
    }

    public function show(
        Request $request,
        AdmissionApplication $application
    ) {
        $this->ensureAssignedApplication(
            $request,
            $application
        );

        $application->load([
            'applicant.user',
            'academicProgram',
            'documents',
            'histories.user',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Admission application retrieved successfully.',
            'data' => $application,
        ]);
    }

    public function approve(
        Request $request,
        AdmissionApplication $application
    ) {
        $this->ensureAssignedApplication(
            $request,
            $application
        );

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
            'message' =>
                'Admission application approved successfully.',
            'data' => $application->load([
                'applicant.user',
                'academicProgram',
                'documents',
                'histories.user',
            ]),
        ]);
    }

    public function reject(
        Request $request,
        AdmissionApplication $application
    ) {
        $this->ensureAssignedApplication(
            $request,
            $application
        );

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
            'message' =>
                'Admission application rejected successfully.',
            'data' => $application->load([
                'applicant.user',
                'academicProgram',
                'documents',
                'histories.user',
            ]),
        ]);
    }

    private function ensureAssignedApplication(
        Request $request,
        AdmissionApplication $application
    ) {
        $programIds = $this->getAssignedProgramIds(
            $request
        );

        if (
            !$programIds->contains(
                $application->academic_program_id
            )
        ) {
            abort(response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to access this application.',
            ], 403));
        }
    }
}