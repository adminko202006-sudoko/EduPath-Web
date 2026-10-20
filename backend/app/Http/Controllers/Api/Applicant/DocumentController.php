<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Concerns\ServesApplicationDocumentFiles;
use App\Http\Controllers\Controller;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use App\Models\AdmissionApplication;
use App\Models\Applicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class DocumentController extends Controller
{
    use ServesApplicationDocumentFiles;

    /**
     * Display documents belonging to the applicant.
     */
    public function index(Request $request)
    {
        $applicant = $this->authenticatedApplicant($request);

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
        $applicant = $this->authenticatedApplicant($request);

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

        $path = $file->store('documents', 'local');

        if (!$path) {
            return $this->storageUnavailable();
        }

        $applicationDocument = $this->persistUpload($path, function () use ($application, $validated, $file, $path, $request) {
            $document = ApplicationDocument::create([
                'admission_application_id' => $application->id,
                'document_name' => $validated['document_name'],
                'file_path' => $path,
                'file_type' => $file->getMimeType(),
                'status' => 'pending',
            ]);
            ApplicationDocumentHistory::create([
                'application_document_id' => $document->id,
                'user_id' => $request->user()->id,
                'action' => 'uploaded',
                'old_status' => null,
                'new_status' => 'pending',
                'remarks' => 'Document uploaded by applicant.',
            ]);
            return $document;
        });

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
        $applicant = $this->authenticatedApplicant($request);

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
     * Stream the uploaded file for a document the applicant owns.
     */
    public function file(
        Request $request,
        ApplicationDocument $document
    ) {
        $applicant = $this->authenticatedApplicant($request);

        if (
            !$document->admissionApplication ||
            $document->admissionApplication->applicant_id !== $applicant->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        return $this->serveApplicationDocumentFile($document);
    }

    /**
     * Replace a rejected document.
     */
    public function replace(
        Request $request,
        ApplicationDocument $document
    ) {
        $applicant = $this->authenticatedApplicant($request);

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

        $newPath = $file->store('documents', 'local');

        if (!$newPath) {
            return $this->storageUnavailable();
        }

        $document = $this->persistUpload($newPath, function () use ($document, $newPath, $file, $request, $applicant) {
            $locked = ApplicationDocument::whereKey($document->id)->lockForUpdate()->firstOrFail();
            if ((int) $locked->admissionApplication?->applicant_id !== (int) $applicant->id) abort(403);
            if ($locked->status !== 'rejected') {
                throw ValidationException::withMessages(['document' => ['Only rejected documents can be replaced. Refresh the document status before trying again.']]);
            }
            $oldStatus = $locked->status;
            $locked->update([
                'file_path' => $newPath,
                'file_type' => $file->getMimeType(),
                'status' => 'pending',
                'remarks' => null,
            ]);
            ApplicationDocumentHistory::create([
                'application_document_id' => $locked->id,
                'user_id' => $request->user()->id,
                'action' => 'replaced',
                'old_status' => $oldStatus,
                'new_status' => 'pending',
                'remarks' => 'Rejected document replaced by applicant.',
            ]);
            // Retain the prior file. Removing historical uploads requires a
            // separately authorized retention/cleanup process.
            return $locked;
        });

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
        $applicant = $this->authenticatedApplicant($request);

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
            Storage::disk('local')->delete($document->file_path);
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully.',
        ]);
    }

    private function storageUnavailable()
    {
        Log::warning('Applicant document storage failed before metadata was written.');
        return response()->json([
            'success' => false,
            'message' => 'The document could not be stored. Please try again later.',
        ], 503);
    }

    /** Atomically write metadata/history; clean up only this newly stored file on failure. */
    private function persistUpload(string $path, callable $write)
    {
        try {
            return DB::transaction($write, 3);
        } catch (Throwable $error) {
            try {
                if (!Storage::disk('local')->delete($path)) {
                    Log::warning('A new document file could not be cleaned up after a failed database write.');
                }
            } catch (Throwable $cleanupError) {
                report($cleanupError);
            }
            throw $error;
        }
    }

    private function authenticatedApplicant(Request $request): Applicant
    {
        $applicant = $request->user()->applicant;
        if (!$applicant) {
            abort(response()->json([
                'success' => false,
                'message' => 'Applicant profile not found.',
            ], 403));
        }

        return $applicant;
    }
}
