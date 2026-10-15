<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use App\Models\AdmissionPeriod;
use Illuminate\Http\Request;

class AdmissionController extends Controller
{
    public function index(Request $request)
    {
        $applicant = $request->user()->applicant;

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

        $validated = $request->validate([
            'academic_program_id' => 'required|exists:academic_programs,id',
            'remarks' => 'nullable|string',
        ]);

        $today = now()->toDateString();

        $admissionPeriod = AdmissionPeriod::where('status', 'open')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        if (!$admissionPeriod) {
            return response()->json([
                'success' => false,
                'message' => 'There is currently no open admission period.',
            ], 422);
        }

        $application = AdmissionApplication::create([
            'applicant_id' => $applicant->id,
            'academic_program_id' => $validated['academic_program_id'],
            'admission_period_id' => $admissionPeriod->id,
            'status' => 'pending',
            'remarks' => $validated['remarks'] ?? null,
            'submitted_at' => now(),
        ]);

        AdmissionApplicationHistory::create([
            'admission_application_id' => $application->id,
            'user_id' => $request->user()->id,
            'action' => 'submitted',
            'old_status' => null,
            'new_status' => 'pending',
            'remarks' => $validated['remarks'] ?? null,
        ]);

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

        if ($application->applicant_id !== $applicant->id) {
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
}