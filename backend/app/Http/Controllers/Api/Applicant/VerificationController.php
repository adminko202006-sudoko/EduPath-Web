<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\StudentVerification;
use App\Services\StudentVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    public function show(Request $request, StudentVerificationService $service)
    {
        $applicant = $request->user()->applicant;
        abort_unless($applicant, 403, 'Applicant profile not found.');
        $record = StudentVerification::with('academicProgram')->where('applicant_id', $applicant->id)->first();
        $verified = $record?->status === 'verified' && (bool) $request->user()->email_verified_at && !$applicant->is_archived;
        return response()->json(['data' => [
            'identity' => $record, 'email' => $request->user()->email,
            'email_verified' => (bool) $request->user()->email_verified_at,
            'can_apply' => $verified, 'can_apply_admission' => $verified && $record->student_type !== 'old',
            'scholarship_admission_satisfied' => $verified && $service->hasScholarshipAdmission($applicant),
        ]]);
    }

    public function submit(Request $request, StudentVerificationService $service)
    {
        $applicant = $request->user()->applicant;
        abort_unless($applicant, 403, 'Applicant profile not found.');
        $data = $service->validate($request, $applicant);
        $path = $request->file('school_id')->store('student-identities', 'local');
        abort_unless($path, 503, 'Your school ID could not be stored. Please try again.');
        try {
            DB::transaction(function () use ($applicant, $data, $path, $request, $service) {
                $locked = Applicant::whereKey($applicant->id)->lockForUpdate()->firstOrFail();
                $service->submit($locked, $data, $path, $request->user());
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($path);
            throw $error;
        }
        return response()->json(['message' => 'School identity submitted for administrator review.'], 201);
    }

    public function file(Request $request)
    {
        $record = StudentVerification::where('applicant_id', $request->user()->applicant?->id)->firstOrFail();
        abort_unless(Storage::disk('local')->exists($record->school_id_path), 404, 'School ID file is unavailable.');
        return Storage::disk('local')->download($record->school_id_path, 'school-id.'.pathinfo($record->school_id_path, PATHINFO_EXTENSION), ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
