<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use App\Models\AdmissionApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * Display documents belonging to the applicant.
     */
    public function index(Request $request)
    {
        $applicant = $request->user()->applicant;

        $documents = ApplicationDocument::whereHas(
            'admissionApplication',
            function ($query) use ($applicant) {
                $query->where('applicant_id', $applicant->id);
            }
        )
            ->with('admissionApplication')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Documents retrieved successfully.',
            'data' => $documents,
        ]);
    }

    /**
     * Upload a document for an admission application.
     */
    public function store(Request $request)
    {
        $applicant = $request->user()->applicant;

        $validated = $request->validate([
            'admission_application_id' => 'required|exists:admission_applications,id',
            'document_name' => 'required|string|max:255',
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $application = AdmissionApplication::where(
            'id',
            $validated['admission_application_id']
        )
            ->where('applicant_id', $applicant->id)
            ->first();

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $file = $request->file('document');

        $path = $file->store('documents', 'public');

        $applicationDocument = ApplicationDocument::create([
            'admission_application_id' => $application->id,
            'document_name' => $validated['document_name'],
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'status' => 'pending',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Record Document History
        |--------------------------------------------------------------------------
        */

        ApplicationDocumentHistory::create([
            'application_document_id' => $applicationDocument->id,
            'user_id' => $request->user()->id,
            'action' => 'uploaded',
            'old_status' => null,
            'new_status' => 'pending',
            'remarks' => 'Document uploaded by applicant.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully.',
            'data' => $applicationDocument,
        ], 201);
    }

    /**
     * Display a specific document.
     */
    public function show(
        Request $request,
        ApplicationDocument $document
    ) {
        $applicant = $request->user()->applicant;

        if (
            !$document->admissionApplication ||
            $document->admissionApplication->applicant_id !== $applicant->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $document->load(['histories.user', 'admissionApplication.academicProgram']);

        return response()->json([
            'success' => true,
            'message' => 'Document retrieved successfully.',
            'data' => $document,
        ]);
    }

    /**
     * Replace a rejected document.
     */
    public function replace(
        Request $request,
        ApplicationDocument $document
    ) {
        $applicant = $request->user()->applicant;

        if (
            !$document->admissionApplication ||
            $document->admissionApplication->applicant_id !== $applicant->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        if ($document->status !== 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Only rejected documents can be replaced.',
            ], 422);
        }

        $validated = $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $file = $request->file('document');

        $newPath = $file->store('documents', 'public');

        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $oldStatus = $document->status;

        $document->update([
            'file_path' => $newPath,
            'file_type' => $file->getClientMimeType(),
            'status' => 'pending',
            'remarks' => null,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Record Replacement History
        |--------------------------------------------------------------------------
        */

        ApplicationDocumentHistory::create([
            'application_document_id' => $document->id,
            'user_id' => $request->user()->id,
            'action' => 'replaced',
            'old_status' => $oldStatus,
            'new_status' => 'pending',
            'remarks' => 'Rejected document replaced by applicant.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document replaced successfully and is pending review.',
            'data' => $document->fresh(),
        ]);
    }

    /**
     * Delete an uploaded document.
     */
    public function destroy(
        Request $request,
        ApplicationDocument $document
    ) {
        $applicant = $request->user()->applicant;

        if (
            !$document->admissionApplication ||
            $document->admissionApplication->applicant_id !== $applicant->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | Record Deletion History Before Removing Document
        |--------------------------------------------------------------------------
        */

        ApplicationDocumentHistory::create([
            'application_document_id' => $document->id,
            'user_id' => $request->user()->id,
            'action' => 'deleted',
            'old_status' => $document->status,
            'new_status' => null,
            'remarks' => 'Document deleted by applicant.',
        ]);

        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully.',
        ]);
    }
}