<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

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

        $verification = app(\App\Services\StudentVerificationService::class);
        $verification->ensureCanApply($applicant);

        // Formal applications require approved admission unless the scholarship
        // carries an official, documented exception configured by Admin.
        if ($scholarship->admission_approval_required && !$verification->hasScholarshipAdmission($applicant)) {
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
            // Optional as a whole for compatibility with older clients.
            'application_details' => 'sometimes|required|array:academic_average,grading_scale,year_level,income_range,household_size,motivation,additional_notes',
            'application_details.academic_average' => 'required_with:application_details|numeric|min:0|max:100',
            'application_details.grading_scale' => 'required_with:application_details|in:grade_point,percentage',
            'application_details.year_level' => 'required_with:application_details|in:Incoming Freshman,1st Year,2nd Year,3rd Year,4th Year',
            'application_details.income_range' => 'required_with:application_details|in:under_100000,100000_250000,250000_500000,above_500000',
            'application_details.household_size' => 'required_with:application_details|integer|min:1|max:1000',
            'application_details.motivation' => 'required_with:application_details|string|min:15|max:1000',
            'application_details.additional_notes' => 'nullable|string|max:2000',
            'supporting_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);
        if (isset($validated['application_details'])) {
            // Multipart fields arrive as strings; JSON and multipart clients
            // receive the same numeric representation in saved answers.
            $validated['application_details']['academic_average'] = (float) $validated['application_details']['academic_average'];
            $validated['application_details']['household_size'] = (int) $validated['application_details']['household_size'];
        }

        $requiredDocuments = $scholarship->required_documents ?? [];
        app(\App\Services\ScholarshipRequirementUploads::class)->validate($request, $requiredDocuments);
        $requirementUploads = [];
        $storedPaths = [];
        $path = null;
        try {
            foreach ($requiredDocuments as $index => $name) {
                $file = $request->file("requirement_documents.$index");
                $stored = $file->store('scholarship-documents', 'local');
                if (!$stored) abort(503, 'A required document could not be stored. Your application was not submitted.');
                $storedPaths[] = $stored;
                $requirementUploads[] = ['requirement' => $name, 'name' => basename(str_replace('\\', '/', $file->getClientOriginalName())), 'path' => $stored];
            }
            if ($request->hasFile('supporting_document')) {
                $path = $request->file('supporting_document')->store('scholarship-documents', 'local');
                if (!$path) {
                    abort(503, 'Your attachment could not be uploaded. Your application was not submitted. Please retry.');
                }
            }
            $application = DB::transaction(function () use ($applicant, $scholarship, $validated, $path, $request, $requiredDocuments, $requirementUploads) {
                DB::table('applicants')->where('id', $applicant->id)->lockForUpdate()->first();
                app(\App\Services\StudentVerificationService::class)->ensureCanApply($applicant->fresh());
                $current = Scholarship::whereKey($scholarship->id)->sharedLock()->firstOrFail();
                if (($current->required_documents ?? []) !== $requiredDocuments) {
                    throw ValidationException::withMessages(['requirement_documents' => ['The scholarship requirements changed. Reopen the application form and check the current requirements.']]);
                }
                $startsAt = $current->application_start_at ?? $current->application_start?->copy()->startOfDay();
                $endsAt = $current->application_end_at ?? $current->application_end?->copy()->endOfDay();
                if (!$current->is_active || ($startsAt && now()->lt($startsAt)) || ($endsAt && now()->gt($endsAt))) {
                    throw ValidationException::withMessages(['scholarship' => ['This scholarship is no longer accepting applications. Your application was not submitted.']]);
                }
                if ($current->admission_approval_required && !app(\App\Services\StudentVerificationService::class)->hasScholarshipAdmission($applicant)) {
                    throw ValidationException::withMessages(['admission' => ['Approved admission is required. Your application was not submitted.']]);
                }
                if (ScholarshipApplication::where('applicant_id', $applicant->id)->where('scholarship_id', $scholarship->id)->exists()) {
                    throw ValidationException::withMessages(['scholarship' => ['You have already applied for this scholarship.']]);
                }
                $values = [
                    'applicant_id' => $applicant->id,
                    'scholarship_id' => $scholarship->id,
                    'status' => 'pending',
                    // New forms never write applicant answers into reviewer remarks.
                    'remarks' => isset($validated['application_details']) ? null : ($validated['remarks'] ?? null),
                    'submitted_at' => now(),
                ];
                if (isset($validated['application_details'])) $values['application_details'] = $validated['application_details'];
                if ($requirementUploads) $values['requirement_documents'] = $requirementUploads;
                if ($path) {
                    $values['supporting_document_path'] = $path;
                    $values['supporting_document_name'] = basename(str_replace('\\', '/', $request->file('supporting_document')->getClientOriginalName()));
                }
                return ScholarshipApplication::create($values);
            }, 3);
        } catch (\Throwable $error) {
            foreach (array_merge($storedPaths, $path ? [$path] : []) as $cleanupPath) {
                try {
                    if (!Storage::disk('local')->delete($cleanupPath)) \Illuminate\Support\Facades\Log::warning('Failed to clean up new scholarship attachment after a failed submission.');
                } catch (\Throwable $cleanupError) { report($cleanupError); }
            }
            throw $error;
        }

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
