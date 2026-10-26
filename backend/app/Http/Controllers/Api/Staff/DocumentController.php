<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Concerns\ServesApplicationDocumentFiles;
use App\Http\Controllers\Controller;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    use ServesApplicationDocumentFiles;

    /**
     * Get documents belonging to applicants
     * in programs assigned to the logged-in staff.
     */
    public function index(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $documents = ApplicationDocument::with([
            'admissionApplication.applicant.user',
            'admissionApplication.academicProgram',
        ])
            ->whereHas(
                'admissionApplication',
                function ($query) use ($programIds) {
                    $query->whereIn(
                        'academic_program_id',
                        $programIds
                    );
                }
            )
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Documents retrieved successfully.',
            'data' => $documents,
        ]);
    }

    /**
     * View a specific document.
     */
    public function show(
        Request $request,
        ApplicationDocument $document
    ) {
        $this->ensureAssignedDocument(
            $request,
            $document
        );

        $document->load([
            'admissionApplication.applicant.user',
            'admissionApplication.academicProgram',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document retrieved successfully.',
            'data' => $document,
        ]);
    }

    /**
     * Stream the uploaded file for a document in the staff's programs.
     */
    public function file(
        Request $request,
        ApplicationDocument $document
    ) {
        $this->ensureAssignedDocument(
            $request,
            $document
        );

        return $this->serveApplicationDocumentFile($document);
    }

    /**
     * Verify, reject, or update a document status.
     */
    public function update(
        Request $request,
        ApplicationDocument $document
    ) {
        $this->ensureAssignedDocument(
            $request,
            $document
        );

        $validated = $request->validate([
            'status' => 'required|in:pending,under_review,verified,rejected',
            'remarks' => 'nullable|string|max:1000',
        ]);

        app(\App\Services\WorkflowDecisionService::class)->documentReview($document, $validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Document status updated successfully.',
            'data' => $document->load([
                'admissionApplication.applicant.user',
                'admissionApplication.academicProgram',
            ]),
        ]);
    }

    /**
     * Get the active staff profile.
     */
    private function getActiveStaff(Request $request)
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

        return $staff;
    }

    /**
     * Make sure the document belongs to an applicant
     * in one of the staff's assigned programs.
     */
    private function ensureAssignedDocument(
        Request $request,
        ApplicationDocument $document
    ) {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $belongsToAssignedProgram = $document
            ->admissionApplication()
            ->whereIn(
                'academic_program_id',
                $programIds
            )
            ->exists();

        if (!$belongsToAssignedProgram) {
            abort(response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to access this document.',
            ], 403));
        }
    }
}