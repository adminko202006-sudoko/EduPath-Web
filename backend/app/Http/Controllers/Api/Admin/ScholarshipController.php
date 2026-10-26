<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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
            'category' => 'required|in:unifast,tes_tdp,other',
            'requires_online_exam' => 'sometimes|boolean',
            'requires_face_to_face_exam' => 'sometimes|boolean',
            'description' => 'nullable|string',

            // Program purpose
            'objectives' => 'nullable|string',
            'goals' => 'nullable|string',
            'target_beneficiaries' => 'nullable|string',

            // Eligibility and requirements
            'eligibility' => 'nullable|string',
            'requirements' => 'nullable|string',
            'required_documents' => 'sometimes|array|max:10',
            'required_documents.*' => 'required|string|max:255|distinct:ignore_case|regex:/\S/',

            // Benefits
            'amount' => 'nullable|numeric|min:0',
            'benefits' => 'nullable|string',
            'covered_expenses' => 'nullable|string',

            // Application period
            'application_start' => 'nullable|date',
            'application_end' => 'nullable|date|after_or_equal:application_start',
            'application_start_at' => 'nullable|date',
            'application_end_at' => 'nullable|date|after_or_equal:application_start_at',

            // Additional information
            'available_slots' => 'nullable|integer|min:0',
            'unlimited_awards' => 'sometimes|boolean',
            'admission_approval_required' => 'sometimes|boolean',
            'exam_question_count' => 'sometimes|integer|min:1|max:500',
            'exam_seconds_per_question' => 'sometimes|integer|min:10|max:600',
            'exam_passing_score' => 'sometimes|integer|min:0|max:100',
            'renewal_requirements' => 'nullable|string',
            'official_reference' => 'nullable|string|max:255',

            // Status
            'is_active' => 'sometimes|boolean',
        ]);

        $this->validateRequiredDocuments($validated);
        $validated = $this->normalizeApplicationWindow($validated);
        $validated = $this->applyCategoryRules($validated);
        if (($validated['admission_approval_required'] ?? true) === false && empty($validated['official_reference'])) {
            return response()->json(['success' => false, 'message' => 'An official reference is required when admission approval is waived.'], 422);
        }
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
            'category' => 'sometimes|required|in:unifast,tes_tdp,other',
            'requires_online_exam' => 'sometimes|boolean',
            'requires_face_to_face_exam' => 'sometimes|boolean',
            'description' => 'nullable|string',

            // Program purpose
            'objectives' => 'nullable|string',
            'goals' => 'nullable|string',
            'target_beneficiaries' => 'nullable|string',

            // Eligibility and requirements
            'eligibility' => 'nullable|string',
            'requirements' => 'nullable|string',
            'required_documents' => 'sometimes|array|max:10',
            'required_documents.*' => 'required|string|max:255|distinct:ignore_case|regex:/\S/',

            // Benefits
            'amount' => 'nullable|numeric|min:0',
            'benefits' => 'nullable|string',
            'covered_expenses' => 'nullable|string',

            // Application period
            'application_start' => 'nullable|date',
            'application_end' => 'nullable|date|after_or_equal:application_start',
            'application_start_at' => 'nullable|date',
            'application_end_at' => 'nullable|date|after_or_equal:application_start_at',

            // Additional information
            'available_slots' => 'nullable|integer|min:0',
            'unlimited_awards' => 'sometimes|boolean',
            'admission_approval_required' => 'sometimes|boolean',
            'exam_question_count' => 'sometimes|integer|min:1|max:500',
            'exam_seconds_per_question' => 'sometimes|integer|min:10|max:600',
            'exam_passing_score' => 'sometimes|integer|min:0|max:100',
            'renewal_requirements' => 'nullable|string',
            'official_reference' => 'nullable|string|max:255',

            // Status
            'is_active' => 'sometimes|boolean',
        ]);

        $this->validateRequiredDocuments($validated, $scholarship);
        $validated = $this->normalizeApplicationWindow($validated);
        $validated = $this->applyCategoryRules($validated, $scholarship);
        if (($validated['admission_approval_required'] ?? $scholarship->admission_approval_required) === false && empty($validated['official_reference'] ?? $scholarship->official_reference)) {
            return response()->json(['success' => false, 'message' => 'An official reference is required when admission approval is waived.'], 422);
        }
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

        app(\App\Services\WorkflowDecisionService::class)->scholarship($application, $validated, $request->user());

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

    /** Normalize datetime-local/ISO inputs to UTC before writing DATETIME columns. */
    private function validateRequiredDocuments(array $validated, ?Scholarship $existing = null): void
    {
        if (!array_key_exists('required_documents', $validated)) return;
        $saved = $existing?->required_documents ?? [];
        $newNames = array_diff($validated['required_documents'], $saved);
        if (!$newNames) return;
        $available = \App\Models\AdmissionRequirement::where('is_active', true)
            ->whereIn('name', $newNames)->pluck('name')->all();
        $errors = [];
        foreach ($validated['required_documents'] as $index => $name) {
            if (!in_array($name, $saved, true) && !in_array($name, $available, true)) {
                $errors["required_documents.$index"] = ['Select a document from the active Requirement List.'];
            }
        }
        if ($errors) throw \Illuminate\Validation\ValidationException::withMessages($errors);
    }

    private function normalizeApplicationWindow(array $validated): array
    {
        foreach (['application_start_at', 'application_end_at'] as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] !== null && $validated[$field] !== '') {
                $validated[$field] = Carbon::parse($validated[$field])->utc()->format('Y-m-d H:i:s');
            }
        }
        return $validated;
    }

    /** Enforce the agreed category rules on the server, not just in the UI. */
    private function applyCategoryRules(array $validated, ?Scholarship $existing = null): array
    {
        $category = $validated['category'] ?? $existing?->category ?? 'other';
        $identity = new Scholarship([
            'name' => $validated['name'] ?? $existing?->name,
            'program_type' => $validated['program_type'] ?? $existing?->program_type,
        ]);
        if (app(\App\Services\FheEntranceEligibilityService::class)->applies($identity)) $category = 'unifast';
        $validated['category'] = $category;
        $admissionApprovalRequired = $validated['admission_approval_required'] ?? $existing?->admission_approval_required ?? true;
        $validated['admission_approval_required'] = (bool) $admissionApprovalRequired;

        // All categories follow the approved no-fixed-slot policy.
        $validated['unlimited_awards'] = true;
        $validated['available_slots'] = null;

        if ($category === 'unifast') {
            $validated['requires_online_exam'] = false;
            $validated['requires_face_to_face_exam'] = true;
        } elseif ($category === 'tes_tdp') {
            $validated['requires_online_exam'] = false;
            $validated['requires_face_to_face_exam'] = false;
        } else {
            $validated['requires_online_exam'] = true;
            $validated['requires_face_to_face_exam'] = false;
            $validated['exam_question_count'] = \App\Models\OnlineExamSetting::requiredQuestionCount();
            $validated['exam_seconds_per_question'] = \App\Models\OnlineExamSetting::secondsPerQuestion();
            $validated['exam_passing_score'] = 50;
        }

        return $validated;
    }


}
