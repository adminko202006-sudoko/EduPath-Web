<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;

class ScholarshipController extends Controller
{
    /**
     * Display available scholarships.
     */
    public function index()
    {
        $scholarships = Scholarship::where('is_active', true)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Available scholarships retrieved successfully.',
            'data' => $scholarships,
        ]);
    }

    /**
     * Display a specific scholarship.
     */
    public function show(Scholarship $scholarship)
    {
        if (!$scholarship->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This scholarship is not currently available.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Scholarship retrieved successfully.',
            'data' => $scholarship,
        ]);
    }

    /**
     * Apply for a scholarship.
     */
    public function apply(Request $request, Scholarship $scholarship)
    {
        $applicant = $request->user()->applicant;

        if (!$applicant) {
            return response()->json(['success' => false, 'message' => 'Applicant profile not found.'], 403);
        }

        // Formal applications require approved admission unless the scholarship
        // carries an official, documented exception configured by Admin.
        if ($scholarship->admission_approval_required && !\Illuminate\Support\Facades\DB::table('admission_applications')
            ->where('applicant_id', $applicant->id)
            ->where('status', 'approved')
            ->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Your admission application must be approved before applying for this scholarship.',
            ], 403);
        }

        // Check if the scholarship is active.
        if (!$scholarship->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This scholarship is not currently available.',
            ], 400);
        }

        // Precise UTC window for new records; legacy date fields remain supported.
        $startsAt = $scholarship->application_start_at;
        if (!$startsAt && $scholarship->application_start) {
            $startsAt = $scholarship->application_start->copy()->startOfDay();
        }
        if ($startsAt && now()->lt($startsAt)) {
            return response()->json([
                'success' => false,
                'message' => 'The application period has not started yet.',
            ], 400);
        }

        $endsAt = $scholarship->application_end_at;
        if (!$endsAt && $scholarship->application_end) {
            $endsAt = $scholarship->application_end->copy()->endOfDay();
        }
        if ($endsAt && now()->gt($endsAt)) {
            return response()->json([
                'success' => false,
                'message' => 'The application period for this scholarship has ended.',
            ], 400);
        }

        // Check whether the applicant has already applied.
        $existingApplication = ScholarshipApplication::where(
            'applicant_id',
            $applicant->id
        )
            ->where('scholarship_id', $scholarship->id)
            ->first();

        if ($existingApplication) {
            return response()->json([
                'success' => false,
                'message' => 'You have already applied for this scholarship.',
                'data' => $existingApplication,
            ], 409);
        }

        // Awards are not restricted by fixed slot counts.

        $validated = $request->validate([
            'remarks' => 'nullable|string',
        ]);

        $application = ScholarshipApplication::create([
            'applicant_id' => $applicant->id,
            'scholarship_id' => $scholarship->id,
            'status' => 'pending',
            'remarks' => $validated['remarks'] ?? null,
            'submitted_at' => now(),
        ]);

        $application->load('scholarship');

        return response()->json([
            'success' => true,
            'message' => 'Scholarship application submitted successfully.',
            'data' => $application,
        ], 201);
    }

    /**
     * Display the applicant's scholarship applications.
     */
    public function myApplications(Request $request)
    {
        $applicant = $request->user()->applicant;

        $applications = ScholarshipApplication::with('scholarship')
            ->where('applicant_id', $applicant->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Your scholarship applications retrieved successfully.',
            'data' => $applications,
        ]);
    }

    /**
     * Display a specific scholarship application.
     */
    public function application(
        Request $request,
        ScholarshipApplication $application
    ) {
        $applicant = $request->user()->applicant;

        if ($application->applicant_id !== $applicant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $application->load('scholarship');

        return response()->json([
            'success' => true,
            'message' => 'Scholarship application retrieved successfully.',
            'data' => $application,
        ]);
    }
}
