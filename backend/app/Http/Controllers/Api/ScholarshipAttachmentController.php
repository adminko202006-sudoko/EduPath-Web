<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScholarshipApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ScholarshipAttachmentController extends Controller
{
    public function __invoke(Request $request, ScholarshipApplication $application, ?int $index = null)
    {
        $user = $request->user();
        $allowed = $user->role === 'admin';
        if ($user->role === 'applicant') {
            $allowed = $user->applicant && (int) $application->applicant_id === (int) $user->applicant->id;
        } elseif ($user->role === 'staff') {
            $staff = $user->staff;
            $allowed = $staff && $staff->status === 'active' && $staff->permissions?->manage_scholarships
                && $application->applicant->admissionApplications()->whereIn('academic_program_id', $staff->academicPrograms()->pluck('academic_programs.id'))->exists();
        }
        abort_unless($allowed, 403);
        $document = $index !== null ? ($application->requirement_documents[$index] ?? null) : null;
        if ($index !== null) abort_unless($document, 404);
        $path = $index !== null ? $document['path'] : $application->getRawOriginal('supporting_document_path');
        $name = $index !== null ? $document['name'] : $application->supporting_document_name;
        abort_unless($path && str_starts_with($path, 'scholarship-documents/') && !str_contains($path, '..') && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, $name, [
            'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
