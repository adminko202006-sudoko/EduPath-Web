<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
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

        $oldStatus = $document->status;
        $newStatus = $validated['status'];

        $document->update([
            'status' => $newStatus,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        // Record document status history.
        ApplicationDocumentHistory::create([
            'application_document_id' => $document->id,
            'user_id' => $request->user()->id,
            'action' => 'status_updated',
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        $applicant = $document->admissionApplication?->applicant;

        if ($applicant && $applicant->user) {

            $title = match ($newStatus) {
                'verified' => 'Document Verified',
                'under_review' => 'Document Under Review',
                'rejected' => 'Document Rejected',
                'pending' => 'Document Pending Review',
                default => 'Document Status Updated',
            };

            $message = match ($newStatus) {
                'verified' =>
                    "Your {$document->document_name} has been verified."
                    . (
                        $validated['remarks']
                            ? " Remarks: {$validated['remarks']}"
                            : ''
                    ),

                'under_review' =>
                    "Your {$document->document_name} is currently under review."
                    . (
                        $validated['remarks']
                            ? " Remarks: {$validated['remarks']}"
                            : ''
                    ),

                'rejected' =>
                    "Your {$document->document_name} has been rejected."
                    . (
                        $validated['remarks']
                            ? " Remarks: {$validated['remarks']}"
                            : ''
                    ),

                'pending' =>
                    "Your {$document->document_name} is pending review."
                    . (
                        $validated['remarks']
                            ? " Remarks: {$validated['remarks']}"
                            : ''
                    ),

                default =>
                    "The status of your {$document->document_name} has been updated.",
            };

            Notification::create([
                'user_id' => $applicant->user->id,
                'title' => $title,
                'message' => $message,
                'is_read' => false,
            ]);
        }

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