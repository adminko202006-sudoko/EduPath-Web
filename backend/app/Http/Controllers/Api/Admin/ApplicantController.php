<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use Illuminate\Http\Request;

class ApplicantController extends Controller
{
    
    /**
     * Display a listing of applicants.
     */
    public function index(Request $request)
    {
        $query = Applicant::with([
            'user',
            'admissionApplications.academicProgram',
            'admissionApplications.documents',
        ]);
        $query->where('is_archived', false);
        // Search by applicant name or email
        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by academic program
        if ($request->filled('program_id')) {
            $programId = $request->program_id;

            $query->whereHas('admissionApplications', function ($q) use ($programId) {
                $q->where('academic_program_id', $programId);
            });
        }

        // Filter by admission application status
        if ($request->filled('status')) {
            $status = $request->status;

            $query->whereHas('admissionApplications', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        // Filter by document verification status
        if ($request->filled('document_status')) {
            $documentStatus = $request->document_status;

            $query->whereHas('admissionApplications.documents', function ($q) use ($documentStatus) {
                $q->where('status', $documentStatus);
            });
        }

        $applicants = $query->latest()->get();

        $applicants->each(function ($applicant) {
            $profileName = collect([
                $applicant->first_name,
                $applicant->middle_name,
                $applicant->last_name,
            ])
                ->filter()
                ->implode(' ');

            $applicant->display_name =
                $profileName ?: ($applicant->user?->name ?? 'Unnamed Applicant');
        });

        return response()->json([
            'success' => true,
            'message' => 'Applicants retrieved successfully.',
            'data' => $applicants,
        ]);
    }

    /**
     * Display the specified applicant.
     */
    public function show(Applicant $applicant)
    {
        $applicant->load([
            'user',
            'admissionApplications.academicProgram',
            'admissionApplications.documents',
            'scholarshipApplications.scholarship',
            'examAssignments.entranceExam',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Applicant retrieved successfully.',
            'data' => $applicant,
        ]);
    }

    /**
     * Update applicant information.
     */
    public function update(Request $request, Applicant $applicant)
    {
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string',
        ]);

        $applicant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Applicant updated successfully.',
            'data' => $applicant->load('user'),
        ]);
    }

    /**
     * Archive an applicant.
     *
     * Since the current applicants table does not have an
     * archived column, this method is intentionally not
     * implemented yet.
     */
    public function destroy(Applicant $applicant)
    {
        $applicant->update([
            'is_archived' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Applicant archived successfully.',
            'data' => $applicant,
        ]);
    }
    public function restore(Applicant $applicant)
    {
        $applicant->update([
            'is_archived' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Applicant restored successfully.',
            'data' => $applicant,
        ]);
    }
    public function archived()
    {
        $applicants = Applicant::with([
            'user',
            'admissionApplications.academicProgram',
            'admissionApplications.documents',
        ])
            ->where('is_archived', true)
            ->latest()
            ->get();

        $applicants->each(function ($applicant) {
            $profileName = collect([
                $applicant->first_name,
                $applicant->middle_name,
                $applicant->last_name,
            ])
                ->filter()
                ->implode(' ');

            $applicant->display_name =
                $profileName ?: ($applicant->user?->name ?? 'Unnamed Applicant');
        });

        return response()->json([
            'success' => true,
            'message' => 'Archived applicants retrieved successfully.',
            'data' => $applicants,
        ]);
    }
}