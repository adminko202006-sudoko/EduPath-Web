<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;

class ScholarshipController extends Controller
{
    /**
     * Display a listing of scholarships.
     */
    public function index()
    {
        $scholarships = Scholarship::latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Scholarships retrieved successfully.',
            'data' => $scholarships,
        ]);
    }

    /**
     * Store a newly created scholarship.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Basic information
            'name' => 'required|string|max:255',
            'provider' => 'nullable|string|max:255',
            'program_type' => 'nullable|string|max:255',
            'description' => 'nullable|string',

            // Program purpose
            'objectives' => 'nullable|string',
            'goals' => 'nullable|string',
            'target_beneficiaries' => 'nullable|string',

            // Eligibility and requirements
            'eligibility' => 'nullable|string',
            'requirements' => 'nullable|string',

            // Benefits
            'amount' => 'nullable|numeric|min:0',
            'benefits' => 'nullable|string',
            'covered_expenses' => 'nullable|string',

            // Application period
            'application_start' => 'nullable|date',
            'application_end' => 'nullable|date|after_or_equal:application_start',

            // Additional information
            'available_slots' => 'nullable|integer|min:0',
            'renewal_requirements' => 'nullable|string',
            'official_reference' => 'nullable|string|max:255',

            // Status
            'is_active' => 'sometimes|boolean',
        ]);

        $scholarship = Scholarship::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Scholarship created successfully.',
            'data' => $scholarship,
        ], 201);
    }

    /**
     * Display the specified scholarship.
     */
    public function show(Scholarship $scholarship)
    {
        $scholarship->load('scholarshipApplications.applicant.user');

        return response()->json([
            'success' => true,
            'message' => 'Scholarship retrieved successfully.',
            'data' => $scholarship,
        ]);
    }

    /**
     * Update the specified scholarship.
     */
    public function update(Request $request, Scholarship $scholarship)
    {
        $validated = $request->validate([
            // Basic information
            'name' => 'sometimes|required|string|max:255',
            'provider' => 'nullable|string|max:255',
            'program_type' => 'nullable|string|max:255',
            'description' => 'nullable|string',

            // Program purpose
            'objectives' => 'nullable|string',
            'goals' => 'nullable|string',
            'target_beneficiaries' => 'nullable|string',

            // Eligibility and requirements
            'eligibility' => 'nullable|string',
            'requirements' => 'nullable|string',

            // Benefits
            'amount' => 'nullable|numeric|min:0',
            'benefits' => 'nullable|string',
            'covered_expenses' => 'nullable|string',

            // Application period
            'application_start' => 'nullable|date',
            'application_end' => 'nullable|date|after_or_equal:application_start',

            // Additional information
            'available_slots' => 'nullable|integer|min:0',
            'renewal_requirements' => 'nullable|string',
            'official_reference' => 'nullable|string|max:255',

            // Status
            'is_active' => 'sometimes|boolean',
        ]);

        $scholarship->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Scholarship updated successfully.',
            'data' => $scholarship->fresh(),
        ]);
    }

    /**
     * Remove the specified scholarship.
     */
    public function destroy(Scholarship $scholarship)
    {
        $scholarship->delete();

        return response()->json([
            'success' => true,
            'message' => 'Scholarship deleted successfully.',
        ]);
    }

    /**
     * Display all scholarship applications.
     */
    public function applications()
    {
        $applications = ScholarshipApplication::with([
            'scholarship',
            'applicant.user',
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Scholarship applications retrieved successfully.',
            'data' => $applications,
        ]);
    }

    /**
     * Update a scholarship application status.
     */
    public function updateApplication(
        Request $request,
        ScholarshipApplication $application
    ) {
        $validated = $request->validate([
            'status' => 'required|in:pending,under_review,approved,rejected',
            'remarks' => 'nullable|string',
        ]);

        $application->update($validated);

        $application->load([
            'scholarship',
            'applicant.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Scholarship application updated successfully.',
            'data' => $application,
        ]);
    }
}