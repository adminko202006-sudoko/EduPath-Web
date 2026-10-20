<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ServesApplicationDocumentFiles;
use App\Http\Controllers\Controller;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    use ServesApplicationDocumentFiles;

    /**
     * Display all applicant documents.
     */
    public function index()
    {
        $documents = ApplicationDocument::with([
            'admissionApplication.applicant.user',
            'admissionApplication.academicProgram',
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Applicant documents retrieved successfully.',
            'data' => $documents,
        ]);
    }

    /**
     * Display a specific document.
     */
    public function show(ApplicationDocument $document)
    {
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
     * Stream the uploaded file for a document (admin only).
     */
    public function file(ApplicationDocument $document)
    {
        return $this->serveApplicationDocumentFile($document);
    }

    /**
     * Update document review status.
     */
    public function update(
        Request $request,
        ApplicationDocument $document
    ) {
        $validated = $request->validate([
            'status' => 'required|in:pending,under_review,verified,rejected',
            'remarks' => 'nullable|string',
        ]);

        app(\App\Services\WorkflowDecisionService::class)->documentReview($document, $validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Document review updated successfully.',
            'data' => $document->load([
                'admissionApplication.applicant.user',
                'admissionApplication.academicProgram',
            ]),
        ]);
    }

    /**
     * Delete a document.
     */
public function destroy(
    Request $request,
    ApplicationDocument $document
) {
    ApplicationDocumentHistory::create([
        'application_document_id' => $document->id,
        'user_id' => $request->user()->id,
        'action' => 'deleted',
        'old_status' => $document->status,
        'new_status' => null,
        'remarks' => 'Document deleted by administrator.',
    ]);

    if ($document->file_path) {
        Storage::disk('local')->delete(
            $document->file_path
        );
        Storage::disk('public')->delete(
            $document->file_path
        );
    }

    $document->delete();

    return response()->json([
        'success' => true,
        'message' => 'Document deleted successfully.',
    ]);
}
}
