<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ApplicationDocument;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

trait ServesApplicationDocumentFiles
{
    /**
     * Stream an applicant's uploaded document to an authorized requester.
     *
     * New uploads are stored on Laravel's private local disk. Older records
     * may still point to the public disk; retain a read-only fallback while
     * those files are migrated. Authorization is performed by the calling
     * controller before this method is invoked.
     */
    protected function serveApplicationDocumentFile(ApplicationDocument $document): Response
    {
        $path = $document->file_path;

        if (!$path) {
            return response()->json([
                'success' => false,
                'message' => 'Document file not found.',
            ], 404);
        }

        $disk = Storage::disk('local');
        if (!$disk->exists($path)) {
            $disk = Storage::disk('public');
        }

        if (!$disk->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Document file not found.',
            ], 404);
        }

        $response = response()->file($disk->path($path), [
            'Content-Type' => $document->file_type
                ?: $disk->mimeType($path),
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => 'attachment',
        ]);

        $response->headers->set('Cache-Control', 'private, max-age=0, no-store');

        return $response;
    }
}
